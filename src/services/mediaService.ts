import { registerPlugin, Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { dataUrlToBlob } from '../utils/canvasRenderer';

interface SaveImagePluginInterface {
  /** 核心接口：从原生文件路径直接写入相册，Bridge 只传一个短字符串，零 OOM 风险 */
  saveFromNativePath(options: {
    nativePath: string;
    fileName: string;
  }): Promise<{ success: boolean; path?: string; uri?: string }>;

  /** 兼容旧接口：仅用于小图（< 5MB），不要传大 PNG */
  saveImageToGallery(options: {
    base64Data: string;
    fileName: string;
  }): Promise<{ success: boolean; path?: string; uri?: string }>;
}

const SaveImage = registerPlugin<SaveImagePluginInterface>('SaveImage');

// ──────────────────────────────────────────────────────────────────────────
// 内部工具：将 Blob 按 64KB 分块写入 Capacitor Filesystem
// 每次 Bridge 调用只传 ~85KB base64，彻底不会触发 StringBuilder OOM
// ──────────────────────────────────────────────────────────────────────────
async function writeBlobToFilesystem(
  blob: Blob,
  path: string,
  directory: Directory,
  onProgress?: (pct: number) => void
): Promise<void> {
  const CHUNK = 64 * 1024; // 64KB per Bridge call
  const total = blob.size;
  const chunks = Math.max(1, Math.ceil(total / CHUNK));

  for (let i = 0; i < chunks; i++) {
    const start = i * CHUNK;
    const end = Math.min(total, start + CHUNK);
    const sliceBlob = blob.slice(start, end);

    // FileReader：只把这 64KB 切片读成 base64
    const b64 = await new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => {
        const s = fr.result as string;
        res(s.includes(',') ? s.substring(s.indexOf(',') + 1) : s);
      };
      fr.onerror = rej;
      fr.readAsDataURL(sliceBlob);
    });

    if (i === 0) {
      await Filesystem.writeFile({ path, data: b64, directory, recursive: true });
    } else {
      await Filesystem.appendFile({ path, data: b64, directory });
    }

    onProgress?.(Math.round(((i + 1) / chunks) * 90)); // 留 10% 给后续相册写入
  }
}

// ──────────────────────────────────────────────────────────────────────────
export const mediaService = {
  /**
   * 将 Blob 无损保存至手机相册。
   *
   * 核心流程（零 OOM）：
   *   1. JS 用 64KB 分块把 Blob 写入 Capacitor Cache 目录（每次 Bridge 调用 < 85KB）
   *   2. Filesystem.getUri() 获取原生 file:// 路径（只是一行短字符串）
   *   3. Java 插件的 saveFromNativePath() 用 64KB 缓冲流把文件注入 MediaStore
   *   4. 删除临时文件
   */
  async saveBlobToGallery(
    blob: Blob,
    customFileName?: string,
    onProgress?: (pct: number) => void
  ): Promise<{ success: boolean; message: string }> {
    const isPng = blob.type.includes('png');
    const ext = isPng ? 'png' : 'jpg';
    const fileName = customFileName || `摄影之神_${Date.now()}.${ext}`;
    const tempName = `_tmp_export_${Date.now()}.${ext}`;

    // ── Web 浏览器环境 ──────────────────────────────────────────────────
    if (!Capacitor.isNativePlatform()) {
      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        return { success: true, message: `已保存无损图像 (${fileName})` };
      } catch (e: any) {
        throw new Error('下载失败: ' + (e?.message ?? '浏览器阻止了下载'));
      }
    }

    // ── Android / iOS 原生环境 ────────────────────────────────────────
    let tempWritten = false;
    try {
      // 步骤 1：分块写入临时文件（64KB per Bridge 调用，绝对安全）
      await writeBlobToFilesystem(blob, tempName, Directory.Cache, onProgress);
      tempWritten = true;

      // 步骤 2：获取临时文件的原生 file:// 路径
      const { uri: nativePath } = await Filesystem.getUri({
        path: tempName,
        directory: Directory.Cache,
      });

      // 步骤 3：Java 侧用 64KB 流复制到系统相册——Bridge 只传文件路径短字符串
      const res = await SaveImage.saveFromNativePath({ nativePath, fileName });

      if (res?.success) {
        onProgress?.(100);
        return { success: true, message: '已成功无损保存至手机相册「摄影之神」目录！' };
      }
      throw new Error('saveFromNativePath 返回失败');
    } catch (err: any) {
      console.warn('原生 saveFromNativePath 失败，尝试 Filesystem 降级写入:', err);

      // 降级：直接把临时文件留在 Documents 目录告知用户
      if (!tempWritten) {
        try {
          await writeBlobToFilesystem(blob, `摄影之神/${fileName}`, Directory.Documents, onProgress);
          return {
            success: true,
            message: `已保存至手机存储 Documents/摄影之神/${fileName}`,
          };
        } catch (fsErr: any) {
          throw new Error('保存到手机失败: ' + (fsErr?.message ?? '写入异常'));
        }
      }
      throw new Error('保存失败: ' + (err?.message ?? '未知错误'));
    } finally {
      // 步骤 4：清除临时文件
      if (tempWritten) {
        try {
          await Filesystem.deleteFile({ path: tempName, directory: Directory.Cache });
        } catch (_) {}
      }
    }
  },

  /**
   * 兼容旧接口：接受 base64/dataURL，转为 Blob 后走分块流式保存通道
   */
  async saveToGallery(
    base64Data: string,
    customFileName?: string,
    onProgress?: (pct: number) => void
  ): Promise<{ success: boolean; message: string }> {
    const blob = dataUrlToBlob(base64Data);
    return this.saveBlobToGallery(blob, customFileName, onProgress);
  },
};

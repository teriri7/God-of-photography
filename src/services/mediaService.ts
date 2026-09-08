import { registerPlugin, Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { dataUrlToBlob } from '../utils/canvasRenderer';

interface SaveImagePluginInterface {
  startSaveSession(options: { fileName: string; mimeType: string }): Promise<{ success: boolean }>;
  writeChunk(options: { chunk: string }): Promise<{ success: boolean }>;
  finishSaveSession(options: {
    fileName: string;
    mimeType: string;
  }): Promise<{ success: boolean; path?: string; uri?: string }>;
  cancelSaveSession(): Promise<{ success: boolean }>;
  saveImageToGallery(options: {
    base64Data: string;
    fileName: string;
  }): Promise<{ success: boolean; path?: string; uri?: string }>;
}

const SaveImage = registerPlugin<SaveImagePluginInterface>('SaveImage');

export const mediaService = {
  /**
   * 将二进制 Blob 图像通过分块流式通道 100% 无损保存至手机相册 (Pictures/摄影之神)
   * 采用 512KB 分块流式写入机制，单次分块通信仅占几十KB内存，
   * 彻底根治 4K/8K 无损 PNG 导出时因 Base64 过长引发的 Android/鸿蒙系统 OOM 崩溃闪退！
   */
  async saveBlobToGallery(
    blob: Blob,
    customFileName?: string,
    onProgress?: (percent: number) => void
  ): Promise<{ success: boolean; message: string }> {
    const isPng = blob.type.includes('png');
    const defaultExt = isPng ? 'png' : 'jpg';
    const fileName = customFileName || `摄影之神_${Date.now()}.${defaultExt}`;
    const mimeType = blob.type || (isPng ? 'image/png' : 'image/jpeg');

    // 1. Android / iOS 原生应用环境：采用安全的分块流式保存
    if (Capacitor.isNativePlatform()) {
      let sessionStarted = false;
      try {
        await SaveImage.startSaveSession({
          fileName,
          mimeType,
        });
        sessionStarted = true;

        const CHUNK_SIZE = 512 * 1024; // 512KB 单块大小，桥接与 Java 虚拟机零内存压力
        const totalSize = blob.size;
        const totalChunks = Math.max(1, Math.ceil(totalSize / CHUNK_SIZE));

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(totalSize, start + CHUNK_SIZE);
          const chunkBlob = blob.slice(start, end);

          // 仅将当前的 512KB 切片读取为 Base64，用完即销毁
          const chunkBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              const b64 = res.includes(',') ? res.substring(res.indexOf(',') + 1) : res;
              resolve(b64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(chunkBlob);
          });

          await SaveImage.writeChunk({ chunk: chunkBase64 });
          const percent = Math.round(((i + 1) / totalChunks) * 100);
          onProgress?.(percent);
        }

        const res = await SaveImage.finishSaveSession({
          fileName,
          mimeType,
        });

        if (res && res.success) {
          return {
            success: true,
            message: '已成功无损保存至手机相册「摄影之神」目录！',
          };
        }
      } catch (nativeErr: any) {
        console.warn('原生无损流式保存遇到异常，尝试清理并降级写入:', nativeErr);
        if (sessionStarted) {
          try {
            await SaveImage.cancelSaveSession();
          } catch (_) {}
        }
      }

      // 降级兼容方案：使用 Filesystem 分块写入 Documents 目录
      try {
        const CHUNK_SIZE = 512 * 1024;
        const totalSize = blob.size;
        const totalChunks = Math.max(1, Math.ceil(totalSize / CHUNK_SIZE));

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(totalSize, start + CHUNK_SIZE);
          const chunkBlob = blob.slice(start, end);

          const chunkBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              const b64 = res.includes(',') ? res.substring(res.indexOf(',') + 1) : res;
              resolve(b64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(chunkBlob);
          });

          if (i === 0) {
            await Filesystem.writeFile({
              path: fileName,
              data: chunkBase64,
              directory: Directory.Documents,
            });
          } else {
            await Filesystem.appendFile({
              path: fileName,
              data: chunkBase64,
              directory: Directory.Documents,
            });
          }
        }
        return {
          success: true,
          message: `已保存至手机存储 (Documents/${fileName})`,
        };
      } catch (fsErr: any) {
        console.error('Filesystem 降级写入也失败:', fsErr);
        throw new Error('保存到手机失败: ' + (fsErr?.message || '存储写入失败'));
      }
    }

    // 2. Web 浏览器环境：原生 ObjectURL 零内存膨胀下载
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return { success: true, message: `已保存无损图像 (${fileName})` };
    } catch (webErr: any) {
      console.error('Web 下载失败:', webErr);
      throw new Error('下载失败: ' + (webErr?.message || '浏览器阻止了下载'));
    }
  },

  /**
   * 兼容旧接口：接收 Base64 或 DataURL 字符串，直接转走分块流式通道
   */
  async saveToGallery(
    base64Data: string,
    customFileName?: string,
    onProgress?: (percent: number) => void
  ): Promise<{ success: boolean; message: string }> {
    const blob = dataUrlToBlob(base64Data);
    return this.saveBlobToGallery(blob, customFileName, onProgress);
  },
};

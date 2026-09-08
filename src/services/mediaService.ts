import { registerPlugin, Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

interface SaveImagePluginInterface {
  saveImageToGallery(options: {
    base64Data: string;
    fileName: string;
  }): Promise<{ success: boolean; path?: string; uri?: string }>;
}

const SaveImage = registerPlugin<SaveImagePluginInterface>('SaveImage');

export const mediaService = {
  /**
   * 将图像（Base64 或 Data URL）真正保存至手机系统相册 (Pictures/摄影之神)
   * 在 Android 上通过 MediaStore 写入系统媒体库，相册可立即可见；
   * 在 Web 浏览器端自动回退至标准文件下载。
   */
  async saveToGallery(
    base64Data: string,
    customFileName?: string
  ): Promise<{ success: boolean; message: string }> {
    const timestamp = Date.now();
    const isJpeg =
      base64Data.startsWith('data:image/jpeg') ||
      base64Data.startsWith('data:image/jpg');
    const ext = isJpeg ? 'jpg' : 'png';
    const fileName = customFileName || `摄影之神_${timestamp}.${ext}`;

    // 1. Android / iOS 原生应用环境
    if (Capacitor.isNativePlatform()) {
      try {
        // 首选：调用自定义原生 MediaStore 插件写入相册
        const res = await SaveImage.saveImageToGallery({
          base64Data,
          fileName,
        });
        if (res && res.success) {
          return {
            success: true,
            message: '已成功保存至手机相册「摄影之神」目录！',
          };
        }
      } catch (nativeErr: any) {
        console.warn('原生 MediaStore 插件调用失败，尝试 Filesystem 兼容方案:', nativeErr);
      }

      // 降级方案：使用 @capacitor/filesystem 写入 Documents
      try {
        let cleanBase64 = base64Data;
        if (cleanBase64.includes(',')) {
          cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(',') + 1);
        }
        await Filesystem.writeFile({
          path: fileName,
          data: cleanBase64,
          directory: Directory.Documents,
        });
        return {
          success: true,
          message: `已保存至手机存储 (Documents/${fileName})`,
        };
      } catch (fsErr: any) {
        console.error('Filesystem 写入也失败:', fsErr);
        throw new Error('保存到手机失败: ' + (fsErr?.message || '存储写入失败'));
      }
    }

    // 2. Web 浏览器环境：创建 <a> 标签下载
    try {
      const link = document.createElement('a');
      link.href = base64Data;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true, message: `已保存高清图像 (${fileName})` };
    } catch (webErr: any) {
      console.error('Web 下载失败:', webErr);
      throw new Error('下载失败: ' + (webErr?.message || '浏览器阻止了下载'));
    }
  },
};

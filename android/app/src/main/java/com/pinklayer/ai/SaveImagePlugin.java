package com.pinklayer.ai;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "SaveImage")
public class SaveImagePlugin extends Plugin {

    private File currentTempFile = null;
    private FileOutputStream currentFos = null;
    private final Object streamLock = new Object();

    /**
     * 启动无损大图流式保存会话
     * 在 App 私有缓存目录中创建临时输出流，分段接收数据，从源头上解决超大 Base64 撑爆 JS-Native 通信桥梁的 OOM 闪退
     */
    @PluginMethod
    public void startSaveSession(PluginCall call) {
        synchronized (streamLock) {
            try {
                cleanupCurrentSession();

                File cacheDir = getContext().getCacheDir();
                File exportDir = new File(cacheDir, "exports");
                if (!exportDir.exists()) {
                    exportDir.mkdirs();
                }

                currentTempFile = new File(exportDir, "export_" + System.currentTimeMillis() + ".tmp");
                currentFos = new FileOutputStream(currentTempFile);

                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } catch (Throwable t) {
                t.printStackTrace();
                cleanupCurrentSession();
                call.reject("启动无损流式保存会话失败: " + t.getMessage());
            }
        }
    }

    /**
     * 写入一个 256KB ~ 512KB 的小分块数据
     * 单次传输仅需极小内存（<1MB），绝不会触发 StringBuilder 75MB 连续内存申请导致的 OOM
     */
    @PluginMethod
    public void writeChunk(PluginCall call) {
        String chunk = call.getString("chunk");
        if (chunk == null || chunk.isEmpty()) {
            call.resolve();
            return;
        }

        synchronized (streamLock) {
            try {
                if (currentFos == null) {
                    call.reject("保存会话未初始化或已关闭");
                    return;
                }

                byte[] chunkBytes = Base64.decode(chunk, Base64.DEFAULT);
                currentFos.write(chunkBytes);

                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } catch (Throwable t) {
                t.printStackTrace();
                call.reject("写入图像分块失败: " + t.getMessage());
            }
        }
    }

    /**
     * 完成分块流式写入，并将完整的无损 PNG/JPEG 图像安全注入系统相册
     */
    @PluginMethod
    public void finishSaveSession(PluginCall call) {
        String fileName = call.getString("fileName");
        if (fileName == null || fileName.isEmpty()) {
            fileName = "摄影之神_" + System.currentTimeMillis() + ".png";
        }

        synchronized (streamLock) {
            try {
                if (currentFos != null) {
                    currentFos.flush();
                    currentFos.close();
                    currentFos = null;
                }

                if (currentTempFile == null || !currentTempFile.exists() || currentTempFile.length() == 0) {
                    cleanupCurrentSession();
                    call.reject("临时图像文件不存在或为空");
                    return;
                }

                Context context = getContext();
                ContentResolver resolver = context.getContentResolver();

                String lower = fileName.toLowerCase();
                String mimeType = (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) ? "image/jpeg" : "image/png";

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    // Android 10+ (包含鸿蒙4.2)：通过 MediaStore 写入相册
                    ContentValues contentValues = new ContentValues();
                    contentValues.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
                    contentValues.put(MediaStore.Images.Media.MIME_TYPE, mimeType);
                    contentValues.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + File.separator + "摄影之神");
                    contentValues.put(MediaStore.Images.Media.IS_PENDING, 1);

                    Uri uri = null;
                    try {
                        uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues);
                    } catch (Throwable insertErr) {
                        contentValues.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES);
                        uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues);
                    }

                    if (uri == null) {
                        cleanupCurrentSession();
                        call.reject("系统相册创建记录失败，返回空 URI");
                        return;
                    }

                    // 采用 64KB 缓冲流式拷入系统相册，全程内存占用不超过 64KB！
                    try (InputStream in = new FileInputStream(currentTempFile);
                         OutputStream out = resolver.openOutputStream(uri)) {
                        if (out == null) {
                            cleanupCurrentSession();
                            call.reject("无法打开相册输出流");
                            return;
                        }

                        byte[] buffer = new byte[65536];
                        int bytesRead;
                        while ((bytesRead = in.read(buffer)) != -1) {
                            out.write(buffer, 0, bytesRead);
                        }
                        out.flush();
                    }

                    contentValues.clear();
                    contentValues.put(MediaStore.Images.Media.IS_PENDING, 0);
                    try {
                        resolver.update(uri, contentValues, null, null);
                    } catch (Throwable updateErr) {
                        updateErr.printStackTrace();
                    }

                    cleanupCurrentSession();

                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    ret.put("uri", uri.toString());
                    ret.put("path", "Pictures/摄影之神/" + fileName);
                    call.resolve(ret);
                } else {
                    // Android 9 及以下兼容写入
                    File picturesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
                    File appDir = new File(picturesDir, "摄影之神");
                    if (!appDir.exists()) {
                        appDir.mkdirs();
                    }
                    File destFile = new File(appDir, fileName);

                    try (InputStream in = new FileInputStream(currentTempFile);
                         OutputStream out = new FileOutputStream(destFile)) {
                        byte[] buffer = new byte[65536];
                        int bytesRead;
                        while ((bytesRead = in.read(buffer)) != -1) {
                            out.write(buffer, 0, bytesRead);
                        }
                        out.flush();
                    }

                    cleanupCurrentSession();

                    MediaScannerConnection.scanFile(
                        context,
                        new String[]{destFile.getAbsolutePath()},
                        new String[]{mimeType},
                        (scannedPath, scannedUri) -> {
                            JSObject ret = new JSObject();
                            ret.put("success", true);
                            ret.put("path", scannedPath != null ? scannedPath : destFile.getAbsolutePath());
                            call.resolve(ret);
                        }
                    );
                }
            } catch (Throwable t) {
                t.printStackTrace();
                cleanupCurrentSession();
                call.reject("保存到手机相册失败: " + (t.getMessage() != null ? t.getMessage() : "存储写入异常"));
            }
        }
    }

    /**
     * 取消会话并清理临时文件
     */
    @PluginMethod
    public void cancelSaveSession(PluginCall call) {
        synchronized (streamLock) {
            cleanupCurrentSession();
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        }
    }

    private void cleanupCurrentSession() {
        try {
            if (currentFos != null) {
                currentFos.close();
            }
        } catch (Throwable ignored) {}
        currentFos = null;

        try {
            if (currentTempFile != null && currentTempFile.exists()) {
                currentTempFile.delete();
            }
        } catch (Throwable ignored) {}
        currentTempFile = null;
    }

    /**
     * 兼容旧接口：小图或普通 Base64 一次性写入
     */
    @PluginMethod
    public void saveImageToGallery(PluginCall call) {
        String base64Data = call.getString("base64Data");
        String fileName = call.getString("fileName");

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("base64Data 不能为空");
            return;
        }

        if (fileName == null || fileName.isEmpty()) {
            fileName = "摄影之神_" + System.currentTimeMillis() + ".png";
        }

        if (base64Data.contains(",")) {
            base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
        }

        try {
            byte[] imageBytes = Base64.decode(base64Data, Base64.DEFAULT);
            base64Data = null;
            Context context = getContext();
            ContentResolver resolver = context.getContentResolver();

            String lower = fileName.toLowerCase();
            String mimeType = (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) ? "image/jpeg" : "image/png";

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues contentValues = new ContentValues();
                contentValues.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
                contentValues.put(MediaStore.Images.Media.MIME_TYPE, mimeType);
                contentValues.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + File.separator + "摄影之神");
                contentValues.put(MediaStore.Images.Media.IS_PENDING, 1);

                Uri uri = null;
                try {
                    uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues);
                } catch (Throwable insertErr) {
                    contentValues.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES);
                    uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues);
                }

                if (uri == null) {
                    call.reject("相册创建失败，系统返回空 URI");
                    return;
                }

                try (OutputStream out = resolver.openOutputStream(uri)) {
                    if (out != null) {
                        out.write(imageBytes);
                        out.flush();
                    }
                }

                contentValues.clear();
                contentValues.put(MediaStore.Images.Media.IS_PENDING, 0);
                try {
                    resolver.update(uri, contentValues, null, null);
                } catch (Throwable updateErr) {
                    updateErr.printStackTrace();
                }

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("uri", uri.toString());
                ret.put("path", "Pictures/摄影之神/" + fileName);
                call.resolve(ret);
            } else {
                File picturesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
                File appDir = new File(picturesDir, "摄影之神");
                if (!appDir.exists()) {
                    appDir.mkdirs();
                }
                File imageFile = new File(appDir, fileName);
                try (FileOutputStream fos = new FileOutputStream(imageFile)) {
                    fos.write(imageBytes);
                    fos.flush();
                }

                MediaScannerConnection.scanFile(
                    context,
                    new String[]{imageFile.getAbsolutePath()},
                    new String[]{mimeType},
                    (scannedPath, scannedUri) -> {
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        ret.put("path", scannedPath != null ? scannedPath : imageFile.getAbsolutePath());
                        call.resolve(ret);
                    }
                );
            }
        } catch (Throwable t) {
            t.printStackTrace();
            call.reject("保存到手机相册失败: " + (t.getMessage() != null ? t.getMessage() : "内存不足或系统权限限制"));
        }
    }
}

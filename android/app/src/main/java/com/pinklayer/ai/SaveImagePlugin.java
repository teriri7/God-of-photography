package com.pinklayer.ai;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

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
import java.net.URI;

@CapacitorPlugin(name = "SaveImage")
public class SaveImagePlugin extends Plugin {

    /**
     * 核心保存方法：从原生文件路径直接流式拷贝到系统相册
     * Bridge 只传递一个短字符串（文件路径），绝对不传大数据，从根源上消灭 OOM！
     *
     * 调用方式：
     * JS 侧先把图片数据分 64KB 小块写入 Capacitor Filesystem（Documents 或 Cache），
     * 用 Filesystem.getUri() 获取原生 file:// URI，
     * 然后把这个短 URI 传给本方法，由 Java 负责把文件注入系统媒体库。
     */
    @PluginMethod
    public void saveFromNativePath(PluginCall call) {
        String nativePath = call.getString("nativePath");
        String fileName   = call.getString("fileName");

        if (nativePath == null || nativePath.isEmpty()) {
            call.reject("nativePath 不能为空");
            return;
        }
        if (fileName == null || fileName.isEmpty()) {
            fileName = "摄影之神_" + System.currentTimeMillis() + ".png";
        }

        try {
            // 将 content:// 或 file:// URI 解析为实际文件对象
            File srcFile;
            if (nativePath.startsWith("file://")) {
                srcFile = new File(URI.create(nativePath));
            } else if (nativePath.startsWith("content://")) {
                // content:// 形式，直接用 ContentResolver 读取
                srcFile = null;
            } else {
                srcFile = new File(nativePath);
            }

            Context context = getContext();
            ContentResolver resolver = context.getContentResolver();

            String lower = fileName.toLowerCase();
            String mimeType = (lower.endsWith(".jpg") || lower.endsWith(".jpeg"))
                ? "image/jpeg" : "image/png";

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
                cv.put(MediaStore.Images.Media.MIME_TYPE, mimeType);
                cv.put(MediaStore.Images.Media.IS_PENDING, 1);

                // 尝试写入「摄影之神」子目录，失败则降级到 Pictures 根目录
                Uri uri = null;
                String[] relativePaths = {
                    Environment.DIRECTORY_PICTURES + File.separator + "摄影之神",
                    Environment.DIRECTORY_PICTURES
                };
                for (String rp : relativePaths) {
                    try {
                        cv.put(MediaStore.Images.Media.RELATIVE_PATH, rp);
                        uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv);
                        if (uri != null) break;
                    } catch (Throwable ignored) {}
                }

                if (uri == null) {
                    call.reject("系统相册创建记录失败，返回空 URI");
                    return;
                }

                // 用 64KB 缓冲流式拷贝，全程内存占用 < 100KB
                try (InputStream in  = openInputStream(nativePath, srcFile, resolver);
                     OutputStream out = resolver.openOutputStream(uri)) {
                    if (in == null || out == null) {
                        resolver.delete(uri, null, null);
                        call.reject("无法打开源文件或目标输出流");
                        return;
                    }
                    byte[] buf = new byte[65536]; // 64KB 缓冲
                    int n;
                    while ((n = in.read(buf)) != -1) {
                        out.write(buf, 0, n);
                    }
                    out.flush();
                }

                cv.clear();
                cv.put(MediaStore.Images.Media.IS_PENDING, 0);
                try { resolver.update(uri, cv, null, null); } catch (Throwable ignored) {}

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("uri", uri.toString());
                ret.put("path", "Pictures/摄影之神/" + fileName);
                call.resolve(ret);

            } else {
                // Android 9 及以下：写入公共 Pictures 目录
                File destDir = new File(
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES),
                    "摄影之神"
                );
                if (!destDir.exists()) destDir.mkdirs();
                File destFile = new File(destDir, fileName);

                try (InputStream in  = openInputStream(nativePath, srcFile, resolver);
                     OutputStream out = new FileOutputStream(destFile)) {
                    if (in == null) {
                        call.reject("无法打开源文件");
                        return;
                    }
                    byte[] buf = new byte[65536];
                    int n;
                    while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
                    out.flush();
                }

                MediaScannerConnection.scanFile(
                    context,
                    new String[]{destFile.getAbsolutePath()},
                    new String[]{mimeType},
                    (path, scanUri) -> {
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        ret.put("path", path != null ? path : destFile.getAbsolutePath());
                        call.resolve(ret);
                    }
                );
            }
        } catch (Throwable t) {
            t.printStackTrace();
            call.reject("保存到手机相册失败: " + (t.getMessage() != null ? t.getMessage() : "存储写入异常"));
        }
    }

    // 兼容 file://, content:// 及普通路径的通用输入流打开
    private InputStream openInputStream(String nativePath, File srcFile, ContentResolver resolver) {
        try {
            if (nativePath.startsWith("content://")) {
                return resolver.openInputStream(Uri.parse(nativePath));
            } else if (srcFile != null && srcFile.exists()) {
                return new FileInputStream(srcFile);
            }
        } catch (Throwable ignored) {}
        return null;
    }

    /**
     * 兼容旧接口保留（小图或特殊场景直接传 Base64 使用）
     * 大图请勿调用此方法，改用 saveFromNativePath
     */
    @PluginMethod
    public void saveImageToGallery(PluginCall call) {
        String base64Data = call.getString("base64Data");
        String fileName   = call.getString("fileName");

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
            byte[] imageBytes = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT);
            base64Data = null; // GC 可及时回收

            Context context = getContext();
            ContentResolver resolver = context.getContentResolver();
            String lower    = fileName.toLowerCase();
            String mimeType = (lower.endsWith(".jpg") || lower.endsWith(".jpeg"))
                ? "image/jpeg" : "image/png";

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
                cv.put(MediaStore.Images.Media.MIME_TYPE, mimeType);
                cv.put(MediaStore.Images.Media.IS_PENDING, 1);

                Uri uri = null;
                String[] relativePaths = {
                    Environment.DIRECTORY_PICTURES + File.separator + "摄影之神",
                    Environment.DIRECTORY_PICTURES
                };
                for (String rp : relativePaths) {
                    try {
                        cv.put(MediaStore.Images.Media.RELATIVE_PATH, rp);
                        uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv);
                        if (uri != null) break;
                    } catch (Throwable ignored) {}
                }

                if (uri == null) {
                    call.reject("相册创建失败，系统返回空 URI");
                    return;
                }
                try (OutputStream out = resolver.openOutputStream(uri)) {
                    if (out != null) { out.write(imageBytes); out.flush(); }
                }
                cv.clear();
                cv.put(MediaStore.Images.Media.IS_PENDING, 0);
                try { resolver.update(uri, cv, null, null); } catch (Throwable ignored) {}

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("uri", uri.toString());
                ret.put("path", "Pictures/摄影之神/" + fileName);
                call.resolve(ret);
            } else {
                File destDir = new File(
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES),
                    "摄影之神"
                );
                if (!destDir.exists()) destDir.mkdirs();
                File imageFile = new File(destDir, fileName);
                try (FileOutputStream fos = new FileOutputStream(imageFile)) {
                    fos.write(imageBytes); fos.flush();
                }
                MediaScannerConnection.scanFile(
                    context,
                    new String[]{imageFile.getAbsolutePath()},
                    new String[]{mimeType},
                    (p, u) -> {
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        ret.put("path", p != null ? p : imageFile.getAbsolutePath());
                        call.resolve(ret);
                    }
                );
            }
        } catch (Throwable t) {
            t.printStackTrace();
            call.reject("保存失败: " + (t.getMessage() != null ? t.getMessage() : "内存不足或权限限制"));
        }
    }
}

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
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "SaveImage")
public class SaveImagePlugin extends Plugin {

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

        // 去除可能的 data URL 前缀，例如 "data:image/png;base64," 或 "data:image/jpeg;base64,"
        if (base64Data.contains(",")) {
            base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
        }

        try {
            byte[] imageBytes = Base64.decode(base64Data, Base64.DEFAULT);
            Context context = getContext();
            ContentResolver resolver = context.getContentResolver();

            String lower = fileName.toLowerCase();
            String mimeType = (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) ? "image/jpeg" : "image/png";

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ (API 29及以上)：通过 MediaStore 写入 Pictures/摄影之神 专属相册
                ContentValues contentValues = new ContentValues();
                contentValues.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
                contentValues.put(MediaStore.Images.Media.MIME_TYPE, mimeType);
                contentValues.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + File.separator + "摄影之神");
                contentValues.put(MediaStore.Images.Media.IS_PENDING, 1);

                Uri uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues);
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
                resolver.update(uri, contentValues, null, null);

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("uri", uri.toString());
                ret.put("path", "Pictures/摄影之神/" + fileName);
                call.resolve(ret);
            } else {
                // Android 9及以下兼容：写入公共图片目录并通知 MediaScanner 刷新
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
        } catch (Exception e) {
            e.printStackTrace();
            call.reject("保存到手机相册失败: " + e.getMessage());
        }
    }
}

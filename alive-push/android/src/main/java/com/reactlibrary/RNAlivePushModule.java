
package com.reactlibrary;

import android.os.AsyncTask;
import android.os.Environment;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReadableMap;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.nio.Buffer;

public class RNAlivePushModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;
    private final String CacheFolderName = ".alivepush";
    private final String ConfigFileName = ".config";
    private final String FieldDeploymentKey = "deploymentKey";
    private String deploymentKey;

    public RNAlivePushModule(ReactApplicationContext reactContext) throws MalformedURLException {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "RNAlivePush";
    }


    @ReactMethod
    public void sync(ReadableMap options,
                     final Callback statusCallback,
                     final Callback progressCallback,
                     Callback errorCallback) {
        String imageUrl = "http://www.dabaoku.com/sucaidatu/dongwu/chongwujingling/953838.JPG";
        new DownloadFile(imageUrl, new DownloadCallbackInterface() {
            @Override
            public void DownloadProgress(Progress progress) {
                if (progressCallback != null) {
                    progressCallback.invoke(progress);
                }
            }

            @Override
            public void DownloadStatusChange(String status) {
                if (statusCallback != null) {
                    statusCallback.invoke(status);
                }
            }
        }, this.getTempPath(), "image.jpg");
        /*
        try {
            JSONObject config = this.getRemoteConfig(options.getString(this.FieldDeploymentKey));
        } catch (Exception ex) {
            if (errorCallback != null) {
                errorCallback.invoke(ex);
            }
        }
        */

    }

    protected boolean sdCardIsEnable() {
        return Environment.getExternalStorageState().equals(Environment.MEDIA_MOUNTED);
    }

    protected String getCachePath() {
        File sdCard = Environment.getExternalStorageDirectory();
        File cache = new File(sdCard.getAbsolutePath(), this.CacheFolderName);
        if (!cache.exists()) {
            cache.mkdirs();
        }
        return cache.getPath();
    }

    protected String getTempPath() {
        String cachePath = this.getCachePath();
        File temp = new File(cachePath, "temp");
        if (!temp.exists()) {
            temp.mkdirs();
        }
        return temp.getPath();
    }

    protected String getVersionPath(String versionName) {
        String cachePath = this.getCachePath();
        File version = new File(cachePath, versionName);
        if (!version.exists()) {
            version.mkdirs();
        }
        return version.getPath();
    }

    protected boolean hasNewVersion(String deploymentKey) {
        throw new UnsupportedOperationException();
    }

    protected void writeFileToExternalStorage(String path, String text) {
        throw new UnsupportedOperationException("此方法未实现");
    }

    protected JSONObject getRemoteConfig(String deploymentKey) throws JSONException, IOException {
        String configPath = getCachePath() + "/" + ConfigFileName;
        File config = new File(configPath);
        String jsonText;
        if (!config.exists()) {
            //TODO 下载配置文件并保存到缓存中
            URL remoteConfig = new URL("http://www.baidu.com");
            BufferedReader responseReader = new BufferedReader(new InputStreamReader(remoteConfig.openStream()));
            StringBuilder responseTextBuilder = new StringBuilder();
            String line;
            while ((line = responseReader.readLine()) != null) {
                responseTextBuilder.append(line);
            }
            responseReader.close();
            jsonText = responseTextBuilder.toStringSync();
            writeFileToExternalStorage(configPath, jsonText);
        } else {
            BufferedReader reader = new BufferedReader(new FileReader(config));
            StringBuilder builder = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                builder.append(line);
            }
            reader.close();
            jsonText = builder.toStringSync();
        }
        JSONObject data = new JSONObject(jsonText);
        return data;
    }


}

class Progress {
    public Progress(long received, long total) {
        this.received = received;
        this.total = total;
    }

    long total;

    public long getTotal() {
        return total;
    }

    long received;

    public long getReceived() {
        return received;
    }
}

interface DownloadCallbackInterface {
    void DownloadProgress(Progress progress);

    void DownloadStatusChange(String status);
}

class DownloadFile extends AsyncTask<String, Progress, Boolean> {
    final DownloadCallbackInterface callback;
    final String TempFolderName;
    final String FileName;
    final String url;

    public DownloadFile(String url, DownloadCallbackInterface callback, String tempFolderName, String fileName) {
        super();
        this.url = url;
        this.callback = callback;
        this.TempFolderName = tempFolderName;
        this.FileName = fileName;
    }

    /**
     * Before starting background thread Show Progress Bar Dialog
     */
    @Override
    protected void onPreExecute() {
        super.onPreExecute();
        //showDialog(progress_bar_type);
        if (this.callback != null) {
            this.callback.DownloadStatusChange("DOWNLOAD_BEGIN");
        }
    }

    /**
     * Downloading file in background thread
     */
    @Override
    protected Boolean doInBackground(String... params) {
        int count;
        try {
            URL url = new URL(params[0]);
            URLConnection connection = url.openConnection();
            connection.connect();

            // this will be useful so that you can show a tipical 0-100%
            // progress bar
            int lengthOfFile = connection.getContentLength();

            // download the file
            InputStream input = new BufferedInputStream(url.openStream(), 8192);

            File file = new File(this.TempFolderName, this.FileName);

            // Output stream
            OutputStream output = new FileOutputStream(file.getPath());

            byte data[] = new byte[1024];

            long received = 0;

            while ((count = input.read(data)) != -1) {
                received += count;
                // publishing the progress....
                // After this onProgressUpdate will be called
                //publishProgress("" + (int) ((total * 100) / lenghtOfFile));
                publishProgress(new Progress(received, lengthOfFile));
                // writing data to file
                output.write(data, 0, count);
            }

            // flushing output
            output.flush();

            // closing streams
            output.close();
            input.close();
            return true;
        } catch (Exception e) {
            Log.e("Error: ", e.getMessage());
        }

        return false;
    }

    protected void onProgressUpdate(Progress progress) {
        if (this.callback != null) {
            this.callback.DownloadStatusChange("DOWNLOAD_PROGRESS_UPDATE");
            this.callback.DownloadProgress(progress);
        }
    }

    @Override
    protected void onPostExecute(Boolean aBoolean) {
        if (this.callback != null) {
            this.callback.DownloadStatusChange("DOWNLOAD_END");
        }
    }
}

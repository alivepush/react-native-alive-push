
package com.reactlibrary;

import android.os.Environment;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

import java.io.File;
import java.net.MalformedURLException;

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


}


package com.reactlibrary;

import android.app.AlarmManager;
import android.app.Application;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Environment;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.test.BuildConfig;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.net.MalformedURLException;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nullable;

public class RNAlivePushModule extends ReactContextBaseJavaModule {

    private static String CACHE_NAME = ".alivepush";
    private static String ALIVE_PUSH_CONFIG_NAME = ".config";
    private static String LOG_TYPE_NAME = "AlivePush";

    private final ReactApplicationContext reactContext;

    public RNAlivePushModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    public static
    @Nullable
    String getJSBundleFile() {
        JSONObject config = RNAlivePushModule.getAlivePushConfig();
        if (config != null) {
            try {
                String path = config.getString("path");
                if (BuildConfig.DEBUG) {
                    Log.i(RNAlivePushModule.LOG_TYPE_NAME, "app will start from " + path);
                }
                return path;
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
        return null;
    }

    public static
    @Nullable
    JSONObject getAlivePushConfig() {
        File cache = RNAlivePushModule.getCache();
        if (cache != null) {
            File config = new File(cache.getPath(), RNAlivePushModule.ALIVE_PUSH_CONFIG_NAME);
            if (config.exists()) {
                try {
                    BufferedReader reader = new BufferedReader(new FileReader(config));
                    StringBuilder stringBuilder = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        stringBuilder.append(line);
                    }
                    reader.close();
                    if (BuildConfig.DEBUG) {
                        Log.i(RNAlivePushModule.LOG_TYPE_NAME, "Alive Push Config = \n" + stringBuilder.toString());
                    }
                    return new JSONObject(stringBuilder.toString());
                } catch (FileNotFoundException e) {
                    e.printStackTrace();
                } catch (IOException e) {
                    e.printStackTrace();
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
        }
        if (BuildConfig.DEBUG) {
            Log.i(RNAlivePushModule.LOG_TYPE_NAME, "Alive Push Config is not found");
        }
        return null;
    }

    public static boolean storageEnable() {
        String storageState = Environment.getExternalStorageState();
        boolean enable = storageState.equals(Environment.MEDIA_MOUNTED);
        if (BuildConfig.DEBUG) {
            Log.i(RNAlivePushModule.LOG_TYPE_NAME, "storage enable : " + enable);
        }
        return enable;
    }

    public static
    @Nullable
    File getCache() {
        if (RNAlivePushModule.storageEnable()) {
            File sdcard = Environment.getExternalStorageDirectory();
            File cache = new File(sdcard.getAbsolutePath(), RNAlivePushModule.CACHE_NAME);
            if (!cache.exists()) {
                cache.mkdirs();
            }
            if (BuildConfig.DEBUG) {
                Log.i(RNAlivePushModule.LOG_TYPE_NAME, "cache path = " + cache.getPath());
            }
            return cache;
        }
        return null;
    }

    @Override
    public String getName() {
        return "RNAlivePush";
    }

    @Nullable
    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        File cache = RNAlivePushModule.getCache();
        File config = null;
        if (cache != null) {
            config = new File(cache.getPath(), RNAlivePushModule.ALIVE_PUSH_CONFIG_NAME);
        }
        constants.put("CachePath", cache != null ? cache.getPath() : "");
        constants.put("AlivePushConfigPath", config != null ? config.getPath() : "");
        constants.put("VersionName", BuildConfig.VERSION_NAME);
        constants.put("VersionCode", BuildConfig.VERSION_CODE);
        return constants;
    }

    @ReactMethod
    public void restart() {
        Context applicationContext = this.reactContext.getApplicationContext();

        Intent startIntent = applicationContext.getPackageManager()
                .getLaunchIntentForPackage(applicationContext.getPackageName());

        int mPendingIntentId = 123456;

        PendingIntent mPendingIntent =
                PendingIntent.getActivity(applicationContext,
                        mPendingIntentId,
                        startIntent, PendingIntent.FLAG_CANCEL_CURRENT);
        AlarmManager mgr = (AlarmManager) applicationContext.getSystemService(Context.ALARM_SERVICE);
        mgr.set(AlarmManager.RTC, System.currentTimeMillis() + 100, mPendingIntent);
        System.exit(0);
    }
}

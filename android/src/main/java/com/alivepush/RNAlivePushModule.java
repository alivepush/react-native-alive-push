
package com.alivepush;

import android.app.AlarmManager;
import android.app.Application;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.telecom.Call;
import android.util.Log;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nullable;

public class RNAlivePushModule extends ReactContextBaseJavaModule {

    private static String ALIVE_PUSH_CONFIG_NAME = "config.data";
    private static String LOG_TYPE_NAME = "AlivePush";

    private final ReactApplicationContext reactContext;

    public static
    @Nullable
    JSONObject getAlivePushConfig(Context context) {
        PackageManager packageManager = context.getPackageManager();
        try {
            PackageInfo packageInfo = packageManager.getPackageInfo(context.getPackageName(), 0);
            String applicationPath = packageInfo.applicationInfo.dataDir;
            String versionName = packageInfo.versionName;
            File configFile = new File(applicationPath, RNAlivePushModule.ALIVE_PUSH_CONFIG_NAME + "." + versionName);
            if (configFile.exists()) {
                BufferedReader reader = new BufferedReader(new FileReader(configFile));
                StringBuilder stringBuilder = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    stringBuilder.append(line);
                }
                reader.close();
                JSONObject config = new JSONObject(stringBuilder.toString());
                return config;
            }
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (JSONException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * 获取bundle的路径
     */
    public static
    @Nullable
    String getJSBundleFile(Context context) {
        JSONObject config = getAlivePushConfig(context);
        if (config != null) {
            try {
                String bundlePath = config.getString("path");
                File bundleFile = new File(bundlePath);
                if (bundleFile.exists()) {
                    return bundlePath;
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
        return null;
    }

    /**
     * 获取asset的路径
     */
    public static
    @Nullable
    String getBundleAssetName(Context context) {
        JSONObject config = getAlivePushConfig(context);
        if (config != null) {
            try {
                String bundleAssetName = config.getString("assetPath");
                return bundleAssetName;
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
        return null;
    }


    public RNAlivePushModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    private
    @Nullable
    String getVersionName() {
        PackageManager packageManager = this.reactContext.getPackageManager();
        try {
            PackageInfo packageInfo = packageManager.getPackageInfo(this.reactContext.getPackageName(), 0);
            return packageInfo.versionName;
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }
        return "";
    }

    private
    @Nullable
    String getApplicationPath() {
        PackageManager packageManager = this.reactContext.getPackageManager();
        try {
            PackageInfo packageInfo = packageManager.getPackageInfo(this.reactContext.getPackageName(), 0);
            return packageInfo.applicationInfo.dataDir;
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }
        return null;
    }

    private
    @Nullable
    JSONObject getAlivePushConfig() {
        String cachePath = this.getApplicationPath();
        if (cachePath != null) {
            File config = new File(cachePath, RNAlivePushModule.ALIVE_PUSH_CONFIG_NAME + "." + this.getVersionName());
            if (config.exists()) {
                try {
                    BufferedReader reader = new BufferedReader(new FileReader(config));
                    StringBuilder stringBuilder = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        stringBuilder.append(line);
                    }
                    reader.close();
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
        String applicationPath = this.getApplicationPath();
        String alivePushConfigPath = "";
        String versionName = "";
        int versionCode = 0;
        String bundlePath = "";

        if (applicationPath != null) {
            File alivePushConfigFile = new File(applicationPath, RNAlivePushModule.ALIVE_PUSH_CONFIG_NAME + "." + this.getVersionName());
            if (!alivePushConfigFile.exists()) {
                try {
                    alivePushConfigFile.createNewFile();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            alivePushConfigPath = alivePushConfigFile.getPath();
        }

        JSONObject alivePushConfig = this.getAlivePushConfig();
        if (alivePushConfig != null) {
            try {
                bundlePath = alivePushConfig.getString("path");
                File bundleFile = new File(bundlePath);
                if (!bundleFile.exists()) {
                    bundlePath = "";
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        PackageManager packageManager = this.reactContext.getPackageManager();
        try {
            PackageInfo packageInfo = packageManager.getPackageInfo(this.reactContext.getPackageName(), 0);
            versionName = packageInfo.versionName;
            versionCode = packageInfo.versionCode;
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }
        constants.put("JSBundleFile", bundlePath);
        constants.put("CachePath", applicationPath);
        constants.put("AlivePushConfigPath", alivePushConfigPath);
        constants.put("VersionName", versionName);
        constants.put("VersionCode", versionCode);
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

    @ReactMethod
    public void reloadBundle(Callback callback) {
        Context context = this.reactContext.getApplicationContext();
        try {
            BundleManager.reloadBundle(context, getJSBundleFile(context));
            if (callback != null) {
                callback.invoke(null);
            }
        } catch (IllegalAccessException ex) {
            ex.printStackTrace();
            if (callback != null) {
                callback.invoke(ex.getMessage());
            }
        } catch (NoSuchMethodException ex) {
            ex.printStackTrace();
            if (callback != null) {
                callback.invoke(ex.getMessage());
            }
        } catch (InvocationTargetException ex) {
            ex.printStackTrace();
            if (callback != null) {
                callback.invoke(ex.getMessage());
            }
        }
    }
}

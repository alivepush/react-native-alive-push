
package com.alivepush;

import android.bluetooth.BluetoothAdapter;
import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.os.Build;
import android.provider.Settings;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.iid.InstanceID;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

import javax.annotation.Nullable;

public class RNAlivePushModule extends ReactContextBaseJavaModule {

    private static String ALIVE_PUSH_CONFIG_NAME = "config.data";
    private static String LOG_TYPE_NAME = "AlivePush";
    /**
     * bundle重新加载完成
     */
    private final String EVENT_BUNDLE_LOAD_ERROR = "EVENT_BUNDLE_LOAD_ERROR";

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

    public void emit(String event, Object data) {
        DeviceEventManagerModule.RCTDeviceEventEmitter emitter = this.reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
        if (emitter != null) {
            emitter.emit(event, data);
        }
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
        constants.put("EVENT_BUNDLE_LOAD_ERROR", EVENT_BUNDLE_LOAD_ERROR);


        //deviceInfo 相关
        String packageName = this.reactContext.getPackageName();
        constants.put("appVersion", "not available");
        constants.put("buildVersion", "not available");
        constants.put("buildNumber", 0);

        try {
            PackageInfo info = packageManager.getPackageInfo(packageName, 0);
            constants.put("appVersion", info.versionName);
            constants.put("buildNumber", info.versionCode);
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }

        String deviceName = "Unknown";

        try {
            BluetoothAdapter myDevice = BluetoothAdapter.getDefaultAdapter();
            deviceName = myDevice.getName();
        } catch (Exception e) {
            e.printStackTrace();
        }

        constants.put("instanceId", InstanceID.getInstance(this.reactContext).getId());
        constants.put("deviceName", deviceName);
        constants.put("systemName", "Android");
        constants.put("systemVersion", Build.VERSION.RELEASE);
        constants.put("model", Build.MODEL);
        constants.put("brand", Build.BRAND);
        constants.put("deviceId", Build.BOARD);
        constants.put("deviceLocale", this.getCurrentLanguage());
        constants.put("deviceCountry", this.getCurrentCountry());
        constants.put("uniqueId", Settings.Secure.getString(this.reactContext.getContentResolver(), Settings.Secure.ANDROID_ID));
        constants.put("systemManufacturer", Build.MANUFACTURER);
        constants.put("bundleId", packageName);
        constants.put("userAgent", System.getProperty("http.agent"));
        constants.put("timezone", TimeZone.getDefault().getID());
        constants.put("isEmulator", this.isEmulator());
        constants.put("isTablet", this.isTablet());

        return constants;
    }


    /**
     * 重新加载bundle
     */
    @ReactMethod
    public void reloadBundle() {
        final Context context = this.reactContext.getApplicationContext();
        this.reactContext.getCurrentActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    String bundlePath = getJSBundleFile(context);
                    if (bundlePath != null) {
                        BundleManager.reloadBundle(context, bundlePath);
                    } else {
                        emit(EVENT_BUNDLE_LOAD_ERROR, "bundle path is null");
                    }
                } catch (IllegalAccessException ex) {
                    ex.printStackTrace();
                    emit(EVENT_BUNDLE_LOAD_ERROR, ex.getMessage());
                } catch (NoSuchMethodException ex) {
                    ex.printStackTrace();
                    emit(EVENT_BUNDLE_LOAD_ERROR, ex.getMessage());
                } catch (InvocationTargetException ex) {
                    ex.printStackTrace();
                    Throwable t = ex.getTargetException();// 获取目标异常
                    t.printStackTrace();
                    emit(EVENT_BUNDLE_LOAD_ERROR, t.getMessage());
                } catch (NoSuchFieldException e) {
                    e.printStackTrace();
                    emit(EVENT_BUNDLE_LOAD_ERROR, e.getMessage());
                } catch (Exception e) {
                    e.printStackTrace();
                    emit(EVENT_BUNDLE_LOAD_ERROR, e.getMessage());
                }
            }
        });

    }

    /**
     * device Info 相关
     */

    private String getCurrentLanguage() {
        Locale current = getReactApplicationContext().getResources().getConfiguration().locale;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            return current.toLanguageTag();
        } else {
            StringBuilder builder = new StringBuilder();
            builder.append(current.getLanguage());
            if (current.getCountry() != null) {
                builder.append("-");
                builder.append(current.getCountry());
            }
            return builder.toString();
        }
    }

    private String getCurrentCountry() {
        Locale current = getReactApplicationContext().getResources().getConfiguration().locale;
        return current.getCountry();
    }

    private Boolean isEmulator() {
        return Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                || "google_sdk".equals(Build.PRODUCT);
    }

    private Boolean isTablet() {
        int layout = getReactApplicationContext().getResources().getConfiguration().screenLayout & Configuration.SCREENLAYOUT_SIZE_MASK;
        return layout == Configuration.SCREENLAYOUT_SIZE_LARGE || layout == Configuration.SCREENLAYOUT_SIZE_XLARGE;
    }


}

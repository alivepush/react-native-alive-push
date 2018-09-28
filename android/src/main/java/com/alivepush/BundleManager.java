package com.alivepush;

import android.content.Context;

import com.facebook.react.JSCConfig;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.cxxbridge.JSBundleLoader;
import com.facebook.react.cxxbridge.JSCJavaScriptExecutor;
import com.facebook.react.cxxbridge.JavaScriptExecutor;

import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

/**
 * Created by jean.h.ma on 03/07/2018.
 */
public class BundleManager {
    private static ReactInstanceManager reactInstanceManager;

    /**
     * 初始化BundleManager
     *
     * @param reactInstanceManager
     */
    public static void init(ReactInstanceManager reactInstanceManager) {
        BundleManager.reactInstanceManager = reactInstanceManager;
    }

    /**
     * 重新加载bundle
     *
     * @param context
     * @param bundlePath
     * @throws InvocationTargetException
     * @throws IllegalAccessException
     * @throws NoSuchMethodException
     */
    public static void reloadBundle(Context context, String bundlePath) throws
            InvocationTargetException,
            IllegalAccessException,
            NoSuchMethodException,
            NoSuchFieldException {
        if (reactInstanceManager != null) {
            Class<?> reactInstanceManagerClass = reactInstanceManager.getClass();
            Method recreateReactContextInBackgroundMethod = reactInstanceManagerClass.getDeclaredMethod("recreateReactContextInBackground",
                    JavaScriptExecutor.Factory.class, JSBundleLoader.class);
            recreateReactContextInBackgroundMethod.setAccessible(true);
            Field mJSCConfigField = reactInstanceManagerClass.getDeclaredField("mJSCConfig"); //NoSuchFieldException
            mJSCConfigField.setAccessible(true);
            JSCConfig jscConfig = (JSCConfig) mJSCConfigField.get(reactInstanceManager); //IllegalAccessException
            JSCJavaScriptExecutor.Factory javaScriptExecutorFactory = new JSCJavaScriptExecutor.Factory(jscConfig.getConfigMap());
            JSBundleLoader bundleLoader = JSBundleLoader.createFileLoader(bundlePath);
            recreateReactContextInBackgroundMethod.invoke(reactInstanceManager, javaScriptExecutorFactory, bundleLoader);
        } else {
            throw new NullPointerException("reactInstanceManager is null,Please init BundleManager via method BundleManager.init");
        }
    }
}

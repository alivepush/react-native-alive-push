package com.alivepush;

import android.content.Context;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.JSCJavaScriptExecutor;
import com.facebook.react.bridge.JavaScriptExecutor;

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
    public static void reloadBundle(Context context, String bundlePath)
            throws InvocationTargetException, IllegalAccessException, NoSuchMethodException {
        if (reactInstanceManager != null) {
            Class<?> RIManagerClazz = reactInstanceManager.getClass();
            Method method = RIManagerClazz.getDeclaredMethod("recreateReactContextInBackground",
                    JavaScriptExecutor.class, JSBundleLoader.class);
            method.setAccessible(true);
            method.invoke(reactInstanceManager,
                    new JSCJavaScriptExecutor(),
                    JSBundleLoader.createFileLoader(context, bundlePath));
        } else {
            throw new NullPointerException("reactInstanceManager is null");
        }
    }
}

# react-native-alive-push

react native 热更新,目前这个版本是基于`react-native@0.44.0`开发的,支持热加载.

<!-- badge -->

[![npm version](https://img.shields.io/npm/v/react-native-alive-push.svg)](https://www.npmjs.com/package/react-native-alive-push)
[![npm license](https://img.shields.io/npm/l/react-native-alive-push.svg)](https://www.npmjs.com/package/react-native-alive-push)
[![npm download](https://img.shields.io/npm/dm/react-native-alive-push.svg)](https://www.npmjs.com/package/react-native-alive-push)
[![npm download](https://img.shields.io/npm/dt/react-native-alive-push.svg)](https://www.npmjs.com/package/react-native-alive-push)

<!-- endbadge -->

## Getting started

`$ npm install react-native-alive-push --save`

alive-push安装好之后默认会进行link,如果link失败请手动link

### Mostly automatic installation

`$ react-native link react-native-alive-push`

## 快速使用

```javascript
import React,{Component} from "react"
import {AppRegistry} from "react-native"
import alivepush from "react-native-alive-push"

class App extends Component{
    ...
}

const AlivePushApp=alivepush({
    deployment:""
})(App)

AppRegistry.registerComponent('TestAlivePush', () => AlivePushApp);

```

## 集成

### Android

> 需要重写`getJSBundleFile`方法

```java
@Nullable
@Override
protected String getJSBundleFile() {
    return RNAlivePushModule.getJSBundleFile(MainApplication.this);
}
```

### IOS

在AppDelegate.m中添加 

```objective-c
#import "RNAlivePush.h"

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions{
    ...
    NSURL *jsCodeLocation = [RNAlivePush getJSBundleFile];
    ...
} 
```

## Change

### 0.0.3 ~ 0.0.8

-   更新包的目录结构调整.`APPLICATION_DATA_DIR/INNER_VERSION`调整为`APPLICATION_DATA_DIR/VERSION_NAME/INNER_VERSION`
-   更新了android的package name并修改了android的部分bug
-   checkupdate的时候不使用缓存(url添加随机数)
-   添加了debug模式
-   修复了IOS安装的问题
-   修改IOS奔溃问题

### 0.0.2

-   android/ios alivepush配置文件添加了versionName后缀
-   android支持asset-dest bundle
-   修改了下载完成后feedback失败的bug
-   修改了覆盖安装时访问老版本的bug
-   优化了alive-push代码

## 交流群

<img src="https://raw.githubusercontent.com/alivepush/react-native-alive-push/master/assets/qr1.jpg" width="120"/>
<img src="https://raw.githubusercontent.com/alivepush/react-native-alive-push/master/assets/qr2.jpg" width="120"/>

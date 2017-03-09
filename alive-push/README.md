
# react-native-alive-push

## 依赖项

需要依赖以下library,请先进行安装

* react-native-device-info
* react-native-fetch-blob
* react-native-zip-archive


## Getting started

`$ npm install react-native-alive-push --save`

### Mostly automatic installation

`$ react-native link react-native-alive-push`

## Usage

### 重写 ReactNativeHost 的 getJSBundleFile 方法

#### Android

```java
@Nullable
@Override
protected String getJSBundleFile() {
    return RNAlivePushModule.getJSBundleFile();
}
```

#### IOS

### 添加alivePush代码

```javascript
import alivePush from 'react-native-alive-push';

// 如果使用decorator请使用如下方式进行添加
@alivePush({
	deploymentKey:"****"
})
export default class APP extends React.Component{
	...
}
// 或者使用下面的代码
const APPWrapper=alivePush({deploymentKey:"***"})(APP)
export default APPWrapper
```
  
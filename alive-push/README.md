
# react-native-alive-push

## Getting started

`$ npm install react-native-alive-push --save`

### Mostly automatic installation

`$ react-native link react-native-alive-push`

### Manual installation


#### iOS

1. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2. Go to `node_modules` ➜ `react-native-alive-push` and add `RNAlivePush.xcodeproj`
3. In XCode, in the project navigator, select your project. Add `libRNAlivePush.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4. Run your project (`Cmd+R`)<

#### Android

1. Open up `android/app/src/main/java/[...]/MainActivity.java`
  - Add `import com.reactlibrary.RNAlivePushPackage;` to the imports at the top of the file
  - Add `new RNAlivePushPackage()` to the list returned by the `getPackages()` method
2. Append the following lines to `android/settings.gradle`:
  	```
  	include ':react-native-alive-push'
  	project(':react-native-alive-push').projectDir = new File(rootProject.projectDir, 	'../node_modules/react-native-alive-push/android')
  	```
3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
  	```
      compile project(':react-native-alive-push')
  	```


## Usage
```javascript
import RNAlivePush from 'react-native-alive-push';

// TODO: What to do with the module?
RNAlivePush;
```
  
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View
} from 'react-native';

import alivePush from 'react-native-alive-push'

@alivePush({
  deploymentKey: "befd157690f044eeb19ee6dad43e08ef"
})

export default class test extends Component {
  alivePushStatusChange(status) {
    console.log('alivePushStatusChange', status);
  }

  alivePushError(ex) {
    console.log('alivePushError', ex);
  }

  alivePushDownloadProgress(progress) {
    console.log('alivePushDownloadProgress', progress);
  }

  render() {
    debugger
    return (
        <View style={styles.container}>
  <Text style={styles.button}>Button</Text>
    <Text
    onPress={event=>{
      debugger
      alivePush.restart();
    }}
    style={styles.button}>restart</Text>
    </View>
  );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('test', () => test);

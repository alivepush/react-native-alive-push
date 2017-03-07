import {NativeModules} from 'react-native';
import React, {Component} from 'react'

const {RNAlivePush} = NativeModules;

let alivePush = (options)=> {
	let decorator = (RootComponent) => {
		return class AlivePushComponent extends Component {
			componentDidMount() {
				let rootComponentInstance = this.refs.rootComponent;
				let syncStatusCallback;
				if (rootComponentInstance && rootComponentInstance.alivePushStatusChange) {
					syncStatusCallback = rootComponentInstance.alivePushStatusChange;
					if (rootComponentInstance instanceof Component) {
						syncStatusCallback = syncStatusCallback.bind(rootComponentInstance);
					}
				}

				let downloadProgressCallback;
				if (rootComponentInstance && rootComponentInstance.alivePushDownloadProgress) {
					downloadProgressCallback = rootComponentInstance.alivePushDownloadProgress;
					if (rootComponentInstance instanceof Component) {
						downloadProgressCallback = downloadProgressCallback.bind(rootComponentInstance);
					}
				}

				let errorCallback;
				if (rootComponentInstance && rootComponentInstance.alivePushError) {
					errorCallback = rootComponentInstance.alivePushError;
					if (rootComponentInstance instanceof Component) {
						errorCallback = errorCallback.bind(rootComponentInstance);
					}
				}
				console.log('sync');
				RNAlivePush.sync(options, syncStatusCallback, downloadProgressCallback, errorCallback);
			}

			render() {
				return <RootComponent {...this.props} ref={"rootComponent"}/>
			}
		}
	}
	if (typeof options === "function") {
		console.log("1")
		return decorator(options);
	} else {
		console.log("2")
		return decorator;
	}
}


export default alivePush;

import React, {Component} from 'react'
import RNFetchBlob from 'react-native-fetch-blob'
import RNDeviceInfo from 'react-native-device-info'

const fs = RNFetchBlob.fs;
// const sync = Symbol();
const getRemoteConfig = Symbol();
const getDeviceInfo = Symbol();
const checkUpdate = Symbol();
const feedback = Symbol();
const buildHeaders = Symbol();
const appCachePath = `${fs.dirs.DocumentDir}/.alivepush`;
const deviceInfoPath = `${appCachePath}/deviceinfo.data`;
const configPath = `${appCachePath}/conf`;
const host = "http://172.16.30.193:8080/";
// const feedbackType = {
// 	downloadSuccess: 1,
// 	installSuccess: 2
// };


let _deviceInfo = null;

// function buildUrl(action) {
// 	return host + action;
// }


// type FeedbackFormData={
// 	type:feedbackType
// }

class DeviceInfo {
	constructor() {
		this.UniqueID = RNDeviceInfo.getUniqueID();
		this.Manufacturer = RNDeviceInfo.getManufacturer();
		this.Brand = RNDeviceInfo.getBrand();
		this.Model = RNDeviceInfo.getModel();
		this.DeviceId = RNDeviceInfo.getDeviceId();
		this.SystemName = RNDeviceInfo.getSystemName();
		this.SystemVersion = RNDeviceInfo.getSystemVersion();
		this.BundleId = RNDeviceInfo.getBundleId();
		this.BuildNumber = RNDeviceInfo.getBuildNumber();
		this.Version = RNDeviceInfo.getVersion();
		this.ReadableVersion = RNDeviceInfo.getReadableVersion();
		this.DeviceName = RNDeviceInfo.getDeviceName();
		this.UserAgent = RNDeviceInfo.getUserAgent();
		this.DeviceLocale = RNDeviceInfo.getDeviceLocale();
		this.DeviceCountry = RNDeviceInfo.getDeviceCountry();
		this.Timezone = RNDeviceInfo.getTimezone();
		this.InstanceID = RNDeviceInfo.getInstanceID();
		this.Emulator = RNDeviceInfo.isEmulator();
		this.Tablet = RNDeviceInfo.isTablet();
	}

	// save() {
	// 	return fs.writeStream(deviceInfoPath, 'utf-8')
	// 		.then(stream=> {
	// 			stream.write(JSON.stringify(this));
	// 			return stream.close();
	// 		});
	// }

	toStringSync() {
		let arr = [];
		for (let key in this) {
			let value = this[key];
			if (typeof value === "string") {
				arr.push(`${key}=${this[key]}`);
			}
		}
		return arr.join(",");
	}

	toBase64Sync() {
		let str = this.toStringSync();
		return RNFetchBlob.base64.encode(str, 'base64');
	}

	// static fromCache() {
	// 	return fs.readStream(deviceInfoPath, 'utf-8')
	// 		.then(stream=> {
	// 			return new Promise((resolve, reject)=> {
	// 				let data = [];
	// 				stream.onData(chunk=> {
	// 					data.push(chunk);
	// 				});
	// 				stream.onEnd(()=> {
	// 					resolve(new DeviceInfo(JSON.parse(data.join(''))))
	// 				});
	// 				stream.open();
	// 			});
	//
	// 		})
	// }
}

let alivePush = (options)=> {
	let decorator = (RootComponent) => {
		return class AlivePushComponent extends Component {
			componentDidMount() {
				let rootComponentInstance = this.refs.rootComponent;
				let statusChangeCallback;
				if (rootComponentInstance && rootComponentInstance.alivePushStatusChange) {
					statusChangeCallback = rootComponentInstance.alivePushStatusChange;
					if (rootComponentInstance instanceof Component) {
						statusChangeCallback = statusChangeCallback.bind(rootComponentInstance);
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
				//this.sync(options, statusChangeCallback, downloadProgressCallback, errorCallback);
			}
/*

			[getDeviceInfo]() {
				return new Promise((resolve, reject)=> {
					if (!_deviceInfo) {
						_deviceInfo = new DeviceInfo();
					}
					resolve(_deviceInfo);
				});
			}

			[getRemoteConfig]() {
				// //TODO
				// return RNFetchBlob.config({
				// 	path: configPath
				// }).fetch("GET", buildUrl('config')).catch(()=> {
				// });
			}

			async [buildHeaders]() {
				let device = await this[getDeviceInfo]();
				return {
					device: device.toBase64Sync(),
					contentType: 'application/json'
				};
			}

			[checkUpdate]() {
				return RNFetchBlob.fetch("GET", `${host}main/checkupdate`)
					.then(res=> {
						let json = res.json();
						console.log(json);
					})
			}
*/

			// async [feedback](data: FeedbackFormData = {type: feedbackType.downloadSuccess}) {
			// 	let headers = await this[buildHeaders]();
			// 	console.log(headers);
			// 	return RNFetchBlob.fetch("POST", `${host}main/feedback`, headers, JSON.stringify(data))
			// 		.then(res=> {
			// 			let json = res.json();
			// 			return json();
			// 		});
			// }

	/*		async sync(options, statusChangeCallback, downloadProgressCallback, errorCallback) {
				let deviceInfo = await this[getDeviceInfo]();
				console.log(deviceInfo);
				console.log(deviceInfo.toStringSync());
				console.log(deviceInfo.toBase64Sync());
				let checkUpdateResult = await this[checkUpdate]();
				console.log(checkUpdateResult);
				// let feedbackResult = await this[feedback]();
				// console.log('feedbackResult=>', feedbackResult);
			}
*/
			render() {
				return <RootComponent {...this.props} ref={"rootComponent"}/>
			}
		}
	}
	if (typeof options === "function") {
		return decorator(options);
	} else {
		return decorator;
	}
};


export default alivePush;

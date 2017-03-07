import {NativeModules} from 'react-native'
import React, {Component} from 'react'
import RNFetchBlob from 'react-native-fetch-blob'
import RNDeviceInfo from 'react-native-device-info'
import {unzip} from 'react-native-zip-archive'

const host = "http://172.16.30.193:8080/";
const feedbackType = {
	downloadSuccess: 1,
	installSuccess: 2
};
const {RNAlivePush}=NativeModules;

console.log(RNAlivePush);

let _deviceInfo = null;

type FeedbackFormData={
	type:feedbackType
}

type AlivePushOption={
	deploymentKey:String
}

type AlivePushConfig={
	path:String,
	version:String,
	lastUpdateTime:Number
}

type ResponseJSON={
	success:Boolean,
	data:Object,
	msg:String
}

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
}

let alivePush = (options)=> {
	let decorator = (RootComponent) => {
		return class AlivePushComponent extends Component {
			constructor(props) {
				super(props);
				this.options = null;
			}

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
				this.sync(options, statusChangeCallback, downloadProgressCallback, errorCallback);
			}


			getDeviceInfo() {
				return new Promise((resolve, reject)=> {
					if (!_deviceInfo) {
						_deviceInfo = new DeviceInfo();
					}
					resolve(_deviceInfo);
				});
			}

			getRemoteConfig() {

			}

			async buildHeaders() {
				let device = await this.getDeviceInfo();
				let config = await this.getConfig();
				let app = {
					BinraryVersionName: RNAlivePush.VersionName,
					InnerVersionName: config.version || null,
					DeploymentKey: this.options.deploymentKey
				};
				return {
					device: device.toBase64Sync(),
					contentType: 'application/json',
					app
				};
			}

			async checkUpdate(): Promise | ResponseJSON {
				let headers = await this.buildHeaders();
				let res = await RNFetchBlob.fetch("GET", `${host}main/checkupdate`, headers);
				let json = res.json();
				console.log(json);
				return res;
			}

			async downloadPackage(url: String, progress: Function = ()=> {
			}) {
				if (!url) {
					throw new Error("url is required");
				}
				if (!/^http/.test(url) || !/^https/.test(url)) {
					throw new Error("url is invalid");
				}
				if (!/\.zip$/i.test(url)) {
					throw new Error("package url must be end with '.zip'");
				}
				let headers = await this.buildHeaders();
				return RNFetchBlob.config({
					fileCache: true
				}).progress(progress).fetch("GET", url, headers);
			}

			async feedback(data: FeedbackFormData = {type: feedbackType.downloadSuccess}) {
				let headers = await this.buildHeaders();
				console.log(headers);
				let res = await RNFetchBlob.fetch("POST", `${host}main/feedback`, headers, JSON.stringify(data));
				let json = res.json();
				return json;
			}

			async getConfig(): AlivePushConfig {
				let readStream = await RNFetchBlob.fs.readStream(RNAlivePush.AlivePushConfigPath, 'utf8');
				return new Promise((resolve, reject)=> {
					let data = [];
					readStream.onData(chunk=> {
						data.push(chunk);
					});
					readStream.onEnd(()=> {
						let jsonStr = data.join('');
						let json;
						try {
							json = JSON.parse(jsonStr);
						}
						catch (ex) {
							json = {};
						}
						resolve(json);
					});
					readStream.onError(err=> {
						reject(err);
					});
					readStream.open();
				});
			}

			async writeConfig(newConfig: AlivePushConfig): Promise {
				let ws = await RNFetchBlob.fs.writeStream(RNAlivePush.AlivePushConfigPath, 'utf8');
				ws.write(JSON.stringify(config));
				return ws.close();
			}

			async updateConfig(newConfig: AlivePushConfig): Promise {
				let oldConfig = await this.getConfig();
				let config = Object.assign({}, oldConfig, newConfig);
				return this.writeConfig(config);
			}

			async unzipPackage(path: String) {
				let fileName = path.substring(path.lastIndexOf("/"), path.lastIndexOf("."));
				return unzip(path, `${RNAlivePush.CachePath}/${fileName}`)
					.then(unzipPath=> {
						// delete package cache
						return RNFetchBlob.unlink(path);
					})
			}

			async sync(options: AlivePushOption,
					   statusChangeCallback: ?Function,
					   downloadProgressCallback: ?Function,
					   errorCallback: ?Function): Void {
				if (!options) {
					throw new Error('options is required');
				}
				if (!options.deploymentKey) {
					throw new Error('options.deploymentKey is required');
				}
				this.options = options;
				let result = await this.checkUpdate();
				if (result.success) {
					//download package
					try {
						let newPackage = await this.downloadPackage(result.data.url, downloadProgressCallback);
						let packagePath = newPackage.path();
						await this.unzipPackage(packagePath);
						await this.updateConfig({
							path: "",
							version: "",
							lastUpdateTime: Date.now()
						})
					}
					catch (ex) {
						if (errorCallback) {
							errorCallback(ex);
						}
						else {
							throw ex;
						}
					}
				}
			}

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

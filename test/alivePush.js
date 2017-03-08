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

export const AlivePushStatus = {
	beginCheck: "BEGINCHECK",
	checking: "CHECKING",
	endCheck: "ENDCHECK",
	beginDownload: "BEGINDOWNLOAD",
	downloading: "DOWNLOADING",
	endDownload: "ENDDOWNLOAD",
	beginUnzip: "BEGINUNZIP",
	unzipping: "UNZIPPING",
	endUnzip: "ENDUNZIP",
	complete: "COMPLETE"
};

console.log(RNAlivePush);

let _deviceInfo = null, _appInfo = null;

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

function objectToBase64Sync(obj: Object): String {
	let data = [];
	for (let key in obj) {
		if (typeof obj[key] !== "function") {
			data.push(`${key}=${obj[key]}`);
		}
	}
	let str = data.join(',');
	return RNFetchBlob.base64.encode(str, 'base64');
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

	// toStringSync() {
	// 	let arr = [];
	// 	for (let key in this) {
	// 		let value = this[key];
	// 		if (typeof value === "string") {
	// 			arr.push(`${key}=${this[key]}`);
	// 		}
	// 	}
	// 	return arr.join(",");
	// }

	toBase64Sync() {
		// let str = this.toStringSync();
		// return RNFetchBlob.base64.encode(str, 'base64');
		return objectToBase64Sync(this);
	}
}

let alivePush = (options)=> {
	if (!options) {
		throw new Error('options is required');
	}
	if (!options.deploymentKey) {
		throw new Error('options.deploymentKey is required');
	}
	let decorator = (RootComponent) => {
		return class AlivePushComponent extends Component {
			constructor(props) {
				super(props);
				this.options = options;
				this.statusChangeCallback = ()=> {
				};
				this.downloadProgressCallback = ()=> {
				};
				this.errorCallback = null;
			}

			componentDidMount() {
				let rootComponentInstance = this.refs.rootComponent;

				if (rootComponentInstance && rootComponentInstance.alivePushStatusChange) {
					this.statusChangeCallback = rootComponentInstance.alivePushStatusChange;
					if (rootComponentInstance instanceof Component) {
						this.statusChangeCallback = this.statusChangeCallback.bind(rootComponentInstance);
					}
				}

				if (rootComponentInstance && rootComponentInstance.alivePushDownloadProgress) {
					this.downloadProgressCallback = rootComponentInstance.alivePushDownloadProgress;
					if (rootComponentInstance instanceof Component) {
						this.downloadProgressCallback = this.downloadProgressCallback.bind(rootComponentInstance);
					}
				}

				if (rootComponentInstance && rootComponentInstance.alivePushError) {
					this.errorCallback = rootComponentInstance.alivePushError;
					if (rootComponentInstance instanceof Component) {
						this.errorCallback = this.errorCallback.bind(rootComponentInstance);
					}
				}

				this.sync();
			}


			getDeviceInfo(): Promise {
				return new Promise((resolve, reject)=> {
					if (!_deviceInfo) {
						_deviceInfo = new DeviceInfo();
					}
					resolve(_deviceInfo);
				});
			}

			async getAppInfo(): Promise {
				if (_appInfo) {
					return Promise.resolve(_appInfo);
				}
				return this.getConfig().then(config=> {
					_appInfo = {
						Binary: RNAlivePush.VersionName,
						Inner: config.version || null,
						DeploymentKey: this.options.deploymentKey
					};
					return _appInfo;
				});
			}

			getRemoteConfig() {

			}


			async buildHeaders(): Promise|Object {
				let device = await this.getDeviceInfo();
				let app = await this.getAppInfo();
				let headers = {
					device: device.toBase64Sync(),
					contentType: 'application/json',
					app: objectToBase64Sync(app)
				};
				console.log('headers', headers);
				return headers;
			}

			async checkUpdate(): Promise | ResponseJSON {
				let headers = await this.buildHeaders();
				this.statusChangeCallback(AlivePushStatus.checking);
				let res = await RNFetchBlob.fetch("GET", `${host}main/checkupdate`, headers);
				let json = res.json();
				console.log(json);
				return res;
			}

			async downloadPackage(url: String): Promise {
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
				this.statusChangeCallback(AlivePushStatus.downloading);
				return RNFetchBlob.config({
					fileCache: true
				}).progress(this.downloadProgressCallback).fetch("GET", url, headers);
			}

			async feedback(data: FeedbackFormData = {type: feedbackType.downloadSuccess}): ResponseJSON {
				let headers = await this.buildHeaders();
				console.log(headers);
				let res = await RNFetchBlob.fetch("POST", `${host}main/feedback`, headers, JSON.stringify(data));
				let json = res.json();
				return json;
			}

			getConfig(): AlivePushConfig {
				return RNFetchBlob.fs.readStream(RNAlivePush.AlivePushConfigPath, 'utf8')
					.then(readStream=> {
						return new Promise((resolve, reject)=> {
							let data = [];
							readStream.onData(chunk=> {
								data.push(chunk);
							});
							readStream.onEnd(()=> {
								debugger
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
					}).catch(err=> {
						return {};
					});
			}

			async writeConfig(newConfig: AlivePushConfig): Promise {
				let ws = await RNFetchBlob.fs.writeStream(RNAlivePush.AlivePushConfigPath, 'utf8');
				ws.write(JSON.stringify(newConfig));
				return ws.close();
			}

			async updateConfig(newConfig: AlivePushConfig): Promise {
				let oldConfig = await this.getConfig();
				let config = Object.assign({}, oldConfig, newConfig);
				return this.writeConfig(config);
			}

			async unzipPackage(path: String): Promise {
				let fileName = path.substring(path.lastIndexOf("/"), path.lastIndexOf("."));
				this.statusChangeCallback(AlivePushStatus.unzipping);
				return unzip(path, `${RNAlivePush.CachePath}/${fileName}`)
					.then(unzipPath=> {
						// delete package cache
						return RNFetchBlob.unlink(path);
					})
			}

			async sync(): void {
				try {
					this.statusChangeCallback(AlivePushStatus.beginCheck);
					let result = await this.checkUpdate();
					this.statusChangeCallback(AlivePushStatus.endCheck);
					if (result.success) {
						this.statusChangeCallback(AlivePushStatus.beginDownload);
						let newPackage = await this.downloadPackage(result.data.url);
						this.statusChangeCallback(AlivePushStatus.endDownload);
						let packagePath = newPackage.path();
						this.statusChangeCallback(AlivePushStatus.beginUnzip);
						await this.unzipPackage(packagePath);
						this.statusChangeCallback(AlivePushStatus.endUnzip);
						//TODO
						await this.updateConfig({
							path: "",
							version: "",
							lastUpdateTime: Date.now()
						});
						this.statusChangeCallback(AlivePushStatus.complete);
						RNAlivePush.restart();
					}
				}
				catch (ex) {
					if (this.errorCallback) {
						this.errorCallback(ex);
					}
					else {
						throw ex;
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

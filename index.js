
import {NativeModules, Platform, Dimensions, PixelRatio} from 'react-native'
import React, {Component} from 'react'
import RNFetchBlob from 'react-native-fetch-blob'
import RNDeviceInfo from 'react-native-device-info'
import {unzip} from 'react-native-zip-archive'

const host = "http://172.16.30.157:8080/";

const {RNAlivePush}=NativeModules;

const alivePushFeedbackType = {
	downloadSuccess: 1,
	installSuccess: 2
};

const dim = Dimensions.get("window");

console.log("Dimensions", dim);

console.log("RNAlivePush", RNAlivePush);

let _deviceInfo = null;

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




/**
 * @module alivePush
 *
 * @eventlistener alivePushStatusChange
 *
 * @example <caption>class wrapper</caption>
 * import alivePush from 'react-native-alive-push'
 * class MyApp extends React.Component{
 * 	...
 * }
 * const AppWrapper=alivePush({...})(MyApp)
 *
 * @example <caption>Decorator</caption>
 * \@alivePush({
 * 	...
 * })
 * class MyApp extends React.Component{
 * 	...
 * }
 *
 * @example <caption>事件回调,目前仅支持以下列出的事件回调</caption>
 * \@alivePush
 * class MyApp extends React.Component{
 *     alivePushStatusChange(status:AlivePushStatus){
 *         // do something
 *     }
 *     alivePushDownloadProgress(progress){
 *         // do something
 *     }
 *     alivePushError(err){
 *         // do something
 *     }
 * }
 *
 * @return {Function}
 * @return {AlivePushComponent}
 *
 * */
let alivePush = (options: AlivePushOption)=> {

	if (!options) {
		throw new Error('options is required');
	}
	if (!options.deploymentKey) {
		throw new Error('options.deploymentKey is required');
	}
	let decorator = (RootComponent) => {
		return class AlivePushComponent extends Component {
			restart() {
				RNAlivePush.restart()
			}
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

			buildUrlSync(url: String): String {
				return `${this.options.host || host}${url}`
			}


			getDeviceInfo(): DeviceInfo {
				return new Promise((resolve, reject)=> {
					if (!_deviceInfo) {
						_deviceInfo = new DeviceInfo();
					}
					console.log("device info  = ", _deviceInfo);
					resolve(_deviceInfo);
				});
			}

			async getAppInfo(): APPInfo {

				return this.getConfig().then(config=> {
					return {
						Binary: RNAlivePush.VersionName,
						Inner: config.version || 0,
						DeploymentKey: this.options.deploymentKey
					};
				});
			}

			async buildHeaders(): Object {
				let device = await this.getDeviceInfo();
				let app = await this.getAppInfo();
				console.log("appinfo = ", app);
				let headers = {
					device: device.toBase64Sync(),
					'Content-Type': 'application/json',
					app: objectToBase64Sync(app)
				};
				console.log('headers', headers);
				return headers;
			}

			async checkUpdate(): ResponseJSON {
				let headers = await this.buildHeaders();
				this.statusChangeCallback(AlivePushStatus.checking);
				let res = await RNFetchBlob.fetch("GET", this.buildUrlSync("main/checkupdate"), headers);
				let json = res.json();
				return json;
			}

			async downloadPackage(url: String): String {
				if (!url) {
					throw new Error("url is required");
				}
				if (!/^(http|https)/.test(url)) {
					throw new Error("url is invalid");
				}
				// if (!/\.zip$/i.test(url)) {
				// 	throw new Error("package url must be end with '.zip'");
				// }
				let headers = await this.buildHeaders();
				this.statusChangeCallback(AlivePushStatus.downloading);
				return RNFetchBlob.config({
					fileCache: true
				}).fetch("GET", url, headers)
					.progress(this.downloadProgressCallback);
			}

			async feedback(data?: FeedFormData = {type: alivePushFeedbackType.downloadSuccess}): ResponseJSON {
				let headers = await this.buildHeaders();
				RNFetchBlob.fetch("POST", this.buildUrlSync('main/feedback'), headers, JSON.stringify(data));
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
								let jsonStr = data.join('');
								jsonStr = jsonStr.substring(jsonStr.indexOf("{"), jsonStr.lastIndexOf("}") + 1)
								let json;
								try {
									json = JSON.parse(jsonStr);
								}
								catch (ex) {
									console.error(ex, jsonStr);
									json = {};
								}
								console.log('alive push config', json);
								resolve(json);
							});
							readStream.onError(err=> {
								//reject(err);
								resolve({});
							});
							readStream.open();
						});
					});
			}

			async writeConfig(newConfig: AlivePushConfig): Promise {
				console.log('will rewrite alive push config', newConfig);
				let exists = await RNFetchBlob.fs.exists(RNAlivePush.AlivePushConfigPath);
				let str = JSON.stringify(newConfig);
				if (exists) {
					let ws = await RNFetchBlob.fs.writeStream(RNAlivePush.AlivePushConfigPath, 'utf8');
					ws.write(str);
					return ws.close();
				}
				else {
					return RNFetchBlob.fs.createFile(RNAlivePush.AlivePushConfigPath, str, 'utf8');
				}
			}

			async updateConfig(newConfig: AlivePushConfig): Promise {
				let oldConfig = await this.getConfig();
				let config = Object.assign({}, oldConfig, newConfig);
				return this.writeConfig(config);
			}

			async unzipPackage(path: String, filename: String): String {
				console.log(`unzip package file name = ${filename}`);
				let targetPath = `${RNAlivePush.CachePath}/${filename}`;
				console.log(`unzip ${path} to ${targetPath}`);
				return unzip(path, targetPath)
					.then(unzipPath=> {
						// delete package cache
						return RNFetchBlob.fs.unlink(path)
							.then(()=> {
								// console.feedback('unzip path files :');
								// RNFetchBlob.fs.ls(unzipPath).then(files=> {
								// 	console.feedback(files);
								// });
								return unzipPath;
							});
					})
			}

			async sync(): void {
				try {
					this.statusChangeCallback(AlivePushStatus.beforeCheck);
					let packageInfo = await this.checkUpdate();
					this.statusChangeCallback(AlivePushStatus.afterCheck,packageInfo);
					console.log("packageInfo", packageInfo);
					if (packageInfo.success && packageInfo.data) {
						await this.updateConfig({
							version: packageInfo.data.inner
						});
						this.statusChangeCallback(AlivePushStatus.beforeDownload);
						let newPackage = await this.downloadPackage(packageInfo.data.url);
						this.feedback();
						let packagePath = newPackage.path();
						let unzipPath = await this.unzipPackage(packagePath, packageInfo.data.inner);
						let bundlePath = `${unzipPath}/app/index.${Platform.OS}.js`;
						console.log(`new bundle path = ${bundlePath},inner version = ${packageInfo.data.inner}`);
						await this.updateConfig({
							path: bundlePath,
							lastUpdateTime: new Date(),
							install: false
						});
						this.statusChangeCallback(AlivePushStatus.afterDownload,RNAlivePush.restart);
					}
					else {
						let config = await this.getConfig();
						if (config.path) {
							console.log('JSBundleFile', RNAlivePush.JSBundleFile);
							if (config.path === RNAlivePush.JSBundleFile) {
								if (!config.install) {
									this.feedback({type: alivePushFeedbackType.installSuccess});
									this.updateConfig({
										install: true
									});
									this.statusChangeCallback(AlivePushStatus.install);
								}
							}
						}

					}
					console.log('app start from ' + RNAlivePush.JSBundleFile);
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

/**@typedef
 * @property {Number} beforeCheck
 * @property {Number} checking
 * @property {Number} afterCheck
 * @property {Number} beforeDownload
 * @property {Number} downloading
 * @property {Number} afterDownload
 * @property {Number} install
 * */
export const AlivePushStatus = {
	beforeCheck: 1,
	checking: 10,
	afterCheck: 20,
	beforeDownload: 30,
	downloading: 40,
	afterDownload: 50,
	install:60,
};


export default alivePush;

type FeedFormData={
	type:alivePushFeedbackType
}

/**@typedef
 * @property {String} deploymentKey - 部署的key
 * @property {String} [host] - 服务器的地址
 * */
type AlivePushOption={
	deploymentKey:String,
	host:?String,
}

export class DeviceInfo {
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
		this.Width = dim.width;
		this.Height = dim.height;
		this.Ratio = PixelRatio.get()

	}
	toBase64Sync() {
		return objectToBase64Sync(this);
	}
}

type APPInfo={
	Binary:String,
	Inner:Number,
	DeploymentKey:String
}

type AlivePushConfig={
	// bundle path
	path:String,
	// bundle version
	version:String,
	// last time update config file
	lastUpdateTime:Number,
	//
	install:Boolean
}

type ResponseJSON={
	success:Boolean,
	data:Object,
	msg:String,
	code:Number
}

/**
 * @author m860
 * */

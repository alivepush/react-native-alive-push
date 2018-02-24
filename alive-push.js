import {NativeModules, Platform, Dimensions, PixelRatio} from 'react-native'
import React, {Component, PureComponent} from 'react'
import RNFetchBlob from 'react-native-fetch-blob'
import RNDeviceInfo from 'react-native-device-info'
import {unzip} from 'react-native-zip-archive'

const host = "http://172.16.30.236:8080/";

const {RNAlivePush} = NativeModules;

const alivePushFeedbackType = {
	downloadSuccess: 1,
	installSuccess: 2
};

// let _deviceInfo = null;

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
 * @return {Function}
 * @return {AlivePushComponent}
 *
 * */
let alivePush = (options: AlivePushOption) => {

	if (!options) {
		throw new Error('options is required');
	}
	if (!options.deploymentKey) {
		throw new Error('options.deploymentKey is required');
	}
	const decorator = (RootComponent) => {
		return class AlivePushComponent extends Component {
			/**
			 * @private
			 * 重启app
			 * */
			restart() {
				RNAlivePush.restart()
			}

			constructor(props) {
				super(props);
				this.options = options;
				this.statusChangeCallback = () => null;
				this.downloadProgressCallback = () => null;
				this.errorCallback = null;
				this.rootComponent = null;
				this.deviceInfo = new DeviceInfo();
			}

			componentDidMount() {
				if (this.rootComponent) {
					if (this.rootComponent.alivePushStatusChange) {
						this.statusChangeCallback = this.rootComponent.alivePushStatusChange;
						if (this.rootComponent instanceof Component || this.rootComponent instanceof PureComponent) {
							this.statusChangeCallback = this.statusChangeCallback.bind(this.rootComponent);
						}
					}

					if (this.rootComponent.alivePushDownloadProgress) {
						this.downloadProgressCallback = this.rootComponent.alivePushDownloadProgress;
						if (this.rootComponent instanceof Component || this.rootComponent instanceof PureComponent) {
							this.downloadProgressCallback = this.downloadProgressCallback.bind(this.rootComponent);
						}
					}

					if (this.rootComponent.alivePushError) {
						this.errorCallback = this.rootComponent.alivePushError;
						if (this.rootComponent instanceof Component || this.rootComponent instanceof PureComponent) {
							this.errorCallback = this.errorCallback.bind(this.rootComponent);
						}
					}
				}


				this.sync();
			}

			buildUrlSync(url: String): String {
				return `${this.options.host || host}${url}`
			}


			// getDeviceInfo(): DeviceInfo {
			// 	return new Promise((resolve, reject) => {
			// 		if (!_deviceInfo) {
			// 			_deviceInfo = new DeviceInfo();
			// 		}
			// 		resolve(_deviceInfo);
			// 	});
			// }

			async getAppInfo(value: APPInfo = {}): APPInfo {
				return this.getConfig().then(config => {
					return Object.assign({
						Binary: RNAlivePush.VersionName,
						Inner: config.version || 0,
						DeploymentKey: this.options.deploymentKey
					}, value);
				});
			}

			async buildHeaders(appInfo: ?APPInfo): Object {
				let app = await this.getAppInfo(appInfo);
				console.log(`app info`, appInfo);
				let headers = {
					device: this.deviceInfo.toBase64Sync(),
					'Content-Type': 'application/json',
					app: objectToBase64Sync(app)
				};
				return headers;
			}

			async checkUpdate(): ResponseJSON {
				const headers = await this.buildHeaders();
				console.log(`检查更新`, headers);
				this.statusChangeCallback(AlivePushStatus.checking);
				const res = await RNFetchBlob.fetch("GET", this.buildUrlSync("main/checkupdate"), headers);
				return res.json();
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

			async feedback(data: ?FeedFormData = {type: alivePushFeedbackType.downloadSuccess}, appInfo: APPInfo): ResponseJSON {
				let headers = await this.buildHeaders(appInfo);
				RNFetchBlob.fetch("POST", this.buildUrlSync('main/feedback'), headers, JSON.stringify(data));
			}

			getConfig(): AlivePushConfig {
				return RNFetchBlob.fs.readStream(RNAlivePush.AlivePushConfigPath, 'utf8')
					.then(readStream => {
						return new Promise((resolve, reject) => {
							let data = [];
							readStream.onData(chunk => {
								data.push(chunk);
							});
							readStream.onEnd(() => {
								let jsonStr = data.join('');
								jsonStr = jsonStr.substring(jsonStr.indexOf("{"), jsonStr.lastIndexOf("}") + 1)
								let json;
								try {
									json = JSON.parse(jsonStr);
								}
								catch (ex) {
									json = {};
								}
								resolve(json);
							});
							readStream.onError(err => {
								//reject(err);
								resolve({});
							});
							readStream.open();
						});
					});
			}

			async writeConfig(newConfig: AlivePushConfig): Promise {
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
				let targetPath = `${RNAlivePush.CachePath}/${filename}`;
				return unzip(path, targetPath)
					.then(unzipPath => {
						// delete package cache
						return RNFetchBlob.fs.unlink(path)
							.then(() => {
								return unzipPath;
							});
					})
			}

			async sync(): void {
				try {
					//状态更新为:检查前
					this.statusChangeCallback(AlivePushStatus.beforeCheck);
					//开始检查是否有更新
					let packageInfo = await this.checkUpdate();
					//状态更新为:检查后
					this.statusChangeCallback(AlivePushStatus.afterCheck, packageInfo);
					if (packageInfo.success && packageInfo.data) {
						//如果有更新包就开始下载
						//状态更新为:下载前
						this.statusChangeCallback(AlivePushStatus.beforeDownload, packageInfo);
						let newPackage = await this.downloadPackage(packageInfo.data.url);
						//下载成功后,通知服务端已下载
						this.feedback({type: alivePushFeedbackType.downloadSuccess}, {
							Inner: packageInfo.data.inner
						});
						let packagePath = newPackage.path();
						//解压安装包
						const unzipPath = await this.unzipPackage(packagePath, `${RNAlivePush.VersionName}/${packageInfo.data.inner}`);
						const bundlePath = `${unzipPath}/index.${Platform.OS}.js`;
						const assetPath = `${unzipPath}`;
						//更新alive push的配置文件
						await this.updateConfig({
							path: bundlePath,
							assetPath: assetPath,
							lastUpdateTime: new Date(),
							install: false,
							version: packageInfo.data.inner
						});
						//状态更新为:下载后
						this.statusChangeCallback(AlivePushStatus.afterDownload, packageInfo);
					}
					else {
						//如果没有更新包就按照之前的配置启动app
						let config = await this.getConfig();
						if (config.path) {
							if (config.path === RNAlivePush.JSBundleFile) {
								if (!config.install) {
									this.feedback({type: alivePushFeedbackType.installSuccess}, {
										Inner: config.version
									});
									this.updateConfig({
										install: true
									});
									this.statusChangeCallback(AlivePushStatus.install, packageInfo);
								}
							}
						}
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
				return <RootComponent {...this.props} ref={ref => this.rootComponent = ref}/>
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
 * @constant
 * @enum {Number}
 * @property {Number} beforeCheck - 检查更新前
 * @property {Number} checking - 检查中
 * @property {Number} afterCheck - 检查更新后
 * @property {Number} beforeDownload - 下载前
 * @property {Number} downloading - 下载中
 * @property {Number} afterDownload - 下载后
 * @property {Number} install - 安装成功
 * */
export const AlivePushStatus = {
	beforeCheck: 1,
	checking: 10,
	afterCheck: 20,
	beforeDownload: 30,
	downloading: 40,
	afterDownload: 50,
	install: 60,
};


export default alivePush;

type FeedFormData = {
	type: alivePushFeedbackType
}

/**@typedef
 * @property {String} deploymentKey - 部署的key
 * @property {String} [host] - 服务器的地址
 * */
type AlivePushOption = {
	deploymentKey: String,
	host: ?String,
}

export class DeviceInfo {
	constructor() {
		const {width, height} = Dimensions.get("window");
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
		this.DeviceName = encodeURI(RNDeviceInfo.getDeviceName());
		this.UserAgent = RNDeviceInfo.getUserAgent();
		this.DeviceLocale = RNDeviceInfo.getDeviceLocale();
		this.DeviceCountry = RNDeviceInfo.getDeviceCountry();
		this.Timezone = RNDeviceInfo.getTimezone();
		this.InstanceID = RNDeviceInfo.getInstanceID();
		this.Emulator = RNDeviceInfo.isEmulator();
		this.Tablet = RNDeviceInfo.isTablet();
		this.Width = width;
		this.Height = height;
		this.Ratio = PixelRatio.get()

	}

	toBase64Sync() {
		return objectToBase64Sync(this);
	}
}

type APPInfo = {
	Binary: String,
	Inner: Number,
	DeploymentKey: String
}

type AlivePushConfig = {
	// bundle path
	path: String,
	// bundle version
	version: String,
	// last time update config file
	lastUpdateTime: Number,
	//
	install: Boolean
}

type ResponseJSON = {
	success: Boolean,
	data: Object,
	msg: String,
	code: Number
}


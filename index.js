import {NativeModules, Platform, Dimensions, PixelRatio} from 'react-native'
import React, {Component, PureComponent} from 'react'
import RNFetchBlob from 'react-native-fetch-blob'
import {unzip} from 'react-native-zip-archive'

//default host
const host = "https://alivepush.com/";

const {RNAlivePush} = NativeModules;
const alivePushFeedbackType = {
    /**
     * 下载成功
     */
    downloadSuccess: 1,
    /**
     * 安装成功
     */
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
let index = (options: AlivePushOption) => {

    if (!options) {
        throw new Error('options is required');
    }
    if (!options.deploymentKey) {
        throw new Error('options.deploymentKey is required');
    }
    const log = (...args) => {
        if (options.debug) {
            console.log(...args);
        }
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
                log("device info", this.deviceInfo);
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
                let headers = {
                    device: this.deviceInfo.toBase64Sync(),
                    'Content-Type': 'application/json',
                    app: objectToBase64Sync(app)
                };
                return headers;
            }

            async checkUpdate(): ResponseJSON {
                const headers = await this.buildHeaders();
                this.statusChangeCallback(AlivePushStatus.checking);
                const res = await RNFetchBlob.fetch("GET", this.buildUrlSync(`main/checkupdate?_=${Math.random()}`), headers);
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
                log('更新后的alivePushConfiguration', config);
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
                    log(`开始check版本信息...`)
                    let packageInfo = await this.checkUpdate();
                    log(`check结果`, packageInfo);
                    //状态更新为:检查后
                    this.statusChangeCallback(AlivePushStatus.afterCheck, packageInfo);
                    if (packageInfo.success && packageInfo.data) {
                        //如果有更新包就开始下载
                        //状态更新为:下载前
                        this.statusChangeCallback(AlivePushStatus.beforeDownload, packageInfo);
                        log('开始下载安装包...')
                        let newPackage = await this.downloadPackage(packageInfo.data.url);
                        log('下载完成')
                        //下载成功后,通知服务端已下载
                        log(`通知服务端下载成功`)
                        this.feedback({type: alivePushFeedbackType.downloadSuccess}, {
                            Inner: packageInfo.data.inner
                        });
                        let packagePath = newPackage.path();
                        //解压安装包
                        log('开始解压安装包...')
                        const unzipPath = await this.unzipPackage(packagePath, `${RNAlivePush.VersionName}/${packageInfo.data.inner}`);
                        log('安装包解压完成')
                        const bundlePath = `${unzipPath}/app/index.${Platform.OS}.js`;
                        log(`新的bundle的路径 : ${bundlePath}`);
                        const assetPath = `${unzipPath}/app`;
                        log(`新的资源路劲 : ${assetPath}`);
                        //更新alive push的配置文件
                        log('开始更新alivePushConfig配置...')
                        await this.updateConfig({
                            path: bundlePath,
                            assetPath: assetPath,
                            lastUpdateTime: new Date(),
                            install: false,
                            version: packageInfo.data.inner
                        });
                        log('alivePushConfig配置更新完成')
                        //状态更新为:下载后
                        this.statusChangeCallback(AlivePushStatus.afterDownload, packageInfo);
                    }
                    else {
                        //如果没有更新包就按照之前的配置启动app
                        let config = await this.getConfig();
                        log('alivePushConfig配置', config);
                        if (config.path) {
                            if (config.path === RNAlivePush.JSBundleFile) {
                                if (!config.install) {
                                    log('开始安装...');
                                    log(`通知服务端客户端已经安装成功`)
                                    this.feedback({type: alivePushFeedbackType.installSuccess}, {
                                        Inner: config.version
                                    });
                                    log(`更新alivePushConfig.install=true,即安装成功`);
                                    this.updateConfig({
                                        install: true
                                    });
                                    this.statusChangeCallback(AlivePushStatus.install, packageInfo);
                                }
                                else {
                                    log('当前版本已经安装成功');
                                }
                            }
                            else {
                                log(`alivePushConfig中的启动路径和RNAlivePush.JSBundleFile不一样,${config.path}!==${RNAlivePush.JSBundleFile}`);
                            }
                        }
                    }
                }
                catch (ex) {
                    log('发生错误', ex);
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


export default index;

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
    debug: ?Boolean
}

export class DeviceInfo {

    constructor() {
        const {width, height} = Dimensions.get("window");
        this.UniqueID = RNAlivePush.uniqueId;
        this.Manufacturer = RNAlivePush.systemManufacturer;
        this.Brand = RNAlivePush.brand;
        this.Model = RNAlivePush.model;
        this.DeviceId = RNAlivePush.deviceId;
        this.SystemName = RNAlivePush.systemName;
        this.SystemVersion = RNAlivePush.systemVersion;
        this.BundleId = RNAlivePush.bundleId;
        this.BuildNumber = RNAlivePush.buildNumber;
        this.Version = RNAlivePush.appVersion;
        this.ReadableVersion = RNAlivePush.appVersion + "." + RNAlivePush.buildNumber;
        this.DeviceName = encodeURI(RNAlivePush.deviceName);
        this.UserAgent = RNAlivePush.userAgent;
        this.DeviceLocale = RNAlivePush.deviceLocale;
        this.DeviceCountry = RNAlivePush.deviceCountry;
        this.Timezone = RNAlivePush.timezone;
        this.InstanceID = RNAlivePush.instanceId;
        this.Emulator = RNAlivePush.isEmulator;
        this.Tablet = RNAlivePush.isTablet;
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


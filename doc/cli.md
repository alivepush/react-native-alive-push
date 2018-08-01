# react-native-alive-push-cli

alivepush的cli工具

<!-- badge -->
[![npm version](https://img.shields.io/npm/v/react-native-alive-push-cli.svg)](https://www.npmjs.com/package/react-native-alive-push-cli)
[![npm license](https://img.shields.io/npm/l/react-native-alive-push-cli.svg)](https://www.npmjs.com/package/react-native-alive-push-cli)
[![npm download](https://img.shields.io/npm/dm/react-native-alive-push-cli.svg)](https://www.npmjs.com/package/react-native-alive-push-cli)
[![npm download](https://img.shields.io/npm/dt/react-native-alive-push-cli.svg)](https://www.npmjs.com/package/react-native-alive-push-cli)
<!-- endbadge -->

## 安装

```shell
$ npm i react-native-alive-push-cli -g
$ alive-push -v
```

## 快速使用

### 注册

在使用alivepush之前需要注册一个账号,具体命令如下:

```shell
$ alive-push register <你的邮箱> <密码>
```

### 登录

```shell
$ alive-push login <你的邮箱> <密码>
$ alive-push whoami # 查看当前登录的用户
```

### 创建app

```shell
$ alive-push app add <appName>
$ alive-push app ls # 查看已经创建的app的列表
```

### 创建deployment

```shell
$ alive-push deployment add <appName> <deploymentName>
$ alive-push deployment ls <appName> # 查看<appName>下所有的deployment
```

### 发布应用(上传应用)

需要`cd`到react-native应用的根目录,然后执行如下命令:

```shell
$ alive-push release [...options]
```

具体参数可以使用`-h`查看


## commands

### register

注册

```shell
$ alive-push register xxx@xxx.com 123456
```

### login

登录

```shell
$ alive-push login xxx@xxx.com 123456
```

### whoami

查看当前登录用户,有就返回登录用户的用户名,没有就返回空

```shell
$ alive-push whoami
```

### release

发布新应用.PS:执行命令前,先`cd`到react native的应用根目录!!!

```shell
$ alive-push release --appName=xxx --platform=android --binaryversion=0.0.1 --deployment=你对应的deployment的名字 --releasenote=版本说明
```

- 参数说明
    - appName       指的是alive push app的名字,即你通过`alive-push app add xxx`命令创建的app的名字
    - platform      平台,目前只能是android或者ios
    - binaryversion 对应的android/ios的version name
    - deployment    对应的deployment的名字
    - mandatory     是否强制更新
    - releasenote   发布说明
    - bundlepath    bundlepath指更新包的目录,如果设置了此参数将直接更新bundle,一般不建议使用.

### app <command>

app的相关操作

- app add <appName>

添加app

```shell
$ alive-push app add xxxx
```

- app ls

显示所有的app

```shell
$ alive-push app ls
```

- app remove

删除app

```shell
$ alive-push app remove xxx
```

- app rename

修改app名字

```shell
$ alive-push app rename oldAppName newAppName
```

### config <command>

- config ls
- config rm <key>
- config set <key> <value>

### deployment <command>

- deployment ls <appName>
- deployment add <appName> <deploymentName>
- deployment history <appName> <deploymentName>
- deployment remove <appName> <deploymentName>
- deployment rename <appName> <deploymentName> <newDeploymentName>

### password <command>

- reset <username>
- set <oldpassword> <newpassword>

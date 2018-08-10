/**
 * @providesModule react-native-device-info
 */

var APDeviceInfo = require('react-native').NativeModules.APDeviceInfo;

module.exports = {
  getUniqueID: function () {
    return APDeviceInfo.uniqueId;
  },
  getInstanceID: function() {
    return APDeviceInfo.instanceId;
  },
  getDeviceId: function () {
    return APDeviceInfo.deviceId;
  },
  getManufacturer: function () {
    return APDeviceInfo.systemManufacturer;
  },
  getModel: function () {
    return APDeviceInfo.model;
  },
  getBrand: function () {
    return APDeviceInfo.brand;
  },
  getSystemName: function () {
    return APDeviceInfo.systemName;
  },
  getSystemVersion: function () {
    return APDeviceInfo.systemVersion;
  },
  getBundleId: function() {
    return APDeviceInfo.bundleId;
  },
  getBuildNumber: function() {
    return APDeviceInfo.buildNumber;
  },
  getVersion: function() {
    return APDeviceInfo.appVersion;
  },
  getReadableVersion: function() {
    return APDeviceInfo.appVersion + "." + APDeviceInfo.buildNumber;
  },
  getDeviceName: function() {
    return APDeviceInfo.deviceName;
  },
  getUserAgent: function() {
    return APDeviceInfo.userAgent;
  },
  getDeviceLocale: function() {
    return APDeviceInfo.deviceLocale;
  },
  getDeviceCountry: function() {
    return APDeviceInfo.deviceCountry;
  },
  getTimezone: function() {
    return APDeviceInfo.timezone;
  },
  isEmulator: function() {
    return APDeviceInfo.isEmulator;
  },
  isTablet: function() {
    return APDeviceInfo.isTablet;
  },
};

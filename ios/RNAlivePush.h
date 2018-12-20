
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RNAlivePush : RCTEventEmitter <RCTBridgeModule>

+ (NSURL*)getJSBundleFile;

@end


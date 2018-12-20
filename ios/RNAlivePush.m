
#import "RNAlivePush.h"
#import <React/RCTBundleURLProvider.h>
#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>
#import <React/RCTRootView.h>
#import "APDeviceUID.h"
#import <sys/utsname.h>

#define kAlivePushConfigPath @"kAlivePushConfigPath.config"
#define kJSBundleFilePath @"bundle"

@implementation RNAlivePush

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}
RCT_EXPORT_MODULE()


- (NSArray<NSString *> *)supportedEvents
{
    return @[@"EVENT_BUNDLE_LOAD_ERROR"];
}




- (void)stopObserving
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSDictionary *)constantsToExport
{
    UIDevice *currentDevice = [UIDevice currentDevice];
    NSString *uniqueId = [APDeviceUID uid];
    
    return @{
             @"CachePath": [RNAlivePush documentPath],
             @"AlivePushConfigPath":[RNAlivePush getAlivePushConfigPath],
             @"VersionName":[RNAlivePush getVersionName],
             @"VersionCode":[RNAlivePush getVersinCode],
             @"JSBundleFile": [RNAlivePush getJSBundleFilePath],
             @"EVENT_BUNDLE_LOAD_ERROR":@"EVENT_BUNDLE_LOAD_ERROR",
             @"systemName": currentDevice.systemName,
             @"systemVersion": currentDevice.systemVersion,
             @"model": self.deviceName,
             @"brand": @"Apple",
             @"deviceId": self.deviceId,
             @"deviceName": currentDevice.name,
             @"deviceLocale": self.deviceLocale,
             @"deviceCountry": self.deviceCountry ?: [NSNull null],
             @"uniqueId": uniqueId,
             @"bundleId": [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleIdentifier"],
             @"appVersion": [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"],
             @"buildNumber": [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleVersion"],
             @"systemManufacturer": @"Apple",
             @"userAgent": self.userAgent,
             @"timezone": self.timezone,
             @"isEmulator": @(self.isEmulator),
             @"isTablet": @(self.isTablet),
             };
}
RCT_EXPORT_METHOD(reloadBundle)
{
    
    dispatch_async(dispatch_get_main_queue(), ^{
        UIWindow *window = [[UIApplication sharedApplication] valueForKeyPath:@"delegate.window"];
        if(!window){
            window =[[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
        }
        
        
        NSURL* jsCodeLocation = [RNAlivePush  getJSBundleFile];
        if(jsCodeLocation == nil){
            [self sendEventWithName:@"EVENT_BUNDLE_LOAD_ERROR" body:@{@"message": @"加载失败"}];
            return ;
        }
        RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                            moduleName:[[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleExecutable"]
                                                     initialProperties:nil
                                                         launchOptions:nil];
        rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];
        
        UIViewController *rootViewController = [UIViewController new];
        rootViewController.view = rootView;
        window.rootViewController = rootViewController;
        [window makeKeyAndVisible];
    });
    
}


+ (NSURL*)getJSBundleFile{
    
    NSURL *jsCodeLocation;
    
#ifdef DEBUG
    jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
    
    if([[NSFileManager defaultManager] fileExistsAtPath:[RNAlivePush getAlivePushConfigPath]]){
        
        NSString *config = [NSString stringWithContentsOfURL:[NSURL fileURLWithPath:[RNAlivePush getAlivePushConfigPath]] encoding:NSUTF8StringEncoding error:nil];
        
        
        NSData *data = [config dataUsingEncoding:NSUTF8StringEncoding];
        NSDictionary *dic = [NSJSONSerialization JSONObjectWithData:data
                                                            options:NSJSONWritingPrettyPrinted
                                                              error:nil];
        
        NSMutableString *filePath = [NSMutableString stringWithString:[dic objectForKey:@"path"] ];
        
        NSString *mainbundleJsPath =  [[RNAlivePush documentPath] stringByAppendingPathComponent:[[filePath componentsSeparatedByString:@"Documents"] lastObject]];
        
        BOOL isDirectory;
        
        if([[NSFileManager defaultManager] fileExistsAtPath:mainbundleJsPath isDirectory:&isDirectory]){
            jsCodeLocation = [NSURL fileURLWithPath:mainbundleJsPath];
        }
        else{
            jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
        }
    }
    else{
        jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
   }
    
#endif
    
    
    return jsCodeLocation;
}


#pragma mark custom methods ###

+ (NSString*)documentPath{
    
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    NSString *docDir = [paths objectAtIndex:0];
    return docDir;
}

+ (NSString*)getAlivePushConfigPath{
    
    NSString *fullConfigPath = [NSString stringWithFormat:@"%@.%@",kAlivePushConfigPath,[RNAlivePush getVersionName]];
    NSString *config = [[self documentPath] stringByAppendingPathComponent:fullConfigPath];
    
    return config;
}

+ (NSString*)getJSBundleFilePath{
    NSString *configPath = [RNAlivePush getAlivePushConfigPath];
    
    if([[NSFileManager defaultManager] fileExistsAtPath:configPath]){
        if(configPath != NULL){
            NSURL *filePath = [NSURL fileURLWithPath:configPath];
            NSString *dicStr = [NSString stringWithContentsOfURL:filePath encoding:NSUTF8StringEncoding error:nil];
            
            NSData *jsonData = [dicStr dataUsingEncoding:NSUTF8StringEncoding];
            if(jsonData!=NULL){
                NSError *err;
                NSDictionary *dic = [NSJSONSerialization JSONObjectWithData:jsonData
                                                                    options:NSJSONReadingMutableContainers
                                                                      error:&err];
                
                if(dic != NULL){
                    NSString *path = [dic objectForKey:@"path"];
                    return path;
                }
            }
            
        }
    }
    return  @"";//[[self documentPath] stringByAppendingPathComponent:kJSBundleFilePath];
}

+ (NSString*)getVersionName{
    
    NSDictionary *infoDictionary = [[NSBundle mainBundle] infoDictionary];
    NSString *app_Name = [infoDictionary objectForKey:@"CFBundleShortVersionString"];
    return app_Name;
}

+ (NSString*)getVersinCode{
    
    NSDictionary *infoDictionary = [[NSBundle mainBundle] infoDictionary];
    NSString *app_Version = [infoDictionary objectForKey:@"CFBundleVersion"];
    return app_Version;
}


- (NSString*) deviceId
{
    struct utsname systemInfo;
    
    uname(&systemInfo);
    
    return [NSString stringWithCString:systemInfo.machine
                              encoding:NSUTF8StringEncoding];
}

- (NSString*) deviceName
{
    static NSDictionary* deviceNamesByCode = nil;
    
    if (!deviceNamesByCode) {
        
        deviceNamesByCode = @{@"i386"      :@"Simulator",
                              @"x86_64"    :@"Simulator",
                              @"iPod1,1"   :@"iPod Touch",      // (Original)
                              @"iPod2,1"   :@"iPod Touch",      // (Second Generation)
                              @"iPod3,1"   :@"iPod Touch",      // (Third Generation)
                              @"iPod4,1"   :@"iPod Touch",      // (Fourth Generation)
                              @"iPod5,1"   :@"iPod Touch",      // (Fifth Generation)
                              @"iPod7,1"   :@"iPod Touch",      // (Sixth Generation)
                              @"iPhone1,1" :@"iPhone",          // (Original)
                              @"iPhone1,2" :@"iPhone 3G",       // (3G)
                              @"iPhone2,1" :@"iPhone 3GS",      // (3GS)
                              @"iPad1,1"   :@"iPad",            // (Original)
                              @"iPad2,1"   :@"iPad 2",          //
                              @"iPad2,2"   :@"iPad 2",          //
                              @"iPad2,3"   :@"iPad 2",          //
                              @"iPad2,4"   :@"iPad 2",          //
                              @"iPad3,1"   :@"iPad",            // (3rd Generation)
                              @"iPad3,2"   :@"iPad",            // (3rd Generation)
                              @"iPad3,3"   :@"iPad",            // (3rd Generation)
                              @"iPhone3,1" :@"iPhone 4",        // (GSM)
                              @"iPhone3,2" :@"iPhone 4",        // iPhone 4
                              @"iPhone3,3" :@"iPhone 4",        // (CDMA/Verizon/Sprint)
                              @"iPhone4,1" :@"iPhone 4S",       //
                              @"iPhone5,1" :@"iPhone 5",        // (model A1428, AT&T/Canada)
                              @"iPhone5,2" :@"iPhone 5",        // (model A1429, everything else)
                              @"iPad3,4"   :@"iPad",            // (4th Generation)
                              @"iPad3,5"   :@"iPad",            // (4th Generation)
                              @"iPad3,6"   :@"iPad",            // (4th Generation)
                              @"iPad2,5"   :@"iPad Mini",       // (Original)
                              @"iPad2,6"   :@"iPad Mini",       // (Original)
                              @"iPad2,7"   :@"iPad Mini",       // (Original)
                              @"iPhone5,3" :@"iPhone 5c",       // (model A1456, A1532 | GSM)
                              @"iPhone5,4" :@"iPhone 5c",       // (model A1507, A1516, A1526 (China), A1529 | Global)
                              @"iPhone6,1" :@"iPhone 5s",       // (model A1433, A1533 | GSM)
                              @"iPhone6,2" :@"iPhone 5s",       // (model A1457, A1518, A1528 (China), A1530 | Global)
                              @"iPhone7,1" :@"iPhone 6 Plus",   //
                              @"iPhone7,2" :@"iPhone 6",        //
                              @"iPhone8,1" :@"iPhone 6s",       //
                              @"iPhone8,2" :@"iPhone 6s Plus",  //
                              @"iPhone8,4" :@"iPhone SE",       //
                              @"iPhone9,1" :@"iPhone 7",        // (model A1660 | CDMA)
                              @"iPhone9,3" :@"iPhone 7",        // (model A1778 | Global)
                              @"iPhone9,2" :@"iPhone 7 Plus",   // (model A1661 | CDMA)
                              @"iPhone9,4" :@"iPhone 7 Plus",   // (model A1784 | Global)
                              @"iPad4,1"   :@"iPad Air",        // 5th Generation iPad (iPad Air) - Wifi
                              @"iPad4,2"   :@"iPad Air",        // 5th Generation iPad (iPad Air) - Cellular
                              @"iPad4,3"   :@"iPad Air",        // 5th Generation iPad (iPad Air)
                              @"iPad4,4"   :@"iPad Mini 2",     // (2nd Generation iPad Mini - Wifi)
                              @"iPad4,5"   :@"iPad Mini 2",     // (2nd Generation iPad Mini - Cellular)
                              @"iPad4,6"   :@"iPad Mini 2",     // (2nd Generation iPad Mini)
                              @"iPad4,7"   :@"iPad Mini 3",     // (3rd Generation iPad Mini)
                              @"iPad4,8"   :@"iPad Mini 3",     // (3rd Generation iPad Mini)
                              @"iPad4,9"   :@"iPad Mini 3",     // (3rd Generation iPad Mini)
                              @"iPad5,1"   :@"iPad Mini 4",     // (4th Generation iPad Mini)
                              @"iPad5,2"   :@"iPad Mini 4",     // (4th Generation iPad Mini)
                              @"iPad5,3"   :@"iPad Air 2",      // 6th Generation iPad (iPad Air 2)
                              @"iPad5,4"   :@"iPad Air 2",      // 6th Generation iPad (iPad Air 2)
                              @"iPad6,3"   :@"iPad Pro 9.7-inch",// iPad Pro 9.7-inch
                              @"iPad6,4"   :@"iPad Pro 9.7-inch",// iPad Pro 9.7-inch
                              @"iPad6,7"   :@"iPad Pro 12.9-inch",// iPad Pro 12.9-inch
                              @"iPad6,8"   :@"iPad Pro 12.9-inch",// iPad Pro 12.9-inch
                              @"AppleTV2,1":@"Apple TV",        // Apple TV (2nd Generation)
                              @"AppleTV3,1":@"Apple TV",        // Apple TV (3rd Generation)
                              @"AppleTV3,2":@"Apple TV",        // Apple TV (3rd Generation - Rev A)
                              @"AppleTV5,3":@"Apple TV",        // Apple TV (4th Generation)
                              };
    }
    
    NSString* deviceName = [deviceNamesByCode objectForKey:self.deviceId];
    
    if (!deviceName) {
        // Not found on database. At least guess main device type from string contents:
        
        if ([self.deviceId rangeOfString:@"iPod"].location != NSNotFound) {
            deviceName = @"iPod Touch";
        }
        else if([self.deviceId rangeOfString:@"iPad"].location != NSNotFound) {
            deviceName = @"iPad";
        }
        else if([self.deviceId rangeOfString:@"iPhone"].location != NSNotFound){
            deviceName = @"iPhone";
        }
    }
    
    return deviceName;
}

- (NSString*) userAgent
{
    UIWebView* webView = [[UIWebView alloc] initWithFrame:CGRectZero];
    return [webView stringByEvaluatingJavaScriptFromString:@"navigator.userAgent"];
}

- (NSString*) deviceLocale
{
    NSString *language = [[NSLocale preferredLanguages] objectAtIndex:0];
    return language;
}

- (NSString*) deviceCountry
{
    NSString *country = [[NSLocale currentLocale] objectForKey:NSLocaleCountryCode];
    return country;
}

- (NSString*) timezone
{
    NSTimeZone *currentTimeZone = [NSTimeZone localTimeZone];
    return currentTimeZone.name;
}

- (bool) isEmulator
{
    return [self.deviceName isEqual: @"Simulator"];
}

- (bool) isTablet
{
    return [[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPad;
}



@end


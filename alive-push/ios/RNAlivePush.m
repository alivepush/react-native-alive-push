
#import "RNAlivePush.h"
#import <React/RCTBundleURLProvider.h>
#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>
#import <React/RCTRootView.h>

#define kAlivePushConfigPath @"kAlivePushConfigPath.config"
#define kJSBundleFilePath @"bundle"

@implementation RNAlivePush

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}
RCT_EXPORT_MODULE()

- (NSDictionary *)constantsToExport
{
  NSDictionary *dic = @{ @"CachePath": [self documentPath],
                         @"AlivePushConfigPath":[self getAlivePushConfigPath],
                         @"VersionName":[self getVersionName],
                         @"VersionCode":[self getVersinCode],
                         @"JSBundleFilePath": [self getJSBundleFilePath]};
  return dic;
}


RCT_EXPORT_METHOD(restart)
{
  UIWindow *window = [[UIApplication sharedApplication] valueForKeyPath:@"delegate.window"];
  if(!window){
      window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  }
  
  NSURL* jsCodeLocation = [[RNAlivePush alloc] getJSBundleFile];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                      moduleName:@"test"
                                               initialProperties:nil
                                                   launchOptions:nil];
  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];
  
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  window.rootViewController = rootViewController;
  [window makeKeyAndVisible];
  
}

- (NSURL*)getJSBundleFile{
  
  NSURL *jsCodeLocation;
  
  
  if([[NSFileManager defaultManager] fileExistsAtPath:[self getAlivePushConfigPath]]){
    
    NSDictionary *dic = [[NSDictionary alloc] initWithContentsOfFile:[self getAlivePushConfigPath]];
    NSString *mainbundleJsPath = [dic objectForKey:@"path"];
    if([[NSFileManager defaultManager] fileExistsAtPath:mainbundleJsPath]){
      jsCodeLocation = [NSURL fileURLWithPath:mainbundleJsPath];
    }
    else{
      jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index.ios" fallbackResource:nil];
    }
  }
  else{
    jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index.ios" fallbackResource:nil];
  }
  
  return jsCodeLocation;
}


#pragma mark custom methods ###

- (NSString*)documentPath{
  
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  NSString *docDir = [paths objectAtIndex:0];
  return docDir;
}

- (NSString*)getAlivePushConfigPath{
  
  return [[self documentPath] stringByAppendingPathComponent:kAlivePushConfigPath];
}

- (NSString*)getJSBundleFilePath{
  return [[self documentPath] stringByAppendingPathComponent:kJSBundleFilePath];
}

- (NSString*)getVersionName{
  
  NSDictionary *infoDictionary = [[NSBundle mainBundle] infoDictionary];
  NSString *app_Name = [infoDictionary objectForKey:@"CFBundleShortVersionString"];
  return app_Name;
}

- (NSString*)getVersinCode{
  
  NSDictionary *infoDictionary = [[NSBundle mainBundle] infoDictionary];
  NSString *app_Version = [infoDictionary objectForKey:@"CFBundleVersion"];
  return app_Version;
}

@end

#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
// #import <FBSDKCoreKit/FBSDKCoreKit.h>
#import "RNSplashScreen.h"
#import <React/RCTLinkingManager.h> // deeplinking
#import <Firebase.h>
#import <GoogleMaps/GoogleMaps.h>
#import <GooglePlaces/GooglePlaces.h>
#import <AVFoundation/AVFoundation.h>
#import <CodePush/CodePush.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"Runrun";

  // ✅ Configure Firebase if not already initialized
  if ([FIRApp defaultApp] == nil) {
    [FIRApp configure];
  }

  // ✅ Initial props for React Native root view
  self.initialProps = @{};

  // ✅ Google Maps & Places API Key from Info.plist
  NSString *googlePlacesKey = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"PROJECT_GOOGLE_PLACE_KEY"];
  [GMSPlacesClient provideAPIKey:googlePlacesKey];
  [GMSServices provideAPIKey:googlePlacesKey];

  // ✅ Configure AVAudioSession for recording & playback
  NSError *sessionError = nil;
  AVAudioSession *session = [AVAudioSession sharedInstance];
  [session setCategory:AVAudioSessionCategoryPlayAndRecord
           withOptions:AVAudioSessionCategoryOptionDefaultToSpeaker
                 error:&sessionError];
  if (sessionError) {
    NSLog(@"[AVAudioSession] Error setting category: %@", sessionError);
  }

  [session setActive:YES error:&sessionError];
  if (sessionError) {
    NSLog(@"[AVAudioSession] Error activating session: %@", sessionError);
  }

  // ✅ Return React Native super init
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

// Optional FBSDK openURL handler (currently commented out)
/*
- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(nonnull NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options
{
  [[FBSDKApplicationDelegate sharedInstance] application:application
                                                 openURL:url
                                                 options:options]
  || [RCTLinkingManager application:application openURL:url options:options];
  return YES;
}
*/

// ✅ Clear pasteboard on entering foreground
- (void)applicationWillEnterForeground:(UIApplication *)application {
  UIPasteboard *pb = [UIPasteboard generalPasteboard];
  [pb setValue:@"" forPasteboardType:UIPasteboardNameGeneral];
}

// ✅ React Native bundle URL
- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [CodePush bundleURL];
#endif
}

// ✅ Deep Linking: Handle universal links
- (BOOL)application:(UIApplication *)application
 continueUserActivity:(nonnull NSUserActivity *)userActivity
 restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
  return [RCTLinkingManager application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
}

@end

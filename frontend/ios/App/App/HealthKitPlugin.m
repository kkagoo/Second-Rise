#import <Foundation/Foundation.h>
#import <Capacitor/CAPBridgedPlugin.h>
#import <Capacitor/CAPBridgedJSTypes.h>

CAP_PLUGIN(HealthKitPlugin, "HealthKitPlugin",
  CAP_PLUGIN_METHOD(checkAvailability,  CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(requestHKPermissions, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(syncToday,          CAPPluginReturnPromise);
)

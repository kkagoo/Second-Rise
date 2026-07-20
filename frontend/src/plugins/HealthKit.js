import { registerPlugin, Capacitor } from '@capacitor/core';

// iOS native shim — calls the native bridge directly, bypassing pluginHeader lookup
const iosImpl = {
  checkAvailability: (opts) =>
    Capacitor.nativePromise('HealthKitPlugin', 'checkAvailability', opts || {}),
  requestHKPermissions: (opts) =>
    Capacitor.nativePromise('HealthKitPlugin', 'requestHKPermissions', opts || {}),
  syncToday: (opts) =>
    Capacitor.nativePromise('HealthKitPlugin', 'syncToday', opts || {}),
};

// Registers the native iOS HealthKit plugin; on Android/web returns a no-op stub
const HealthKit = registerPlugin('HealthKitPlugin', {
  ios: async () => iosImpl,
  web: () => ({
    checkAvailability: async () => ({ available: false }),
    requestHKPermissions: async () => ({ granted: false }),
    syncToday: async () => { throw new Error('HealthKit is iOS-only'); },
  }),
  android: () => ({
    checkAvailability: async () => ({ available: false }),
    requestHKPermissions: async () => ({ granted: false }),
    syncToday: async () => { throw new Error('HealthKit is iOS-only'); },
  }),
});

export default HealthKit;

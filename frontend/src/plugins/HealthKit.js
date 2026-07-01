import { registerPlugin } from '@capacitor/core';

// Registers the native iOS HealthKit plugin; on Android/web returns a no-op stub
const HealthKit = registerPlugin('HealthKitPlugin', {
  web: () => ({
    checkAvailability: async () => ({ available: false }),
    requestPermissions: async () => ({ granted: false }),
    syncToday: async () => { throw new Error('HealthKit is iOS-only'); },
  }),
  android: () => ({
    checkAvailability: async () => ({ available: false }),
    requestPermissions: async () => ({ granted: false }),
    syncToday: async () => { throw new Error('HealthKit is iOS-only'); },
  }),
});

export default HealthKit;

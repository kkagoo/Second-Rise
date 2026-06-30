import { registerPlugin } from '@capacitor/core';

// Registers the native Android plugin; on iOS/web returns a no-op stub
const HealthConnect = registerPlugin('HealthConnect', {
  web: () => ({
    checkAvailability: async () => ({ status: 'unavailable' }),
    requestPermissions: async () => ({ granted: false }),
    syncToday: async () => { throw new Error('Health Connect is Android-only'); },
  }),
});

export default HealthConnect;

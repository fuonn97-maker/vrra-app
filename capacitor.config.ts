import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vrra.app',
  appName: 'VRRA',
  server: {
    url: 'https://vrra-app.vercel.app',
    cleartext: false,
  },
};

export default config;
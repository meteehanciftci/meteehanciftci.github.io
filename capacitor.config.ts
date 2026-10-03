import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.harcamadefteri.app",
  appName: "Denge",
  webDir: "out",
  android: {
    allowMixedContent: true,
  },
  plugins: {
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#F5F6F8",
    },
  },
};

export default config;

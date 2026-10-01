import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.harcamadefteri.app",
  appName: "Harcama Defteri",
  webDir: "out",
  android: {
    allowMixedContent: true,
  },
  plugins: {
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#F4F1EC",
    },
  },
};

export default config;

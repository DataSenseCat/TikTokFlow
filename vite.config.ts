import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(() => {
  const useCloudflare = process.env.BUILD_TARGET === 'cloudflare';
  const plugins = [react(), ...(useCloudflare ? cloudflare() : [])];

  return {
    plugins,
    build: {
      chunkSizeWarningLimit: 5000,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

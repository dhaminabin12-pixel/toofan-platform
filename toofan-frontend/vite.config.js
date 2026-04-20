import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
      plugins: [react()],
      optimizeDeps: {
              include: ["socket.io-client", "engine.io-client"],
      },
      build: {
              commonjsOptions: {
                        include: [/socket\.io-client/, /engine\.io-client/, /node_modules/],
                        transformMixedEsModules: true,
              },
      },
      server: {
              port: 3000,
              proxy: {
                        "/api":     { target: "http://localhost:5000", changeOrigin: true },
                        "/uploads": { target: "http://localhost:5000", changeOrigin: true },
                        "/socket.io": {
                                    target: "http://localhost:5000",
                                    changeOrigin: true,
                                    ws: true,
                        },
              },
      },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: false,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            const setCookie = proxyRes.headers['set-cookie'];
            if (setCookie) {
              proxyRes.headers['set-cookie'] = setCookie.map(cookie =>
                cookie
                  .replace(/; Domain=[^;]+/gi, '')
                  .replace(/; Secure/gi, '')
              );
            }
          });
        },
      },
      "/socket.io": {
        target: "http://localhost:4000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     extensions: [".js", ".jsx", ".ts", ".tsx"],
//   },
// })
// vite.config.js
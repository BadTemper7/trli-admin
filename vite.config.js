import path from "node:path"
import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, loadEnv } from "vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || "https://trli.onetrue.ph"

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: "localhost",
          cookiePathRewrite: "/",
        },
        "/socket.io": {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
          ws: true,
          cookieDomainRewrite: "localhost",
          cookiePathRewrite: "/",
        },
      },
    },
  }
})

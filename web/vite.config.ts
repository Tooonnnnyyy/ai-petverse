import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Production builds get a strict Content-Security-Policy: nothing may connect to a network,
// so pet photos and data physically cannot leave the browser (spec §11, §14).
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

function cspMeta(): Plugin {
  return {
    name: "petverse-csp",
    apply: "build",
    transformIndexHtml: () => [{ tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: csp }, injectTo: "head-prepend" }],
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), cspMeta()],
  server: {
    host: "127.0.0.1",
    port: 4174,
  },
});

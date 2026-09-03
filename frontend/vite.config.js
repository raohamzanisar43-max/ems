import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");

// The production build serves public/ assets under /static/ (via Django's
// STATICFILES_DIRS), so components reference them as "/static/<file>". In dev
// the /static prefix is proxied to the backend instead, which 404s on these
// frontend-only assets — rewrite the URL so Vite's own static middleware
// serves the file from public/ before the proxy gets a chance to.
function serveStaticAssetsFromPublic() {
  return {
    name: "serve-static-assets-from-public",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/static/")) {
          const relPath = req.url.slice("/static/".length).split("?")[0];
          if (fs.existsSync(path.join(publicDir, relPath))) {
            req.url = "/" + req.url.slice("/static/".length);
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [serveStaticAssetsFromPublic(), react()],
  // Production serves the built app through Django/whitenoise under
  // STATIC_URL ("/static/"), so bundled asset references need that prefix
  // baked in — otherwise the browser requests bare "/assets/..." which
  // Django's SPA catch-all answers with index.html instead of the real file.
  // Dev stays at "/" since the Vite dev server serves everything from root.
  base: command === "build" ? "/static/" : "/",
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
      "/static": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
}));

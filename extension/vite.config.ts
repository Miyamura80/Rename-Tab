import { crx } from "@crxjs/vite-plugin";
import { defineConfig } from "vite";
import manifest from "./manifest.config";

export default defineConfig({
    plugins: [crx({ manifest })],
    server: {
        port: 5173,
        strictPort: true,
        // crxjs needs a stable HMR port so the extension can reconnect.
        hmr: { port: 5173 },
    },
    build: {
        outDir: "dist",
        emptyOutDir: true,
        // Let crxjs derive Rollup inputs from the manifest; don't set
        // rollupOptions.input here (it breaks the crxjs dev server).
    },
});

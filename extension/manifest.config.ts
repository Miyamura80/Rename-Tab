import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json" with { type: "json" };

export default defineManifest({
    manifest_version: 3,
    name: "Rename Tab",
    description:
        "Rename your Chrome tabs with F2 or right-click. The custom name sticks even when the page tries to change it.",
    version: pkg.version,
    icons: {
        "16": "icons/icon-16.png",
        "48": "icons/icon-48.png",
        "128": "icons/icon-128.png",
    },
    permissions: ["storage", "contextMenus", "scripting", "activeTab"],
    background: {
        service_worker: "src/background.ts",
        type: "module",
    },
    content_scripts: [
        {
            matches: ["<all_urls>"],
            js: ["src/content.ts"],
            run_at: "document_start",
            all_frames: false,
        },
    ],
    commands: {
        "rename-tab": {
            description:
                "Rename the current tab (assign a key at chrome://extensions/shortcuts)",
        },
    },
    action: {
        default_title: "Rename this tab (F2)",
    },
});

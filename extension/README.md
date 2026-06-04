# Rename Tab: the extension

The Chrome extension itself (Manifest V3), written in TypeScript and built with
Vite + [CRXJS](https://crxjs.dev). Lets you rename any tab and makes the new name
**stick**, even on apps like Gmail, YouTube, and Notion that constantly rewrite
their own title.

## Develop

```bash
bun install      # once
bun run dev      # Vite + CRXJS in watch mode with hot-reload
```

Then load it in Chrome:

1. Open `chrome://extensions`, enable **Developer mode** (top-right).
2. **Load unpacked** → select the `extension/dist` folder.
3. Edit files in `src/`; CRXJS hot-reloads the extension automatically.

## Build / package

```bash
bun run build    # production build -> extension/dist (load this unpacked)
bun run zip      # build + zip -> extension/rename-tab.zip (for the Web Store)
bun run typecheck
```

## Use

Trigger a rename on the current tab. In order of reliability:

- **Click the toolbar icon** (the pencil). Pin it via the 🧩 menu first. This works
  from anywhere, including while you're in the vertical tab strip.
- Press **F2**, but only when the web **page** has keyboard focus.
- **Right-click the page** (the website body, not the tab) → **Rename tab**.

A small editor appears in the page. Type the new name, then:

- **Enter** to save · **Esc** to cancel.
- Leave it empty + Enter to clear a rename.
- Tick **Remember for this URL** to make it permanent (see below).

Whatever you type becomes the tab's title, so it shows up wherever your tabs are
rendered, including a **vertical tab strip**.

## How the name persists

| Mode | Sticks to | Survives refresh | Survives in-tab navigation | Survives tab close | Survives Chrome restart |
| --- | --- | :---: | :---: | :---: | :---: |
| **Default** | the tab | ✅ | ✅ | ❌ | ❌ |
| **Remember for this URL** | the URL | ✅ | ❌ (name is tied to the URL) | ✅ | ✅ |

Tab-scoped names live in `chrome.storage.session`; URL-scoped names live in
`chrome.storage.local`. A tab-scoped name takes priority over a URL rule.

## Where it can't work

Chrome forbids content scripts on privileged pages, so renaming is unavailable on
`chrome://*`, the Chrome Web Store, the New Tab Page, and the built-in PDF viewer.
The trigger simply no-ops there.

## Keyboard shortcuts

**F2 works out of the box** on any normal web page; it's handled inside the page,
so no setup is needed. The catch: it only fires when the page itself has keyboard
focus, not when you're clicking around the browser chrome / tab strip. (Chrome's own
shortcut system can't bind a bare function key; it requires a Ctrl/Alt modifier, which
is why F2 is wired in the content script instead.)

Want a shortcut that also works from the tab strip? Open `chrome://extensions/shortcuts`,
find **Rename Tab → "Rename the current tab"**, and assign e.g. `Alt+R` or
`Ctrl+Shift+E`. That one is dispatched by the browser, so page focus doesn't matter.

## What this can't do (and why)

This does **not** add a rename option to the native tab's right-click menu, and you
can't double-click a native tab to edit it. Chrome exposes no API for the tab
strip, unlike Arc (which is its own browser). The extension changes the page's
`document.title`, the only lever Chrome gives extensions; the renamed text then
appears on the native tab as a side effect.

## Files

- `manifest.config.ts` - typed MV3 manifest (CRXJS `defineManifest`).
- `vite.config.ts` - Vite + CRXJS build config.
- `src/background.ts` - service worker: triggers + the two name stores.
- `src/content.ts` - sticky-title engine + the Shadow-DOM inline editor.
- `src/messages.ts` - message contracts shared by both.
- `public/icons/` - the pencil app icons (16/48/128); `icon.svg` is the source,
  rasterized with ImageMagick's native vector engine (IM has no SVG delegate here).

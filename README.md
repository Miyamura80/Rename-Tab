# Rename Tab

<p align="center">
  <img src="media/banner.png" alt="Rename Tab" width="420">
</p>

<p align="center">
<b>Give any Chrome tab a name of your own, and make it stick, even when the page fights back.</b>
</p>

Rename Tab is a tiny **Manifest V3** Chrome extension. The new name shows up wherever
Chrome draws your tabs, **including a vertical tab strip**, and survives the SPAs
(Gmail, YouTube, Notion…) that constantly rewrite their own title.

## Quick start

```bash
make setup     # cd extension && bun install
make build     # production build -> extension/dist
```

Then load it: open `chrome://extensions` → enable **Developer mode** →
**Load unpacked** → select **`extension/dist`**.

**Pin the toolbar icon now** is the main way you'll trigger a rename. Click the
puzzle-piece 🧩 in Chrome's toolbar and pin **Rename Tab**. The pencil icon that
appears is your rename button.

<p align="center">
  <img src="media/screenshot.png" alt="Rename Tab loaded on chrome://extensions, with the pinned toolbar icon highlighted" width="760">
  <br>
  <em>Pinned to the toolbar. That pencil is your rename button.</em>
</p>

> For live development with hot-reload, run `make dev` instead of `make build`, load
> `extension/dist` once, and CRXJS reloads on every save.

## How to rename a tab

| Trigger | Notes |
| --- | --- |
| **Click the pencil toolbar icon** | The reliable one; works from anywhere, even while you're in the tab strip. |
| **F2** | Works on any normal page, **but only when the page has keyboard focus** (click into the page first). |

A small editor pops up in the page. Type the new name, then **Enter** to save (**Esc**
cancels, **empty + Enter** clears). A rename follows the **tab** until you close it;
tick **Remember for this URL** to tie it to the **URL** instead, so it survives restarts
and returns on every visit.

It can't rename privileged pages (`chrome://*`, the Chrome Web Store, the New Tab Page,
PDFs). Chrome blocks extensions there, so the trigger simply no-ops.

See [`extension/README.md`](extension/README.md) for the architecture and dev details.

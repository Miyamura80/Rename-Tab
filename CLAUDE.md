# CLAUDE.md

## Project

Rename Tab is a Manifest V3 Chrome extension that renames the current tab. All code
lives in `extension/` (TypeScript, built with Vite + [CRXJS](https://crxjs.dev), Bun
as package manager). The repo root is just tooling (Makefile, Biome) that delegates in.

**The headline constraint:** Chrome exposes no API for the native tab strip, so you
cannot double-click a native tab, add to its right-click menu, or draw on it (that's
Arc, a separate browser). The *only* way to rename a tab is to override the page's
`document.title` from a content script and keep it pinned with a `MutationObserver`
against SPAs that rewrite it. Every feature is built on that one lever.

## Architecture

- `extension/src/background.ts` - service worker: routes the toolbar-click trigger to
  the active tab, and owns both name stores. (F2 lives in the content script.)
- `extension/src/content.ts` - sticky-title engine + the Shadow-DOM inline editor.
- `extension/src/messages.ts` - typed message contracts between the two.
- `extension/manifest.config.ts` - the manifest (CRXJS `defineManifest`).

Persistence: tab-scoped names → `chrome.storage.session` (die on close/restart);
url-scoped names ("Remember for this URL") → `chrome.storage.local`. Tab scope wins
over URL scope. Only the background sees a tab's id, so it owns the stores.

Gotchas:
- F2 is handled by a content-script keydown listener, not `chrome.commands` (Chrome
  rejects a bare function key as a command shortcut), so there is no `commands` block in
  the manifest. The only background-routed trigger is the toolbar click.
- The scripting-injection fallback reads the content script's built path from
  `chrome.runtime.getManifest()`, because CRXJS hashes the filename.

## Commands

```bash
make setup      # cd extension && bun install
make dev        # Vite + CRXJS watch mode with hot-reload (load extension/dist unpacked)
make build      # production build -> extension/dist
make zip        # build + package extension/rename-tab.zip
make ci         # lint + typecheck (run before committing)
make fmt        # Biome auto-fix
```

## Code Style

Enforced by Biome (`biome.json`): 4-space indent, double quotes, 88 cols. camelCase
functions/vars, PascalCase types, UPPER_CASE consts, kebab-case filenames.

## Commit Convention

Emoji prefix by change type/magnitude (multiple emojis = 5+ files): 🏗️ initial · 🔨
feature · 🐛 bugfix · ✨ formatting/lint only · ⚙️ config.

## Git Workflow

`main` is protected; never push to it directly; use PRs, squash-and-merge. Never force
push. Run `make ci` before committing and fix all issues first.

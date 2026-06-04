// Rename Tab: content script (runs at document_start on every page).
//
// Does three things:
//   1. Keeps a custom title "stuck" against pages/SPAs that rewrite document.title.
//   2. On load, asks the background for any saved name for this tab/URL and applies it.
//   3. On F2 / right-click / toolbar click, shows a Shadow-DOM inline editor.

import type { Message, SavedNameResponse } from "./messages";

declare global {
    interface Window {
        __renameTab__?: boolean;
    }
}

(() => {
    // Guard against double-injection (declarative + scripting fallback).
    if (window.__renameTab__) {
        return;
    }
    window.__renameTab__ = true;

    let customTitle: string | null = null; // null == not overriding
    let applying = false; // re-entrancy guard so our own write doesn't loop
    let titleObserver: MutationObserver | null = null;
    let headObserver: MutationObserver | null = null;

    // ----- sticky title machinery -----------------------------------------

    function getTitleEl(): HTMLTitleElement | null {
        return (
            document.querySelector("head > title") ||
            document.getElementsByTagName("title")[0] ||
            null
        );
    }

    function applyTitle(): void {
        if (customTitle == null) {
            return;
        }
        if (document.title === customTitle) {
            return; // already correct; breaks the observer feedback loop
        }
        applying = true;
        document.title = customTitle;
        queueMicrotask(() => {
            applying = false;
        });
    }

    function observeTitleNode(): void {
        titleObserver?.disconnect();
        const el = getTitleEl();
        if (!el) {
            return;
        }
        titleObserver = new MutationObserver(() => {
            if (!applying) {
                applyTitle();
            }
        });
        // characterData catches in-place text edits; childList catches the
        // text node being swapped out (some frameworks do this).
        titleObserver.observe(el, {
            subtree: true,
            characterData: true,
            childList: true,
        });
    }

    function ensureHeadObserver(): void {
        const head = document.head || document.querySelector("head");
        if (!head) {
            // <head> not parsed yet at document_start; retry next frame.
            requestAnimationFrame(ensureHeadObserver);
            return;
        }
        // Watch <head> so we notice when the whole <title> node is replaced.
        headObserver = new MutationObserver(() => {
            if (applying) {
                return;
            }
            observeTitleNode();
            applyTitle();
        });
        headObserver.observe(head, { childList: true });
        observeTitleNode();
        applyTitle();
    }

    function setCustomTitle(title: string): void {
        const trimmed = title.trim();
        customTitle = trimmed ? trimmed : null;
        if (customTitle == null) {
            return; // cleared; stop forcing, let the page set its own title
        }
        if (!getTitleEl()) {
            const t = document.createElement("title");
            (document.head || document.documentElement).appendChild(t);
            observeTitleNode();
        }
        applyTitle();
    }

    ensureHeadObserver();

    // ----- restore any saved name for this tab/URL ------------------------

    chrome.runtime.sendMessage(
        { type: "GET_SAVED_NAME", url: location.href },
        (resp: SavedNameResponse | undefined) => {
            if (chrome.runtime.lastError) {
                return;
            }
            if (resp?.name) {
                setCustomTitle(resp.name);
            }
        },
    );

    // ----- messages from the background -----------------------------------

    chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
        if (message.type === "OPEN_EDITOR") {
            openEditor();
            sendResponse({ ok: true });
        }
        return true;
    });

    // ----- F2 to rename (capture phase so the page can't swallow it) ------

    window.addEventListener(
        "keydown",
        (e) => {
            if (e.key === "F2" && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                e.stopPropagation();
                openEditor();
            }
        },
        true,
    );

    // ----- Shadow-DOM inline editor ---------------------------------------

    let editorHost: HTMLDivElement | null = null;

    function currentDisplayName(): string {
        return customTitle != null ? customTitle : document.title;
    }

    function closeEditor(previousFocus: Element | null): void {
        editorHost?.remove();
        editorHost = null;
        if (previousFocus instanceof HTMLElement) {
            previousFocus.focus();
        }
    }

    function openEditor(): void {
        if (editorHost) {
            return; // already open
        }
        const previousFocus = document.activeElement;

        editorHost = document.createElement("div");
        editorHost.style.cssText =
            "all: initial; position: fixed; inset: 0; z-index: 2147483647;";
        document.documentElement.appendChild(editorHost);

        const root = editorHost.attachShadow({ mode: "closed" });
        root.innerHTML = `
            <style>
                .backdrop {
                    position: fixed; inset: 0;
                    background: rgba(15, 23, 42, 0.28);
                    display: flex; justify-content: center; align-items: flex-start;
                    padding-top: 14vh;
                    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
                }
                .box {
                    background: #fff; color: #0f172a;
                    border-radius: 14px;
                    box-shadow: 0 18px 60px rgba(0, 0, 0, 0.35);
                    padding: 18px 18px 14px;
                    width: min(460px, 92vw);
                }
                .label { font-size: 12px; font-weight: 600; color: #64748b; letter-spacing: .02em; margin-bottom: 8px; text-transform: uppercase; }
                input[type="text"] {
                    width: 100%; box-sizing: border-box;
                    font-size: 16px; padding: 11px 13px;
                    border: 2px solid #2563eb; border-radius: 9px;
                    outline: none; color: #0f172a; background: #fff;
                }
                .row { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
                .remember { display: flex; align-items: center; gap: 7px; font-size: 13px; color: #475569; cursor: pointer; user-select: none; }
                .remember input { width: 15px; height: 15px; accent-color: #2563eb; cursor: pointer; }
                .hint { font-size: 11px; color: #94a3b8; }
                kbd { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; padding: 1px 5px; font-size: 11px; font-family: inherit; }
            </style>
            <div class="backdrop" part="backdrop">
                <div class="box" role="dialog" aria-label="Rename tab">
                    <div class="label">Rename this tab</div>
                    <input type="text" aria-label="New tab name" autocomplete="off" spellcheck="false" />
                    <div class="row">
                        <label class="remember">
                            <input type="checkbox" />
                            Remember for this URL
                        </label>
                        <span class="hint"><kbd>Enter</kbd> save &middot; <kbd>Esc</kbd> cancel</span>
                    </div>
                </div>
            </div>
        `;

        const backdrop = root.querySelector<HTMLDivElement>(".backdrop");
        const input = root.querySelector<HTMLInputElement>('input[type="text"]');
        const remember = root.querySelector<HTMLInputElement>('input[type="checkbox"]');
        if (!backdrop || !input || !remember) {
            return;
        }

        const commit = (): void => {
            const name = input.value.trim();
            const scope = remember.checked ? "url" : "tab";
            setCustomTitle(name); // empty string -> clears the override
            void chrome.runtime.sendMessage({
                type: "SAVE_NAME",
                name: name || null,
                scope,
                url: location.href,
            });
            closeEditor(previousFocus);
        };

        input.addEventListener("keydown", (e) => {
            e.stopPropagation(); // don't let the page's shortcuts steal keys
            if (e.key === "Enter") {
                e.preventDefault();
                commit();
            } else if (e.key === "Escape") {
                e.preventDefault();
                closeEditor(previousFocus);
            }
        });
        backdrop.addEventListener("mousedown", (e) => {
            if (e.target === backdrop) {
                closeEditor(previousFocus); // click outside == cancel
            }
        });

        input.value = currentDisplayName();
        requestAnimationFrame(() => {
            input.focus();
            input.select();
        });
    }
})();

// Rename Tab — service worker.
//
// Responsibilities:
//   1. Register the right-click context-menu item and the (optional) command.
//   2. Route a rename trigger (command / context menu / toolbar click) to the
//      active tab's content script, injecting it on the fly if needed.
//   3. Own the two name stores, since only the background knows a tab's id:
//        - tab-scoped names -> chrome.storage.session (dies on tab close / restart)
//        - url-scoped names  -> chrome.storage.local    (persists forever)

import type {
    GetSavedNameMessage,
    Message,
    SaveNameMessage,
    SavedNameResponse,
} from "./messages";

const MENU_ID = "rename-tab";
const COMMAND_ID = "rename-tab";

// ---------------------------------------------------------------------------
// Triggers
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: MENU_ID,
        title: "Rename tab",
        // List every page context so the item shows up no matter what the
        // pointer is over (plain page, a link, an image, selected text, ...).
        contexts: ["page", "selection", "link", "image", "video", "audio", "editable"],
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === MENU_ID && tab) {
        void triggerRename(tab);
    }
});

chrome.commands.onCommand.addListener((command, tab) => {
    if (command !== COMMAND_ID) {
        return;
    }
    if (tab) {
        void triggerRename(tab);
    } else {
        chrome.tabs.query({ active: true, currentWindow: true }, ([active]) => {
            if (active) {
                void triggerRename(active);
            }
        });
    }
});

// Clicking the toolbar icon is a free third trigger.
chrome.action.onClicked.addListener((tab) => {
    void triggerRename(tab);
});

// Clean up tab-scoped names when their tab goes away.
chrome.tabs.onRemoved.addListener((tabId) => {
    void chrome.storage.session.remove(String(tabId));
});

// Open the in-page editor on the given tab. Falls back to injecting the
// content script first, which covers tabs that were already open when the
// extension was installed/updated (no declarative injection happened yet).
async function triggerRename(tab: chrome.tabs.Tab): Promise<void> {
    if (tab.id == null) {
        return;
    }
    const tabId = tab.id;
    try {
        await chrome.tabs.sendMessage(tabId, { type: "OPEN_EDITOR" });
    } catch {
        try {
            // The content script wasn't there (tab was open before install).
            // Inject it using its real built path(s) from the final manifest,
            // then retry — crxjs hashes the filename so we can't hardcode it.
            const files = (chrome.runtime.getManifest().content_scripts ?? []).flatMap(
                (script) => script.js ?? [],
            );
            if (files.length > 0) {
                await chrome.scripting.executeScript({ target: { tabId }, files });
            }
            await chrome.tabs.sendMessage(tabId, { type: "OPEN_EDITOR" });
        } catch {
            // chrome://, the Web Store, the New Tab Page, PDFs, etc. cannot run
            // content scripts, so there is nothing we can rename there.
            console.warn("Rename Tab: this page can't be renamed.");
        }
    }
}

// ---------------------------------------------------------------------------
// Name stores (queried by the content script)
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
    if (message.type === "GET_SAVED_NAME") {
        void getSavedName(sender, message).then(sendResponse);
        return true; // async response
    }
    if (message.type === "SAVE_NAME") {
        void saveName(sender, message).then(() => sendResponse({ ok: true }));
        return true;
    }
    return false;
});

// Resolve the name to apply: a tab-scoped name wins over a url-scoped one.
async function getSavedName(
    sender: chrome.runtime.MessageSender,
    message: GetSavedNameMessage,
): Promise<SavedNameResponse> {
    const tabId = sender.tab?.id;
    if (tabId != null) {
        const key = String(tabId);
        const session = await chrome.storage.session.get(key);
        if (session[key]) {
            return { name: session[key] as string };
        }
    }
    if (message.url) {
        const local = await chrome.storage.local.get(message.url);
        if (local[message.url]) {
            return { name: local[message.url] as string };
        }
    }
    return { name: null };
}

async function saveName(
    sender: chrome.runtime.MessageSender,
    message: SaveNameMessage,
): Promise<void> {
    const tabId = sender.tab?.id;
    const { name, scope, url } = message;

    // Empty name == clear this tab's rename everywhere.
    if (!name) {
        if (tabId != null) {
            await chrome.storage.session.remove(String(tabId));
        }
        if (url) {
            await chrome.storage.local.remove(url);
        }
        return;
    }

    if (scope === "url" && url) {
        // "Remember for this URL" -> persist by URL only, so it follows the
        // page (and survives restarts) rather than the tab.
        await chrome.storage.local.set({ [url]: name });
    } else if (tabId != null) {
        // Default -> follows this tab until it closes.
        await chrome.storage.session.set({ [String(tabId)]: name });
    }
}

// Message contracts shared between the content script and the service worker.

/** Scope a saved name applies to. */
export type Scope = "tab" | "url";

/** Background -> content: open the in-page rename editor. */
export interface OpenEditorMessage {
    type: "OPEN_EDITOR";
}

/** Content -> background: what name (if any) should this tab/URL show? */
export interface GetSavedNameMessage {
    type: "GET_SAVED_NAME";
    url: string;
}

/** Content -> background: persist (or clear, when name is null) a name. */
export interface SaveNameMessage {
    type: "SAVE_NAME";
    name: string | null;
    scope: Scope;
    url: string;
}

export type Message = OpenEditorMessage | GetSavedNameMessage | SaveNameMessage;

export interface SavedNameResponse {
    name: string | null;
}

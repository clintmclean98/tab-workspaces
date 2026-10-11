// Contract between extension pages and the service worker.
export interface SaveWindowRequest {
  type: "save-window";
  windowId: number;
  closeAfter: boolean;
}

export type SaveWindowResponse =
  | { ok: true; collectionId: string | null } // null: the window had nothing savable
  | { ok: false; error: string };

export function requestSaveWindow(windowId: number, closeAfter: boolean): Promise<SaveWindowResponse> {
  const request: SaveWindowRequest = { type: "save-window", windowId, closeAfter };
  return chrome.runtime.sendMessage(request);
}

// Contract between extension pages and the service worker. Add a request by
// adding one entry to each map; the sender and the handler table are then
// type-checked against it.
export interface Requests {
  "save-window": { windowId: number; closeAfter: boolean };
  "create-workspace": { windowId: number; name: string; fromWindow: boolean };
  "switch-workspace": { windowId: number; workspaceId: string };
}

export interface Responses {
  /** collectionId is null when the window had nothing savable. */
  "save-window": { collectionId: string | null };
  "create-workspace": { workspaceId: string };
  "switch-workspace": Record<string, never>;
}

export type MessageType = keyof Requests;
export type Message = { [K in MessageType]: { type: K } & Requests[K] }[MessageType];
export type Result<K extends MessageType> = ({ ok: true } & Responses[K]) | { ok: false; error: string };
export type Handlers = { [K in MessageType]: (request: Requests[K]) => Promise<Responses[K]> };

export function send<K extends MessageType>(type: K, payload: Requests[K]): Promise<Result<K>> {
  return chrome.runtime.sendMessage({ type, ...payload });
}

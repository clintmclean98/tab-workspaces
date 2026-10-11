import type { SaveWindowRequest, SaveWindowResponse } from "../shared/messages";
import { saveTabsAsCollection } from "../shared/store";

const MANAGER_URL = chrome.runtime.getURL("newtab.html");

/** Focus the collections manager if it is open anywhere, otherwise open it. */
async function openManager() {
  const [existing] = await chrome.tabs.query({ url: MANAGER_URL });
  if (existing?.id == null) {
    await chrome.tabs.create({ url: MANAGER_URL });
    return;
  }
  await chrome.tabs.update(existing.id, { active: true });
  await chrome.windows.update(existing.windowId, { focused: true });
}

/**
 * Save a window's session, optionally closing it. A session is the window's
 * non-pinned tabs: pinned tabs are neither saved nor closed.
 */
async function saveWindow(windowId: number, closeAfter: boolean) {
  const all = await chrome.tabs.query({ windowId });
  const session = all.filter((t) => !t.pinned && t.url !== MANAGER_URL);
  const saved = await saveTabsAsCollection(session);
  if (!saved || !closeAfter) return saved;

  // Closing the last tab closes the window, so leave a manager tab behind.
  if (session.length === all.length) await chrome.tabs.create({ windowId, url: MANAGER_URL });
  await chrome.tabs.remove(session.map((t) => t.id!));
  return saved;
}

chrome.runtime.onMessage.addListener((request: SaveWindowRequest, _sender, respond: (r: SaveWindowResponse) => void) => {
  if (request.type !== "save-window") return;
  saveWindow(request.windowId, request.closeAfter).then(
    (saved) => respond({ ok: true, collectionId: saved?.id ?? null }),
    (e) => respond({ ok: false, error: String(e) }),
  );
  return true; // respond asynchronously
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "open-manager") await openManager();
  if (command === "save-session") {
    const win = await chrome.windows.getLastFocused();
    if (win.id != null) await saveWindow(win.id, false);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "open-manager", title: "Open collections", contexts: ["action"] });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "open-manager") void openManager();
});

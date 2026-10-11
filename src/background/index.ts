import { saveTabsAsCollection } from "../shared/store";

const MANAGER = "newtab.html";

async function openManager(windowId?: number) {
  const url = chrome.runtime.getURL(MANAGER);
  const [existing] = await chrome.tabs.query({ url });
  if (existing?.id != null) {
    await chrome.tabs.update(existing.id, { active: true });
    await chrome.windows.update(existing.windowId, { focused: true });
    return;
  }
  await chrome.tabs.create({ url, windowId });
}

/** Save every savable tab in the window, then close them (keeping the window alive). */
async function saveWindow(windowId: number, closeAfter: boolean) {
  const tabs = await chrome.tabs.query({ windowId });
  const saved = await saveTabsAsCollection(tabs);
  if (!saved || !closeAfter) return saved;
  const managerUrl = chrome.runtime.getURL(MANAGER);
  const ids = tabs
    .filter((t) => t.id != null && !t.pinned && !t.url?.startsWith(managerUrl))
    .map((t) => t.id!);
  await openManager(windowId); // ensure the window isn't left empty
  await chrome.tabs.remove(ids);
  return saved;
}

chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
  if (msg?.type === "save-window" && typeof msg.windowId === "number") {
    saveWindow(msg.windowId, !!msg.closeAfter).then(
      (c) => respond({ ok: true, collectionId: c?.id ?? null }),
      (e) => respond({ ok: false, error: String(e) }),
    );
    return true; // async response
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "open-manager") await openManager();
  if (command === "save-session") {
    const win = await chrome.windows.getLastFocused();
    if (win.id != null) await saveWindow(win.id, false);
  }
});

chrome.omnibox.onInputEntered.addListener(async (text) => {
  // Placeholder go-links: "to <term>" opens the manager; resolution comes later.
  await openManager();
  console.debug("omnibox go-link", text);
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "open-manager",
    title: "Open collections",
    contexts: ["action"],
  });
  chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: false }).catch(() => {});
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "open-manager") void openManager();
});

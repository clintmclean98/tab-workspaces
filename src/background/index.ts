import type { Handlers, Message } from "../shared/messages";
import { matchGoLinks, resolveGoLink } from "../shared/golinks";
import { listGoLinks, saveTabsAsCollection } from "../shared/store";
import { MANAGER_URL, openManager, windowSession } from "./session";
import { createWorkspaceFor, onWindowRemoved, scheduleSync, switchWorkspace } from "./workspaces";

/** Save a window's session as a collection, optionally closing it. */
async function saveWindow(windowId: number, closeAfter: boolean) {
  const { session, survivors } = await windowSession(windowId);
  const saved = await saveTabsAsCollection(session);
  if (!saved || !closeAfter) return saved;

  // Closing the last tab closes the window, so leave a manager tab behind.
  if (survivors === 0) await chrome.tabs.create({ windowId, url: MANAGER_URL });
  await chrome.tabs.remove(session.map((t) => t.id!));
  return saved;
}

const handlers: Handlers = {
  "save-window": async ({ windowId, closeAfter }) => ({
    collectionId: (await saveWindow(windowId, closeAfter))?.id ?? null,
  }),
  "create-workspace": async ({ windowId, name, fromWindow }) => ({
    workspaceId: (await createWorkspaceFor(windowId, name, fromWindow)).id,
  }),
  "switch-workspace": async ({ windowId, workspaceId }) => {
    await switchWorkspace(windowId, workspaceId);
    return {};
  },
};

chrome.runtime.onMessage.addListener((message: Message, _sender, respond) => {
  const handle = handlers[message.type] as ((m: Message) => Promise<object>) | undefined;
  if (!handle) return;
  handle(message).then(
    (result) => respond({ ok: true, ...result }),
    (e) => respond({ ok: false, error: String(e) }),
  );
  return true; // respond asynchronously
});

// Keep a window's workspace in step with its tabs.
chrome.tabs.onCreated.addListener((t) => scheduleSync(t.windowId));
chrome.tabs.onUpdated.addListener((_id, change, t) => {
  if (change.url || change.title || change.pinned !== undefined || change.status === "complete") scheduleSync(t.windowId);
});
// A closing window removes its tabs one by one; syncing then would empty the workspace.
chrome.tabs.onRemoved.addListener((_id, info) => {
  if (!info.isWindowClosing) scheduleSync(info.windowId);
});
chrome.tabs.onMoved.addListener((_id, info) => scheduleSync(info.windowId));
chrome.tabs.onAttached.addListener((_id, info) => scheduleSync(info.newWindowId));
chrome.tabs.onDetached.addListener((_id, info) => scheduleSync(info.oldWindowId));
chrome.windows.onRemoved.addListener((windowId) => void onWindowRemoved(windowId));

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "open-manager") await openManager();
  if (command === "save-session") {
    const win = await chrome.windows.getLastFocused();
    if (win.id != null) await saveWindow(win.id, false);
  }
});

// Go-links: type `to <name>` in the address bar.
chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  const matches = matchGoLinks(await listGoLinks(), text);
  suggest(matches.map((l) => ({ content: l.name, description: `${escapeXml(l.name)} - <url>${escapeXml(l.url)}</url>` })));
});

chrome.omnibox.onInputEntered.addListener(async (text, disposition) => {
  const link = resolveGoLink(await listGoLinks(), text);
  if (!link) return void (await openManager()); // unknown name: show the list so it can be added
  if (disposition === "currentTab") await chrome.tabs.update({ url: link.url });
  else await chrome.tabs.create({ url: link.url, active: disposition === "newForegroundTab" });
});

const escapeXml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "open-manager", title: "Open collections", contexts: ["action"] });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "open-manager") void openManager();
});

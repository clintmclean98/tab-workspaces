export const MANAGER_URL = chrome.runtime.getURL("newtab.html");

/** Focus the collections manager if it is open anywhere, otherwise open it. */
export async function openManager() {
  const [existing] = await chrome.tabs.query({ url: MANAGER_URL });
  if (existing?.id == null) {
    await chrome.tabs.create({ url: MANAGER_URL });
    return;
  }
  await chrome.tabs.update(existing.id, { active: true });
  await chrome.windows.update(existing.windowId, { focused: true });
}

/**
 * A window's session is its non-pinned tabs other than the manager: the set that
 * gets saved, synced to a workspace, and closed when switching. `survivors` is
 * how many tabs remain in the window if the session is closed.
 */
export async function windowSession(windowId: number) {
  const all = await chrome.tabs.query({ windowId });
  const session = all.filter((t) => !t.pinned && t.url !== MANAGER_URL);
  return { session, survivors: all.length - session.length };
}

const SEARCH_URL = chrome.runtime.getURL("search.html");

/** Open the search window for the currently focused browser window, or focus it if already open. */
export async function openSearch() {
  const [existing] = await chrome.tabs.query({ url: `${SEARCH_URL}*` });
  if (existing?.windowId != null) {
    await chrome.windows.update(existing.windowId, { focused: true });
    return;
  }
  const origin = await chrome.windows.getLastFocused();
  await chrome.windows.create({ url: `${SEARCH_URL}?w=${origin.id}`, type: "popup", width: 680, height: 520, focused: true });
}

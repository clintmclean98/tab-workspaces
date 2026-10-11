import { listCollections, listGoLinks, listWorkspaces } from "../shared/store";
import type { SearchItem } from "../shared/universalSearch";

/** Everything searchable without a query-dependent lookup: open tabs, saved cards, workspaces, go-links. */
export async function loadLocalItems(): Promise<SearchItem[]> {
  const [tabs, collections, workspaces, goLinks] = await Promise.all([
    chrome.tabs.query({}),
    listCollections(),
    listWorkspaces(),
    listGoLinks(),
  ]);
  const ownPages = chrome.runtime.getURL(""); // the manager and this search window are noise
  return [
    ...tabs
      .filter((t) => t.id != null && t.url && !t.url.startsWith(ownPages))
      .map((t): SearchItem => ({ kind: "tab", key: `tab:${t.id}`, title: t.title || t.url!, url: t.url!, tabId: t.id!, windowId: t.windowId })),
    ...workspaces.map((w): SearchItem => ({ kind: "workspace", key: `ws:${w.id}`, title: w.name, workspaceId: w.id, subtitle: `Workspace · ${w.cards.length} tabs` })),
    ...goLinks.map((l): SearchItem => ({ kind: "golink", key: `go:${l.name}`, title: `to ${l.name}`, url: l.url, subtitle: "Go-link" })),
    ...collections.flatMap((c) =>
      c.cards.map((k): SearchItem => ({ kind: "card", key: `card:${c.id}:${k.id}`, title: k.title, url: k.url, subtitle: `Collection: ${c.title}${k.note ? ` · ${k.note}` : ""}` })),
    ),
    ...workspaces.flatMap((w) =>
      w.cards.map((k): SearchItem => ({ kind: "card", key: `card:${w.id}:${k.id}`, title: k.title, url: k.url, subtitle: `Workspace: ${w.name}${k.note ? ` · ${k.note}` : ""}` })),
    ),
  ];
}

const HISTORY: chrome.permissions.Permissions = { permissions: ["history"] };

export const hasHistoryAccess = async (): Promise<boolean> => chrome.permissions.contains(HISTORY);
/** Must be called from a user gesture such as a click. */
export const requestHistoryAccess = async (): Promise<boolean> => chrome.permissions.request(HISTORY);

export async function searchHistory(text: string, maxResults = 20): Promise<SearchItem[]> {
  if (!text.trim() || !(await hasHistoryAccess())) return [];
  const results = await chrome.history.search({ text, maxResults, startTime: 0 });
  return results
    .filter((h) => h.url)
    .map((h): SearchItem => ({ kind: "history", key: `hist:${h.id}`, title: h.title || h.url!, url: h.url!, subtitle: "History" }));
}

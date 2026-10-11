import type { Card, Collection } from "./types";

// Each collection lives under its own key. A save writes one key and a delete
// removes one key, so writers in different extension contexts (service worker,
// popup, new tab) can never overwrite each other's changes.
const PREFIX = "collection:";
const keyOf = (id: string) => PREFIX + id;

export async function listCollections(): Promise<Collection[]> {
  const all = await chrome.storage.local.get(null);
  return Object.entries(all)
    .filter(([key]) => key.startsWith(PREFIX))
    .map(([, value]) => value as Collection)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function deleteCollection(id: string): Promise<void> {
  return chrome.storage.local.remove(keyOf(id));
}

export function onCollectionsChange(cb: () => void): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === "local" && Object.keys(changes).some((k) => k.startsWith(PREFIX))) cb();
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

export function openCollection(collection: Collection): Promise<chrome.tabs.Tab[]> {
  return Promise.all(collection.cards.map((c) => chrome.tabs.create({ url: c.url, active: false })));
}

function tabToCard(tab: chrome.tabs.Tab): Card | null {
  if (!tab.url || !/^https?:\/\//.test(tab.url)) return null;
  return { id: crypto.randomUUID(), url: tab.url, title: tab.title || tab.url, favIconUrl: tab.favIconUrl };
}

/** Save the given tabs as a new collection. Returns it, or null if nothing was savable. */
export async function saveTabsAsCollection(
  tabs: chrome.tabs.Tab[],
  title = `Session ${new Date().toLocaleString()}`,
): Promise<Collection | null> {
  const cards = tabs.map(tabToCard).filter((c): c is Card => c !== null);
  if (cards.length === 0) return null;
  const collection: Collection = { id: crypto.randomUUID(), title, createdAt: Date.now(), cards };
  await chrome.storage.local.set({ [keyOf(collection.id)]: collection });
  return collection;
}

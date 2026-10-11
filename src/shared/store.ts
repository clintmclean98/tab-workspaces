import { moveItem } from "./array";
import { tabToCard } from "./cards";
import type { Card, Collection, GoLink, Workspace } from "./types";

// Every record lives under its own key ("collection:<id>", "workspace:<id>"). A
// save writes one key and a delete removes one key, so writers in different
// extension contexts (service worker, popup, new tab) never overwrite each other.
const COLLECTION = "collection:";
const WORKSPACE = "workspace:";

async function listByPrefix<T>(prefix: string): Promise<T[]> {
  const all = await chrome.storage.local.get(null);
  return Object.entries(all)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, value]) => value as T);
}

async function getRecord<T>(key: string): Promise<T | undefined> {
  return (await chrome.storage.local.get(key))[key] as T | undefined;
}

/** Read-modify-write a single record. Only that record's key is touched. */
async function updateRecord<T>(key: string, mutate: (record: T) => void): Promise<void> {
  const record = await getRecord<T>(key);
  if (!record) return;
  mutate(record);
  await chrome.storage.local.set({ [key]: record });
}

function onPrefixChange(prefix: string, cb: () => void): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === "local" && Object.keys(changes).some((k) => k.startsWith(prefix))) cb();
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

// ---- collections ----

const collectionKey = (id: string) => COLLECTION + id;

export async function listCollections(): Promise<Collection[]> {
  return (await listByPrefix<Collection>(COLLECTION)).sort((a, b) => b.createdAt - a.createdAt);
}

export const onCollectionsChange = (cb: () => void) => onPrefixChange(COLLECTION, cb);

export const deleteCollection = (id: string) => chrome.storage.local.remove(collectionKey(id));

export function openCollection(collection: Collection): Promise<chrome.tabs.Tab[]> {
  return Promise.all(collection.cards.map((c) => chrome.tabs.create({ url: c.url, active: false })));
}

export const renameCollection = (id: string, title: string) =>
  updateRecord<Collection>(collectionKey(id), (c) => void (c.title = title.trim() || c.title));

export const deleteCard = (collectionId: string, cardId: string) =>
  updateRecord<Collection>(collectionKey(collectionId), (c) => void (c.cards = c.cards.filter((k) => k.id !== cardId)));

export const setCardNote = (collectionId: string, cardId: string, note: string) =>
  updateRecord<Collection>(collectionKey(collectionId), (c) => {
    const card = c.cards.find((k) => k.id === cardId);
    if (card) card.note = note.trim() || undefined;
  });

/** Move a card to the position currently held by another card in the same collection. */
export const moveCard = (collectionId: string, cardId: string, beforeCardId: string) =>
  updateRecord<Collection>(collectionKey(collectionId), (c) => {
    const from = c.cards.findIndex((k) => k.id === cardId);
    const to = c.cards.findIndex((k) => k.id === beforeCardId);
    if (from >= 0 && to >= 0) c.cards = moveItem(c.cards, from, to);
  });

/** Save the given tabs as a new collection. Returns it, or null if nothing was savable. */
export async function saveTabsAsCollection(
  tabs: chrome.tabs.Tab[],
  title = `Session ${new Date().toLocaleString()}`,
): Promise<Collection | null> {
  const cards = tabs.map(tabToCard).filter((c): c is Card => c !== null);
  if (cards.length === 0) return null;
  const collection: Collection = { id: crypto.randomUUID(), title, createdAt: Date.now(), cards };
  await chrome.storage.local.set({ [collectionKey(collection.id)]: collection });
  return collection;
}

// ---- workspaces ----

const workspaceKey = (id: string) => WORKSPACE + id;

export async function listWorkspaces(): Promise<Workspace[]> {
  return (await listByPrefix<Workspace>(WORKSPACE)).sort((a, b) => a.createdAt - b.createdAt);
}

export const onWorkspacesChange = (cb: () => void) => onPrefixChange(WORKSPACE, cb);

export const getWorkspace = (id: string) => getRecord<Workspace>(workspaceKey(id));

export async function createWorkspace(name: string, cards: Card[]): Promise<Workspace> {
  const workspace: Workspace = { id: crypto.randomUUID(), name: name.trim() || "Untitled", createdAt: Date.now(), cards };
  await chrome.storage.local.set({ [workspaceKey(workspace.id)]: workspace });
  return workspace;
}

export const renameWorkspace = (id: string, name: string) =>
  updateRecord<Workspace>(workspaceKey(id), (w) => void (w.name = name.trim() || w.name));

export const setWorkspaceCards = (id: string, cards: Card[]) =>
  updateRecord<Workspace>(workspaceKey(id), (w) => void (w.cards = cards));

export const deleteWorkspace = (id: string) => chrome.storage.local.remove(workspaceKey(id));

// ---- go-links ----

const GOLINK = "golink:";

export async function listGoLinks(): Promise<GoLink[]> {
  return (await listByPrefix<GoLink>(GOLINK)).sort((a, b) => a.name.localeCompare(b.name));
}

export const onGoLinksChange = (cb: () => void) => onPrefixChange(GOLINK, cb);

/** Create a go-link, or overwrite the one with the same name. */
export const saveGoLink = (link: GoLink) => chrome.storage.local.set({ [GOLINK + link.name]: link });

export const deleteGoLink = (name: string) => chrome.storage.local.remove(GOLINK + name);

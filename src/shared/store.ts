import type { Card, Collection, State } from "./types";

const KEY = "state";
const empty = (): State => ({ version: 1, collections: [], workspaces: [] });

export const uid = () => crypto.randomUUID();

export async function getState(): Promise<State> {
  const data = await chrome.storage.local.get(KEY);
  return (data[KEY] as State | undefined) ?? empty();
}

export async function setState(state: State): Promise<void> {
  await chrome.storage.local.set({ [KEY]: state });
}

/** Serialise read-modify-write so concurrent callers don't lose updates. */
let queue: Promise<unknown> = Promise.resolve();
export function update(fn: (s: State) => void): Promise<State> {
  const run = queue.then(async () => {
    const s = await getState();
    fn(s);
    await setState(s);
    return s;
  });
  queue = run.catch(() => undefined);
  return run;
}

export function onStateChange(cb: (s: State) => void): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === "local" && changes[KEY]) cb(changes[KEY].newValue as State);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

const isSavable = (url?: string) => !!url && /^https?:\/\//.test(url);

export function tabToCard(tab: chrome.tabs.Tab): Card | null {
  if (!isSavable(tab.url)) return null;
  return { id: uid(), url: tab.url!, title: tab.title || tab.url!, favIconUrl: tab.favIconUrl };
}

/** Save the given tabs as a new collection. Returns it, or null if nothing was savable. */
export async function saveTabsAsCollection(
  tabs: chrome.tabs.Tab[],
  title?: string,
): Promise<Collection | null> {
  const cards = tabs.map(tabToCard).filter((c): c is Card => c !== null);
  if (cards.length === 0) return null;
  const collection: Collection = {
    id: uid(),
    title: title ?? `Session ${new Date().toLocaleString()}`,
    createdAt: Date.now(),
    cards,
  };
  await update((s) => void s.collections.unshift(collection));
  return collection;
}

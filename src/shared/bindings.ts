// Which workspace each window is showing. Window ids are only valid for the
// current browser session, so this lives in storage.session (cleared on
// restart), one key per window. Only the service worker writes it.
const PREFIX = "binding:";
const keyOf = (windowId: number) => PREFIX + windowId;

export async function getBinding(windowId: number): Promise<string | undefined> {
  return (await chrome.storage.session.get(keyOf(windowId)))[keyOf(windowId)] as string | undefined;
}

export const setBinding = (windowId: number, workspaceId: string) =>
  chrome.storage.session.set({ [keyOf(windowId)]: workspaceId });

export const clearBinding = (windowId: number) => chrome.storage.session.remove(keyOf(windowId));

/** windowId -> workspaceId for every bound window. */
export async function listBindings(): Promise<Map<number, string>> {
  const all = await chrome.storage.session.get(null);
  return new Map(
    Object.entries(all)
      .filter(([key]) => key.startsWith(PREFIX))
      .map(([key, id]) => [Number(key.slice(PREFIX.length)), id as string]),
  );
}

export function onBindingsChange(cb: () => void): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === "session" && Object.keys(changes).some((k) => k.startsWith(PREFIX))) cb();
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

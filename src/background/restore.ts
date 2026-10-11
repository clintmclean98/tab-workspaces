import { listBindings, setBinding } from "../shared/bindings";
import { savableUrl } from "../shared/cards";
import { matchWindowsToWorkspaces } from "../shared/matchWindows";
import { listWorkspaces } from "../shared/store";
import { windowSession } from "./session";

// Window ids and storage.session both reset when the browser restarts or the
// extension updates, so a window that came back from a restart no longer knows
// which workspace it was showing. We recover that by matching its tabs to the
// workspaces' saved tabs.
const RESTORE_WATCH_MS = 30_000;
const SETTLE_MS = 1_500;
const WATCH_KEY = "restoreWatchUntil";

/** Bind each unbound window to the unbound workspace whose saved tabs it matches. Returns how many were bound. */
export async function rebindWindows(): Promise<number> {
  const [windows, workspaces, bindings] = await Promise.all([
    chrome.windows.getAll({ windowTypes: ["normal"] }),
    listWorkspaces(),
    listBindings(),
  ]);
  const shown = new Set(bindings.values());

  const windowSets = await Promise.all(
    windows
      .filter((w) => w.id !== undefined && !bindings.has(w.id))
      .map(async (w) => ({
        id: String(w.id),
        urls: (await windowSession(w.id!)).session.flatMap((t) => savableUrl(t) ?? []),
      })),
  );
  const workspaceSets = workspaces.filter((w) => !shown.has(w.id)).map((w) => ({ id: w.id, urls: w.cards.map((c) => c.url) }));

  const matches = matchWindowsToWorkspaces(windowSets, workspaceSets);
  await Promise.all([...matches].map(([windowId, workspaceId]) => setBinding(Number(windowId), workspaceId)));
  return matches.size;
}

let timer: ReturnType<typeof setTimeout> | undefined;

/** Windows restored at startup arrive one by one; wait for them to settle, then rebind. */
export function scheduleRebind() {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    const until = (await chrome.storage.session.get(WATCH_KEY))[WATCH_KEY] as number | undefined;
    if (until && Date.now() < until) await rebindWindows().catch(console.error);
  }, SETTLE_MS);
}

/**
 * Start of a browser session: for a short while, windows that appear are treated as
 * possible restores. Outside this period a new window is never bound automatically,
 * so opening a window with a few matching tabs can't attach it to a workspace.
 */
export async function beginRestoreWatch() {
  await chrome.storage.session.set({ [WATCH_KEY]: Date.now() + RESTORE_WATCH_MS });
  scheduleRebind();
}

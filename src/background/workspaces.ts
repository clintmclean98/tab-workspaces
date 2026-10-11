import { clearBinding, getBinding, setBinding } from "../shared/bindings";
import { reconcileCards } from "../shared/cards";
import { createWorkspace, getWorkspace, saveTabsAsCollection, setWorkspaceCards } from "../shared/store";
import { windowSession } from "./session";

const SYNC_DELAY_MS = 500;
const timers = new Map<number, ReturnType<typeof setTimeout>>();
/** Windows mid-switch: their tabs are in flux, so syncing would save a half-built state. */
const switching = new Set<number>();

/** Write a window's live tabs into its bound workspace. Drops a binding whose workspace is gone. */
async function syncNow(windowId: number): Promise<void> {
  const workspaceId = await getBinding(windowId);
  if (!workspaceId) return;
  const workspace = await getWorkspace(workspaceId);
  if (!workspace) return void (await clearBinding(windowId));
  const { session } = await windowSession(windowId);
  const cards = reconcileCards(workspace.cards, session);
  if (JSON.stringify(cards) !== JSON.stringify(workspace.cards)) await setWorkspaceCards(workspaceId, cards);
}

/** Debounced sync, called from tab events. */
export function scheduleSync(windowId: number) {
  if (switching.has(windowId)) return;
  clearTimeout(timers.get(windowId));
  timers.set(
    windowId,
    setTimeout(() => {
      timers.delete(windowId);
      void syncNow(windowId).catch(console.error);
    }, SYNC_DELAY_MS),
  );
}

/** Run any pending sync for the window right now. */
async function flush(windowId: number) {
  if (!timers.has(windowId)) return;
  clearTimeout(timers.get(windowId));
  timers.delete(windowId);
  await syncNow(windowId);
}

/** A closed window keeps its workspace as last synced; only the binding goes. */
export function onWindowRemoved(windowId: number) {
  clearTimeout(timers.get(windowId));
  timers.delete(windowId);
  return clearBinding(windowId);
}

export async function createWorkspaceFor(windowId: number, name: string, fromWindow: boolean) {
  await flush(windowId);
  const { session } = await windowSession(windowId);
  const workspace = await createWorkspace(name, fromWindow ? reconcileCards([], session) : []);
  if (fromWindow) await setBinding(windowId, workspace.id);
  return workspace;
}

/**
 * Show a workspace in a window: open its tabs, then close the window's current
 * session. Nothing is lost on the way: a bound window's tabs are synced to its
 * workspace first, and an unbound window's tabs are saved as a collection.
 */
export async function switchWorkspace(windowId: number, workspaceId: string) {
  const target = await getWorkspace(workspaceId);
  if (!target) throw new Error("Workspace not found");
  if ((await getBinding(windowId)) === workspaceId) return;

  switching.add(windowId);
  try {
    await flush(windowId);
    const boundId = await getBinding(windowId);
    const { session, survivors } = await windowSession(windowId);
    if (boundId && (await getWorkspace(boundId))) {
      await syncNow(windowId);
    } else {
      await saveTabsAsCollection(session, `Unsaved tabs ${new Date().toLocaleString()}`);
    }

    // Open first and close after, so the window is never empty.
    let first = true;
    for (const card of target.cards) {
      await chrome.tabs.create({ windowId, url: card.url, active: first });
      first = false;
    }
    if (target.cards.length === 0 && survivors === 0) await chrome.tabs.create({ windowId });
    await chrome.tabs.remove(session.map((t) => t.id!));
    await setBinding(windowId, workspaceId);
  } finally {
    switching.delete(windowId);
  }
}

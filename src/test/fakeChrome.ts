import { vi } from "vitest";

export interface FakeTab {
  id: number;
  windowId: number;
  url: string;
  title: string;
  pinned: boolean;
}

/** A minimal in-memory chrome: just the APIs the background logic touches. */
export function installChrome() {
  const local = new Map<string, unknown>();
  const session = new Map<string, unknown>();
  const tabs: FakeTab[] = [];
  let nextId = 1;
  const area = (m: Map<string, unknown>) => ({
    get: async (key: string | null) => (key === null ? Object.fromEntries(m) : m.has(key) ? { [key]: m.get(key) } : {}),
    set: async (items: Record<string, unknown>) => void Object.entries(items).forEach(([k, v]) => m.set(k, structuredClone(v))),
    remove: async (key: string) => void m.delete(key),
  });
  vi.stubGlobal("chrome", {
    runtime: { getURL: (p: string) => `chrome-extension://abc/${p}` },
    storage: { local: area(local), session: area(session) },
    windows: {
      getAll: async () => [...new Set(tabs.map((t) => t.windowId))].map((id) => ({ id, type: "normal" })),
    },
    tabs: {
      query: async ({ windowId }: { windowId: number }) => tabs.filter((t) => t.windowId === windowId),
      create: async ({ windowId, url }: { windowId: number; url?: string }) => {
        const t = { id: nextId++, windowId, url: url ?? "chrome://newtab", title: url ?? "New tab", pinned: false };
        tabs.push(t);
        return t;
      },
      remove: async (ids: number[]) => void tabs.splice(0, tabs.length, ...tabs.filter((t) => !ids.includes(t.id))),
    },
  });
  const open = (windowId: number, url: string, pinned = false) => void tabs.push({ id: nextId++, windowId, url, title: url, pinned });
  return { local, session, tabs, open, urls: (w: number) => tabs.filter((t) => t.windowId === w).map((t) => t.url) };
}

import { beforeEach, describe, expect, it, vi } from "vitest";

// A minimal in-memory chrome: just the APIs the workspace logic touches.
interface FakeTab { id: number; windowId: number; url: string; title: string; pinned: boolean }

function installChrome() {
  const local = new Map<string, unknown>();
  const session = new Map<string, unknown>();
  const tabs: FakeTab[] = [];
  let nextId = 1;
  const area = (m: Map<string, unknown>) => ({
    get: async (key: string | null) =>
      key === null ? Object.fromEntries(m) : m.has(key) ? { [key]: m.get(key) } : {},
    set: async (items: Record<string, unknown>) => void Object.entries(items).forEach(([k, v]) => m.set(k, structuredClone(v))),
    remove: async (key: string) => void m.delete(key),
  });
  vi.stubGlobal("chrome", {
    runtime: { getURL: (p: string) => `chrome-extension://abc/${p}` },
    storage: { local: area(local), session: area(session) },
    tabs: {
      query: async ({ windowId }: { windowId: number }) => tabs.filter((t) => t.windowId === windowId),
      create: async ({ windowId, url }: { windowId: number; url?: string }) => {
        const t = { id: nextId++, windowId, url: url ?? "chrome://newtab", title: url ?? "New tab", pinned: false };
        tabs.push(t);
        return t;
      },
      remove: async (ids: number[]) => void (tabs.splice(0, tabs.length, ...tabs.filter((t) => !ids.includes(t.id)))),
    },
  });
  const open = (windowId: number, url: string, pinned = false) =>
    void tabs.push({ id: nextId++, windowId, url, title: url, pinned });
  return { local, session, tabs, open, urls: (w: number) => tabs.filter((t) => t.windowId === w).map((t) => t.url) };
}

describe("workspace switching", () => {
  let fake: ReturnType<typeof installChrome>;
  let ws: typeof import("./workspaces");
  let store: typeof import("../shared/store");
  let bindings: typeof import("../shared/bindings");

  beforeEach(async () => {
    vi.resetModules();
    fake = installChrome();
    ws = await import("./workspaces");
    store = await import("../shared/store");
    bindings = await import("../shared/bindings");
  });

  it("saves an unbound window's tabs as a collection before replacing them", async () => {
    fake.open(1, "https://old.com");
    const target = await store.createWorkspace("Target", [{ id: "c", url: "https://new.com", title: "new" }]);
    await ws.switchWorkspace(1, target.id);

    expect(fake.urls(1)).toEqual(["https://new.com"]);
    const [saved] = await store.listCollections();
    expect(saved.cards.map((c) => c.url)).toEqual(["https://old.com"]);
    expect(await bindings.getBinding(1)).toBe(target.id);
  });

  it("syncs a bound window into its workspace before switching away", async () => {
    fake.open(1, "https://a.com");
    const a = await ws.createWorkspaceFor(1, "A", true);
    fake.open(1, "https://added-later.com"); // not yet synced
    const b = await store.createWorkspace("B", []);
    await ws.switchWorkspace(1, b.id);

    expect((await store.getWorkspace(a.id))!.cards.map((c) => c.url)).toEqual(["https://a.com", "https://added-later.com"]);
    expect(await store.listCollections()).toEqual([]); // nothing needed rescuing
  });

  it("round-trips: switching back restores the saved tabs", async () => {
    fake.open(1, "https://a.com");
    const a = await ws.createWorkspaceFor(1, "A", true);
    const b = await store.createWorkspace("B", [{ id: "x", url: "https://b.com", title: "b" }]);
    await ws.switchWorkspace(1, b.id);
    await ws.switchWorkspace(1, a.id);
    expect(fake.urls(1)).toEqual(["https://a.com"]);
  });

  it("keeps pinned tabs and never leaves the window empty for an empty workspace", async () => {
    fake.open(1, "https://pinned.com", true);
    fake.open(1, "https://old.com");
    const empty = await store.createWorkspace("Empty", []);
    await ws.switchWorkspace(1, empty.id);
    expect(fake.urls(1)).toEqual(["https://pinned.com"]);

    const lone = installChrome(); // window with no pinned tabs
    vi.resetModules();
    ws = await import("./workspaces");
    store = await import("../shared/store");
    lone.open(2, "https://old.com");
    const e2 = await store.createWorkspace("Empty", []);
    await ws.switchWorkspace(2, e2.id);
    expect(lone.urls(2)).toEqual(["chrome://newtab"]);
  });

  it("is a no-op when the window already shows the workspace", async () => {
    fake.open(1, "https://a.com");
    const a = await ws.createWorkspaceFor(1, "A", true);
    await ws.switchWorkspace(1, a.id);
    expect(fake.urls(1)).toEqual(["https://a.com"]);
  });

  it("rejects an unknown workspace without touching the window", async () => {
    fake.open(1, "https://a.com");
    await expect(ws.switchWorkspace(1, "nope")).rejects.toThrow("Workspace not found");
    expect(fake.urls(1)).toEqual(["https://a.com"]);
  });

  it("debounced sync mirrors tab changes into the bound workspace", async () => {
    vi.useFakeTimers();
    fake.open(1, "https://a.com");
    const a = await ws.createWorkspaceFor(1, "A", true);
    fake.open(1, "https://b.com");
    ws.scheduleSync(1);
    await vi.advanceTimersByTimeAsync(600);
    vi.useRealTimers();
    expect((await store.getWorkspace(a.id))!.cards.map((c) => c.url)).toEqual(["https://a.com", "https://b.com"]);
  });
});

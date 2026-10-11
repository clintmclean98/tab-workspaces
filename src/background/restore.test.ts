import { beforeEach, describe, expect, it, vi } from "vitest";
import { installChrome } from "../test/fakeChrome";

describe("rebinding windows after a restart", () => {
  let fake: ReturnType<typeof installChrome>;
  let restore: typeof import("./restore");
  let store: typeof import("../shared/store");
  let bindings: typeof import("../shared/bindings");

  const card = (url: string) => ({ id: url, url, title: url });

  beforeEach(async () => {
    vi.resetModules();
    fake = installChrome();
    restore = await import("./restore");
    store = await import("../shared/store");
    bindings = await import("../shared/bindings");
  });

  it("binds each restored window to the workspace its tabs came from", async () => {
    const work = await store.createWorkspace("Work", [card("https://a.com"), card("https://b.com")]);
    const trip = await store.createWorkspace("Trip", [card("https://x.com"), card("https://y.com")]);
    fake.open(11, "https://x.com");
    fake.open(11, "https://y.com");
    fake.open(12, "https://a.com");
    fake.open(12, "https://b.com");

    expect(await restore.rebindWindows()).toBe(2);
    expect(await bindings.getBinding(11)).toBe(trip.id);
    expect(await bindings.getBinding(12)).toBe(work.id);
  });

  it("leaves windows that match nothing unbound, and skips ones already bound", async () => {
    const work = await store.createWorkspace("Work", [card("https://a.com"), card("https://b.com")]);
    fake.open(11, "https://elsewhere.com");
    fake.open(12, "https://a.com");
    fake.open(12, "https://b.com");
    await bindings.setBinding(12, "someone-else"); // already showing something

    expect(await restore.rebindWindows()).toBe(0);
    expect(await bindings.getBinding(11)).toBeUndefined();
    expect(await bindings.getBinding(12)).toBe("someone-else");
    expect(work.id).toBeDefined();
  });

  it("does not bind a second window to a workspace that is already showing", async () => {
    const work = await store.createWorkspace("Work", [card("https://a.com"), card("https://b.com")]);
    await bindings.setBinding(5, work.id);
    fake.open(12, "https://a.com");
    fake.open(12, "https://b.com");
    expect(await restore.rebindWindows()).toBe(0);
  });

  it("ignores pinned tabs and non-web tabs when matching", async () => {
    const work = await store.createWorkspace("Work", [card("https://a.com"), card("https://b.com")]);
    fake.open(11, "https://a.com");
    fake.open(11, "https://b.com");
    fake.open(11, "https://pinned.com", true);
    fake.open(11, "chrome://extensions");
    await restore.rebindWindows();
    expect(await bindings.getBinding(11)).toBe(work.id);
  });

  describe("startup watch", () => {
    beforeEach(() => vi.useFakeTimers());

    it("rebinds windows that appear shortly after startup", async () => {
      const work = await store.createWorkspace("Work", [card("https://a.com"), card("https://b.com")]);
      await restore.beginRestoreWatch();
      fake.open(11, "https://a.com");
      fake.open(11, "https://b.com");
      restore.scheduleRebind(); // as windows.onCreated would
      await vi.advanceTimersByTimeAsync(2_000);
      expect(await bindings.getBinding(11)).toBe(work.id);
    });

    it("never auto-binds a new window outside the startup period", async () => {
      await store.createWorkspace("Work", [card("https://a.com"), card("https://b.com")]);
      fake.open(11, "https://a.com");
      fake.open(11, "https://b.com");
      restore.scheduleRebind(); // no beginRestoreWatch: an ordinary mid-session window
      await vi.advanceTimersByTimeAsync(2_000);
      expect(await bindings.getBinding(11)).toBeUndefined();
    });

    it("stops watching once the startup period has passed", async () => {
      const work = await store.createWorkspace("Work", [card("https://a.com"), card("https://b.com")]);
      await restore.beginRestoreWatch();
      await vi.advanceTimersByTimeAsync(31_000);
      fake.open(11, "https://a.com");
      fake.open(11, "https://b.com");
      restore.scheduleRebind();
      await vi.advanceTimersByTimeAsync(2_000);
      expect(await bindings.getBinding(11)).toBeUndefined();
      expect(work.id).toBeDefined();
    });
  });
});

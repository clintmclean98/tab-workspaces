import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SearchItem } from "../shared/universalSearch";
import { activate } from "./activate";

const calls: string[] = [];
let sendResult: unknown = { ok: true };

beforeEach(() => {
  calls.length = 0;
  sendResult = { ok: true };
  vi.stubGlobal("chrome", {
    tabs: {
      update: async (id: number) => void calls.push(`tabs.update ${id}`),
      create: async (p: { windowId: number; url: string }) => void calls.push(`tabs.create ${p.windowId} ${p.url}`),
    },
    windows: { update: async (id: number) => void calls.push(`windows.focus ${id}`) },
    runtime: {
      sendMessage: async (m: { type: string; windowId: number; workspaceId: string }) => {
        calls.push(`send ${m.type} ${m.windowId} ${m.workspaceId}`);
        return sendResult;
      },
    },
  });
});

const ORIGIN = 7;

describe("activate", () => {
  it("focuses an open tab in its own window", async () => {
    const item: SearchItem = { kind: "tab", key: "k", title: "t", url: "https://a", tabId: 3, windowId: 9 };
    expect(await activate(item, ORIGIN)).toBeNull();
    expect(calls).toEqual(["tabs.update 3", "windows.focus 9"]);
  });
  it.each(["card", "history", "golink"] as const)("opens a %s in the originating window", async (kind) => {
    const item = { kind, key: "k", title: "t", url: "https://a" } as SearchItem;
    expect(await activate(item, ORIGIN)).toBeNull();
    expect(calls).toEqual([`tabs.create ${ORIGIN} https://a`, `windows.focus ${ORIGIN}`]);
  });
  it("switches the originating window to a workspace", async () => {
    const item: SearchItem = { kind: "workspace", key: "k", title: "W", workspaceId: "w1" };
    expect(await activate(item, ORIGIN)).toBeNull();
    expect(calls).toEqual([`send switch-workspace ${ORIGIN} w1`, `windows.focus ${ORIGIN}`]);
  });
  it("reports a failed switch and does not refocus", async () => {
    sendResult = { ok: false, error: "Workspace not found" };
    const item: SearchItem = { kind: "workspace", key: "k", title: "W", workspaceId: "gone" };
    expect(await activate(item, ORIGIN)).toBe("Workspace not found");
    expect(calls).toEqual([`send switch-workspace ${ORIGIN} gone`]);
  });
});

import { describe, expect, it } from "vitest";
import { reconcileCards } from "./cards";
import type { Card } from "./types";

const tab = (url: string, title = url) => ({ url, title }) as chrome.tabs.Tab;
const card = (id: string, url: string, note?: string): Card => ({ id, url, title: url, note });

describe("reconcileCards", () => {
  it("follows tab order and skips non-web tabs", () => {
    const r = reconcileCards([], [tab("https://b.com"), tab("chrome://extensions"), tab("https://a.com")]);
    expect(r.map((c) => c.url)).toEqual(["https://b.com", "https://a.com"]);
  });
  it("keeps id and note for tabs whose URL was already saved", () => {
    const r = reconcileCards([card("1", "https://a.com", "keep me")], [tab("https://a.com", "New title")]);
    expect(r[0]).toMatchObject({ id: "1", note: "keep me", title: "New title" });
  });
  it("reuses each previous card once when a URL is open twice", () => {
    const r = reconcileCards([card("1", "https://a.com", "n")], [tab("https://a.com"), tab("https://a.com")]);
    expect(r[0].id).toBe("1");
    expect(r[1].id).not.toBe("1");
    expect(r[1].note).toBeUndefined();
  });
  it("drops cards whose tabs are gone", () => {
    expect(reconcileCards([card("1", "https://a.com")], [])).toEqual([]);
  });
});

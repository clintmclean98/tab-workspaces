import { describe, expect, it } from "vitest";
import { dedupeByUrl, rankItems, scoreItem, type SearchItem } from "./universalSearch";

const tab = (title: string, url: string): SearchItem => ({ kind: "tab", key: `t:${url}`, title, url, tabId: 1, windowId: 1 });
const card = (title: string, url: string, subtitle?: string): SearchItem => ({ kind: "card", key: `c:${url}${title}`, title, url, subtitle });
const hist = (title: string, url: string): SearchItem => ({ kind: "history", key: `h:${url}`, title, url });
const golink = (name: string, url: string): SearchItem => ({ kind: "golink", key: `g:${name}`, title: name, url });
const space = (name: string): SearchItem => ({ kind: "workspace", key: `w:${name}`, title: name, workspaceId: name });

describe("scoreItem", () => {
  it("requires every token to match", () => {
    expect(scoreItem(tab("Jira board", "https://x.com"), "jira board")).not.toBeNull();
    expect(scoreItem(tab("Jira board", "https://x.com"), "jira nope")).toBeNull();
  });
  it("ranks prefix over word-start over mid-word over url-only", () => {
    const q = "doc";
    const prefix = scoreItem(card("Docs home", "https://a.com"), q)!;
    const wordStart = scoreItem(card("Team docs", "https://a.com"), q)!;
    const midWord = scoreItem(card("Undocumented", "https://a.com"), q)!;
    const urlOnly = scoreItem(card("Home", "https://docs.a.com"), q)!;
    expect(prefix).toBeGreaterThan(wordStart);
    expect(wordStart).toBeGreaterThan(midWord);
    expect(midWord).toBeGreaterThan(urlOnly);
  });
  it("matches against the subtitle (e.g. the collection name)", () => {
    expect(scoreItem(card("Pasta", "https://a.com", "In collection Recipes"), "recipes")).not.toBeNull();
  });
  it("matches against the user's note", () => {
    expect(scoreItem({ ...card("Pasta", "https://a.com"), note: "good for winter" }, "winter")).not.toBeNull();
  });
});

describe("rankItems", () => {
  it("prefers open tabs over cards over history on equal matches", () => {
    const r = rankItems([hist("Jira", "https://h"), card("Jira", "https://c"), tab("Jira", "https://t")], "jira");
    expect(r.map((i) => i.kind)).toEqual(["tab", "card", "history"]);
  });
  it("lets a much better title match beat a better kind", () => {
    const r = rankItems([tab("Weekly notes", "https://t/doc"), card("Docs", "https://c")], "doc");
    expect(r[0].kind).toBe("card");
  });
  it("keeps the original order for ties", () => {
    const r = rankItems([card("Alpha", "https://1"), card("Alpha", "https://2")], "alpha");
    expect(r.map((i) => i.url)).toEqual(["https://1", "https://2"]);
  });
  it("shows what is open, workspaces and go-links first for an empty query", () => {
    const r = rankItems([hist("h", "https://h"), card("c", "https://c"), space("S"), tab("t", "https://t"), golink("g", "https://g")], "");
    expect(r.map((i) => i.kind)).toEqual(["tab", "workspace", "golink", "card", "history"]);
  });
  it("applies the limit", () => {
    const items = Array.from({ length: 10 }, (_, i) => card(`a${i}`, `https://${i}`));
    expect(rankItems(items, "a", 3)).toHaveLength(3);
  });
});

describe("dedupeByUrl", () => {
  it("keeps the first (best) page per URL", () => {
    const r = dedupeByUrl([tab("A", "https://x"), card("A", "https://x"), hist("A", "https://x")]);
    expect(r.map((i) => i.kind)).toEqual(["tab"]);
  });
  it("never drops workspaces or go-links", () => {
    const r = dedupeByUrl([tab("A", "https://x"), golink("a", "https://x"), space("A")]);
    expect(r.map((i) => i.kind)).toEqual(["tab", "golink", "workspace"]);
  });
});

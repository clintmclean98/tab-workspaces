import { describe, expect, it } from "vitest";
import { filterCollections } from "./search";
import type { Collection } from "./types";

const col = (id: string, title: string, cards: [string, string, string?][]): Collection => ({
  id,
  title,
  createdAt: 0,
  cards: cards.map(([t, url, note], i) => ({ id: `${id}${i}`, title: t, url, note })),
});

const data = [
  col("a", "Recipes", [["Pasta", "https://x.com/pasta"], ["Soup", "https://y.com/soup", "winter"]]),
  col("b", "Work", [["Jira", "https://jira.example.com"], ["Docs", "https://docs.example.com"]]),
];

describe("filterCollections", () => {
  it("returns everything for a blank query", () => {
    expect(filterCollections(data, "  ")).toBe(data);
  });
  it("keeps a whole collection when its title matches", () => {
    const r = filterCollections(data, "recipe");
    expect(r).toHaveLength(1);
    expect(r[0].cards).toHaveLength(2);
  });
  it("keeps only matching cards otherwise, matching title, url and note", () => {
    expect(filterCollections(data, "pasta")[0].cards.map((c) => c.title)).toEqual(["Pasta"]);
    expect(filterCollections(data, "jira.example")[0].cards.map((c) => c.title)).toEqual(["Jira"]);
    expect(filterCollections(data, "winter")[0].cards.map((c) => c.title)).toEqual(["Soup"]);
  });
  it("drops collections with no match", () => {
    expect(filterCollections(data, "zzz")).toEqual([]);
  });
});

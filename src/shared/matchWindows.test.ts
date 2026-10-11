import { describe, expect, it } from "vitest";
import { jaccard, matchWindowsToWorkspaces } from "./matchWindows";

const set = (id: string, ...urls: string[]) => ({ id, urls });

describe("jaccard", () => {
  it("is 1 for identical sets and 0 for disjoint or empty ones", () => {
    expect(jaccard(["a", "b"], ["b", "a"])).toBe(1);
    expect(jaccard(["a"], ["b"])).toBe(0);
    expect(jaccard([], ["a"])).toBe(0);
  });
  it("counts shared over combined, ignoring duplicates", () => {
    expect(jaccard(["a", "b", "c", "d"], ["a", "b", "c"])).toBe(0.75);
    expect(jaccard(["a", "a", "b"], ["a", "b"])).toBe(1);
  });
});

describe("matchWindowsToWorkspaces", () => {
  it("pairs a window with the workspace it came from", () => {
    const m = matchWindowsToWorkspaces([set("w1", "a", "b", "c")], [set("s1", "a", "b", "c"), set("s2", "x", "y")]);
    expect([...m]).toEqual([["w1", "s1"]]);
  });
  it("tolerates a few tabs changing", () => {
    const m = matchWindowsToWorkspaces([set("w1", "a", "b", "c")], [set("s1", "a", "b", "c", "d")]);
    expect(m.get("w1")).toBe("s1"); // 3 of 4 shared = 0.75
  });
  it("leaves a window unmatched when overlap is too small", () => {
    const m = matchWindowsToWorkspaces([set("w1", "a", "x", "y", "z")], [set("s1", "a", "b", "c", "d")]);
    expect(m.size).toBe(0);
  });
  it("assigns each workspace to only one window, the closer one", () => {
    const m = matchWindowsToWorkspaces(
      [set("loose", "a", "b", "c", "n"), set("exact", "a", "b", "c")],
      [set("s1", "a", "b", "c")],
    );
    expect([...m]).toEqual([["exact", "s1"]]);
  });
  it("pairs several windows with several workspaces", () => {
    const m = matchWindowsToWorkspaces(
      [set("w1", "a", "b"), set("w2", "x", "y")],
      [set("s2", "x", "y"), set("s1", "a", "b")],
    );
    expect(Object.fromEntries(m)).toEqual({ w1: "s1", w2: "s2" });
  });
  it("ignores windows and workspaces with no URLs", () => {
    expect(matchWindowsToWorkspaces([set("w1")], [set("s1")]).size).toBe(0);
  });
});

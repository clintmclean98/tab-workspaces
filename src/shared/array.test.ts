import { describe, expect, it } from "vitest";
import { moveItem } from "./array";

describe("moveItem", () => {
  it("moves forward and backward without mutating", () => {
    const a = [1, 2, 3, 4];
    expect(moveItem(a, 0, 2)).toEqual([2, 3, 1, 4]);
    expect(moveItem(a, 3, 1)).toEqual([1, 4, 2, 3]);
    expect(a).toEqual([1, 2, 3, 4]);
  });
  it("ignores no-op and out-of-range moves", () => {
    expect(moveItem([1, 2, 3], 1, 1)).toEqual([1, 2, 3]);
    expect(moveItem([1, 2, 3], 5, 0)).toEqual([1, 2, 3]);
    expect(moveItem([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
  });
});

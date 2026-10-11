import { describe, expect, it } from "vitest";
import { displayUrl, siteInitial } from "./format";

describe("displayUrl", () => {
  it("drops the scheme, www and a trailing slash", () => {
    expect(displayUrl("https://www.example.com/")).toBe("example.com");
    expect(displayUrl("https://example.com/a/b/")).toBe("example.com/a/b");
  });
  it("keeps the query string", () => {
    expect(displayUrl("https://example.com/search?q=tabs")).toBe("example.com/search?q=tabs");
  });
  it("returns unparseable input unchanged", () => {
    expect(displayUrl("not a url")).toBe("not a url");
  });
});

describe("siteInitial", () => {
  it("uses the first letter of the host, skipping www", () => {
    expect(siteInitial("https://www.theperfectloaf.com/x")).toBe("T");
    expect(siteInitial("https://docs.stripe.com")).toBe("D");
  });
  it("falls back to a question mark", () => {
    expect(siteInitial("nope")).toBe("?");
  });
});

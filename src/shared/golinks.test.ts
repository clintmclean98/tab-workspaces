import { describe, expect, it } from "vitest";
import { matchGoLinks, parseGoLink, resolveGoLink } from "./golinks";

const links = [
  { name: "jira", url: "https://jira.example.com/" },
  { name: "jenkins", url: "https://ci.example.com/" },
  { name: "team/docs", url: "https://docs.example.com/" },
];

describe("parseGoLink", () => {
  it("normalizes the name and URL", () => {
    expect(parseGoLink("  Jira ", "https://jira.example.com")).toEqual({
      link: { name: "jira", url: "https://jira.example.com/" },
    });
  });
  it("rejects bad names", () => {
    expect(parseGoLink("has space", "https://a.com")).toHaveProperty("error");
    expect(parseGoLink("", "https://a.com")).toHaveProperty("error");
  });
  it("rejects non-http(s) and malformed URLs", () => {
    expect(parseGoLink("x", "javascript:alert(1)")).toHaveProperty("error");
    expect(parseGoLink("x", "file:///etc/passwd")).toHaveProperty("error");
    expect(parseGoLink("x", "not a url")).toHaveProperty("error");
  });
});

describe("resolveGoLink", () => {
  it("matches exactly, ignoring case and spacing", () => {
    expect(resolveGoLink(links, " JIRA ")?.url).toBe("https://jira.example.com/");
  });
  it("does not match partial names", () => {
    expect(resolveGoLink(links, "ji")).toBeUndefined();
  });
});

describe("matchGoLinks", () => {
  it("lists prefix matches before substring matches", () => {
    expect(matchGoLinks(links, "j").map((l) => l.name)).toEqual(["jira", "jenkins"]);
    expect(matchGoLinks(links, "docs").map((l) => l.name)).toEqual(["team/docs"]);
  });
  it("respects the limit", () => {
    expect(matchGoLinks(links, "", 2)).toHaveLength(2);
  });
});

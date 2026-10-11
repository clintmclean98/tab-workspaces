import type { GoLink } from "./types";

const NAME = /^[a-z0-9][a-z0-9._/-]*$/;

export const normalizeName = (name: string) => name.trim().toLowerCase();

/** Validate user input for a go-link. Returns the link to store, or an error message. */
export function parseGoLink(name: string, url: string): { link: GoLink } | { error: string } {
  const n = normalizeName(name);
  if (!NAME.test(n)) return { error: "Names use letters, numbers and . _ / - only." };
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return { error: "Enter a full URL, including https://" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return { error: "Only http and https links are allowed." };
  return { link: { name: n, url: parsed.href } };
}

/** The link whose name exactly matches the input, ignoring case and surrounding space. */
export function resolveGoLink(links: readonly GoLink[], input: string): GoLink | undefined {
  const n = normalizeName(input);
  return links.find((l) => l.name === n);
}

/** Links to suggest while typing: names that start with the input first, then names that contain it. */
export function matchGoLinks(links: readonly GoLink[], input: string, limit = 5): GoLink[] {
  const n = normalizeName(input);
  const starts = links.filter((l) => l.name.startsWith(n));
  const contains = links.filter((l) => !l.name.startsWith(n) && l.name.includes(n));
  return [...starts, ...contains].slice(0, limit);
}

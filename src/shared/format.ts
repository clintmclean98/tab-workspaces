/** A short, readable form of a URL: host without "www." plus the path, minus trailing slash. */
export function displayUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = (u.pathname + u.search).replace(/\/$/, "");
    return u.hostname.replace(/^www\./, "") + path;
  } catch {
    return url;
  }
}

/** One letter standing in for a site that has no favicon: the first letter of its host, uppercased. */
export function siteInitial(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").charAt(0).toUpperCase() || "?";
  } catch {
    return "?";
  }
}

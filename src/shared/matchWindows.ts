export interface UrlSet {
  id: string;
  urls: readonly string[];
}

/** Share of the combined URLs that both sets have: 1 means identical, 0 means nothing in common. */
export function jaccard(a: readonly string[], b: readonly string[]): number {
  const left = new Set(a);
  const right = new Set(b);
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const url of left) if (right.has(url)) shared++;
  return shared / (left.size + right.size - shared);
}

/**
 * Pair windows with the workspaces they most likely came from, by the URLs they
 * share. The best-scoring pairs are assigned first, each window and each
 * workspace is used at most once, and pairs below `threshold` are left unmatched.
 * Returns windowId -> workspaceId.
 */
export function matchWindowsToWorkspaces(
  windows: readonly UrlSet[],
  workspaces: readonly UrlSet[],
  threshold = 0.6,
): Map<string, string> {
  const pairs = windows
    .flatMap((w) => workspaces.map((s) => ({ window: w.id, workspace: s.id, score: jaccard(w.urls, s.urls) })))
    .filter((p) => p.score >= threshold)
    .sort((a, b) => b.score - a.score);

  const matched = new Map<string, string>();
  const taken = new Set<string>();
  for (const { window, workspace } of pairs) {
    if (matched.has(window) || taken.has(workspace)) continue;
    matched.set(window, workspace);
    taken.add(workspace);
  }
  return matched;
}

export interface BaseItem {
  /** Unique within a result set; used as the React key. */
  key: string;
  title: string;
  url?: string;
  subtitle?: string;
}

export type SearchItem = BaseItem &
  (
    | { kind: "tab"; tabId: number; windowId: number }
    | { kind: "card" }
    | { kind: "history" }
    | { kind: "golink" }
    | { kind: "workspace"; workspaceId: string }
  );

export type Kind = SearchItem["kind"];

/** Tie-breaker between kinds when a query matches equally well: what you have open wins. */
const KIND_BIAS: Record<Kind, number> = { tab: 30, workspace: 25, golink: 25, card: 10, history: 0 };

const isWordStart = (text: string, index: number) => index === 0 || !/[a-z0-9]/.test(text[index - 1]);

/** Score one token against an item, or null if the token matches nowhere. */
function scoreToken(item: BaseItem, token: string): number | null {
  const title = item.title.toLowerCase();
  const at = title.indexOf(token);
  if (at === 0) return 100;
  if (at > 0) {
    // Look for a word-start occurrence, which beats a mid-word one.
    for (let i = at; i >= 0; i = title.indexOf(token, i + 1)) if (isWordStart(title, i)) return 80;
    return 50;
  }
  if (item.url?.toLowerCase().includes(token) || item.subtitle?.toLowerCase().includes(token)) return 20;
  return null;
}

/** Every whitespace-separated token must match; the score is the sum plus a kind bias. */
export function scoreItem(item: SearchItem, query: string): number | null {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  let total = KIND_BIAS[item.kind];
  for (const token of tokens) {
    const s = scoreToken(item, token);
    if (s === null) return null;
    total += s;
  }
  return total;
}

/**
 * Keep only the best item per URL among pages (tabs, cards, history), so a page
 * that is open, saved and in history appears once as the open tab. Workspaces
 * and go-links are always kept. Input must already be best-first.
 */
export function dedupeByUrl(sorted: readonly SearchItem[]): SearchItem[] {
  const seen = new Set<string>();
  return sorted.filter((item) => {
    if (!item.url || item.kind === "golink" || item.kind === "workspace") return true;
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

/** Rank items best-first for a query (stable for ties), dedupe, and cap the list. */
export function rankItems(items: readonly SearchItem[], query: string, limit = 50): SearchItem[] {
  const scored = items.flatMap((item, order) => {
    const score = scoreItem(item, query);
    return score === null ? [] : [{ item, score, order }];
  });
  scored.sort((a, b) => b.score - a.score || a.order - b.order);
  return dedupeByUrl(scored.map((s) => s.item)).slice(0, limit);
}

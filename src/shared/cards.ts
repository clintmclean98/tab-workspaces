import type { Card } from "./types";

/** The tab's web address if it is a page worth saving (http or https). A tab still loading has only a pending URL. */
export function savableUrl(tab: chrome.tabs.Tab): string | undefined {
  const url = tab.url || tab.pendingUrl;
  return url && /^https?:\/\//.test(url) ? url : undefined;
}

export function tabToCard(tab: chrome.tabs.Tab): Card | null {
  const url = savableUrl(tab);
  if (!url) return null;
  return { id: crypto.randomUUID(), url, title: tab.title || url, favIconUrl: tab.favIconUrl };
}

/**
 * Build the card list for a set of live tabs, in tab order. Cards that already
 * exist for the same URL keep their id and note; each previous card is reused at most once.
 */
export function reconcileCards(previous: readonly Card[], tabs: readonly chrome.tabs.Tab[]): Card[] {
  const unused = [...previous];
  const cards: Card[] = [];
  for (const tab of tabs) {
    const fresh = tabToCard(tab);
    if (!fresh) continue;
    const i = unused.findIndex((c) => c.url === fresh.url);
    if (i < 0) {
      cards.push(fresh);
      continue;
    }
    const [old] = unused.splice(i, 1);
    cards.push({ ...fresh, id: old.id, note: old.note });
  }
  return cards;
}

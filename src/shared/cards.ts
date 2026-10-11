import type { Card } from "./types";

export function tabToCard(tab: chrome.tabs.Tab): Card | null {
  if (!tab.url || !/^https?:\/\//.test(tab.url)) return null;
  return { id: crypto.randomUUID(), url: tab.url, title: tab.title || tab.url, favIconUrl: tab.favIconUrl };
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

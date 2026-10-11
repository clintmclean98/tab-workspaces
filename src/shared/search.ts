import type { Collection } from "./types";

const matches = (text: string | undefined, q: string) => !!text && text.toLowerCase().includes(q);

/**
 * Filter collections by a free-text query over titles, card titles, URLs and notes.
 * A collection whose own title matches is kept whole; otherwise it is kept with
 * only its matching cards, and dropped if none match.
 */
export function filterCollections(collections: Collection[], query: string): Collection[] {
  const q = query.trim().toLowerCase();
  if (!q) return collections;
  return collections.flatMap((c) => {
    if (matches(c.title, q)) return [c];
    const cards = c.cards.filter((k) => matches(k.title, q) || matches(k.url, q) || matches(k.note, q));
    return cards.length > 0 ? [{ ...c, cards }] : [];
  });
}

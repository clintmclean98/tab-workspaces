export interface Card {
  id: string;
  url: string;
  title: string;
  favIconUrl?: string;
  note?: string;
}

export interface Collection {
  id: string;
  title: string;
  createdAt: number;
  cards: Card[];
}

/** A named set of tabs. While bound to a window, `cards` mirrors that window's tabs. */
export interface Workspace {
  id: string;
  name: string;
  createdAt: number;
  cards: Card[];
}

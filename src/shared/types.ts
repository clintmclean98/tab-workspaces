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

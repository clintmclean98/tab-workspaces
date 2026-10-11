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

export interface Workspace {
  id: string;
  name: string;
  /** Window currently bound to this workspace, if any. */
  windowId?: number;
  cards: Card[];
}

export interface State {
  version: 1;
  collections: Collection[];
  workspaces: Workspace[];
}

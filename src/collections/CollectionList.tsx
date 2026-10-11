import { deleteCollection, openCollection, renameCollection } from "../shared/store";
import type { Collection } from "../shared/types";
import { CardRow } from "./CardRow";
import { EditableText } from "./EditableText";

interface Props {
  collections: Collection[];
  searching: boolean;
}

export function CollectionList({ collections, searching }: Props) {
  if (collections.length === 0) {
    return (
      <p className="empty">
        {searching ? "Nothing matches that search." : "No collections yet. Open the toolbar popup and choose Save window to keep this window's tabs."}
      </p>
    );
  }
  return (
    <ul>
      {collections.map((c) => (
        <li key={c.id} className="group">
          <div className="group-head">
            <EditableText className="group-title" value={c.title} onSave={(t) => renameCollection(c.id, t)} />
            <span className="muted">{c.cards.length} {c.cards.length === 1 ? "page" : "pages"}</span>
            <span className="group-actions">
              <button className="btn" onClick={() => openCollection(c)}>Open all</button>
              <button className="btn btn-quiet btn-danger" onClick={() => deleteCollection(c.id)}>Delete</button>
            </span>
          </div>
          <ul className="rows">
            {c.cards.map((k) => (
              <CardRow key={k.id} collectionId={c.id} card={k} reorderable={!searching} />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

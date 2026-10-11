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
    return <p>{searching ? "No matches." : "No collections yet. Save a session to get started."}</p>;
  }
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {collections.map((c) => (
        <li key={c.id} style={{ marginBottom: 20 }}>
          <EditableText value={c.title} onSave={(t) => renameCollection(c.id, t)} style={{ fontWeight: 600 }} />{" "}
          <small>({c.cards.length})</small>{" "}
          <button onClick={() => openCollection(c)}>Open all</button>{" "}
          <button onClick={() => deleteCollection(c.id)}>Delete</button>
          <ul style={{ listStyle: "none" }}>
            {c.cards.map((k) => (
              <CardRow key={k.id} collectionId={c.id} card={k} reorderable={!searching} />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

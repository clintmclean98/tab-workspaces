import { deleteCollection, openCollection } from "./store";
import type { Collection } from "./types";

export function CollectionList({ collections }: { collections: Collection[] }) {
  if (collections.length === 0) return <p>No collections yet. Save a session to get started.</p>;
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {collections.map((c) => (
        <li key={c.id} style={{ marginBottom: 16 }}>
          <strong>{c.title}</strong> <small>({c.cards.length})</small>{" "}
          <button onClick={() => openCollection(c)}>Open all</button>{" "}
          <button onClick={() => deleteCollection(c.id)}>Delete</button>
          <ul>
            {c.cards.map((k) => (
              <li key={k.id}>
                <a href={k.url} target="_blank" rel="noreferrer">{k.title}</a>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

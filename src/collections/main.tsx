import { createRoot } from "react-dom/client";
import { useMemo, useState } from "react";
import { filterCollections } from "../shared/search";
import { useCollections } from "../shared/useCollections";
import { CollectionList } from "./CollectionList";

function App() {
  const collections = useCollections();
  const [query, setQuery] = useState("");
  const visible = useMemo(() => filterCollections(collections ?? [], query), [collections, query]);

  return (
    <div style={{ fontFamily: "system-ui", padding: 16, maxWidth: 800, margin: "0 auto" }}>
      <h2>Collections</h2>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search collections, titles, URLs and notes"
        style={{ width: "100%", padding: 6, marginBottom: 12, boxSizing: "border-box" }}
      />
      {collections ? <CollectionList collections={visible} searching={query.trim() !== ""} /> : <p>Loading…</p>}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

import { createRoot } from "react-dom/client";
import { useMemo, useState } from "react";
import { filterCollections } from "../shared/search";
import { useBindings, useCollections, useWorkspaces } from "../shared/useLive";
import { CollectionList } from "./CollectionList";
import { WorkspaceList } from "./WorkspaceList";

function App() {
  const collections = useCollections();
  const workspaces = useWorkspaces();
  const bindings = useBindings();
  const [query, setQuery] = useState("");
  const visible = useMemo(() => filterCollections(collections ?? [], query), [collections, query]);
  const active = useMemo(() => new Set(bindings?.values()), [bindings]);

  return (
    <div style={{ fontFamily: "system-ui", padding: 16, maxWidth: 800, margin: "0 auto" }}>
      <h2>Workspaces</h2>
      {workspaces ? <WorkspaceList workspaces={workspaces} active={active} /> : <p>Loading…</p>}

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

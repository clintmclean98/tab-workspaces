import { createRoot } from "react-dom/client";
import { useMemo, useState } from "react";
import { send } from "../shared/messages";
import { filterCollections } from "../shared/search";
import { useBindings, useCollections, useGoLinks, useWorkspaces } from "../shared/useLive";
import "../styles/theme.css";
import "../styles/manager.css";
import { CollectionList } from "./CollectionList";
import { GoLinkList } from "./GoLinkList";
import { WorkspaceTabs } from "./WorkspaceTabs";

function App() {
  const collections = useCollections();
  const workspaces = useWorkspaces();
  const bindings = useBindings();
  const goLinks = useGoLinks();
  const [query, setQuery] = useState("");
  const visible = useMemo(() => filterCollections(collections ?? [], query), [collections, query]);

  return (
    <main className="page">
      <header className="page-head">
        <h1 className="page-title">Tab Workspaces</h1>
        <button className="btn" onClick={() => void send("open-search", {})}>
          Search everything
        </button>
      </header>

      {workspaces && bindings ? <WorkspaceTabs workspaces={workspaces} bindings={bindings} /> : null}

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Collections</h2>
          <input
            className="input section-tools"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search saved pages and notes"
            aria-label="Search collections"
          />
        </div>
        {collections ? <CollectionList collections={visible} searching={query.trim() !== ""} /> : null}
      </section>

      <section className="section">
        <h2 className="section-title">Go-links</h2>
        {goLinks ? <GoLinkList links={goLinks} /> : null}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

import { createRoot } from "react-dom/client";
import { useCollections } from "../shared/useCollections";
import { CollectionList } from "../shared/CollectionList";

function App() {
  const collections = useCollections();
  return (
    <div style={{ fontFamily: "system-ui", padding: 16, maxWidth: 800, margin: "0 auto" }}>
      <h2>Collections</h2>
      {collections ? <CollectionList collections={collections} /> : <p>Loading…</p>}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

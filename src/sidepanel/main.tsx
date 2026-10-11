import { createRoot } from "react-dom/client";
import { useAppState } from "../shared/useState";
import { CollectionList } from "../shared/CollectionList";

function App() {
  const state = useAppState();
  return (
    <div style={{ fontFamily: "system-ui", padding: 16, maxWidth: 800, margin: "0 auto" }}>
      <h2>Collections (side panel)</h2>
      {state ? <CollectionList collections={state.collections} /> : <p>Loading…</p>}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

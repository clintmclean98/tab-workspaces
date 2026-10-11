import { createRoot } from "react-dom/client";
import { useState } from "react";
import { requestSaveWindow } from "../shared/messages";
import { useCollections } from "../shared/useCollections";

function Popup() {
  const collections = useCollections();
  const [status, setStatus] = useState("");

  const save = async (closeAfter: boolean) => {
    const win = await chrome.windows.getCurrent();
    const res = await requestSaveWindow(win.id!, closeAfter);
    setStatus(!res.ok ? `Failed: ${res.error}` : res.collectionId ? "Saved." : "Nothing to save.");
  };

  return (
    <div style={{ width: 260, fontFamily: "system-ui", padding: 12 }}>
      <h3 style={{ margin: "0 0 8px" }}>Tab Workspaces</h3>
      <button onClick={() => save(false)}>Save window</button>{" "}
      <button onClick={() => save(true)}>Save &amp; close</button>
      <p>{status}</p>
      <small>{collections?.length ?? 0} collections</small>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Popup />);

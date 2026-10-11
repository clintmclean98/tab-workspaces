import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { send } from "../shared/messages";
import { useBindings, useWorkspaces } from "../shared/useLive";
import "../styles/theme.css";
import "../styles/popup.css";

type Outcome = { ok: boolean; error?: string };

function Popup() {
  const workspaces = useWorkspaces();
  const bindings = useBindings();
  const [windowId, setWindowId] = useState<number>();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<{ text: string; error: boolean }>({ text: "", error: false });

  useEffect(() => void chrome.windows.getCurrent().then((w) => setWindowId(w.id)), []);
  const activeId = windowId === undefined ? undefined : bindings?.get(windowId);

  const run = async (work: () => Promise<Outcome>, done: string) => {
    const res = await work();
    setStatus(res.ok ? { text: done, error: false } : { text: res.error ?? "Something went wrong.", error: true });
    return res.ok;
  };

  const saveWindow = (closeAfter: boolean) =>
    windowId !== undefined &&
    run(async () => {
      const res = await send("save-window", { windowId, closeAfter });
      return res.ok && !res.collectionId ? { ok: false, error: "This window has no tabs to save." } : res;
    }, "Saved to your collections.");

  const createWorkspace = async (fromWindow: boolean) => {
    if (windowId === undefined) return;
    if (await run(() => send("create-workspace", { windowId, name, fromWindow }), "Workspace created.")) setName("");
  };

  return (
    <div className="popup">
      <h1 className="popup-title">Tab Workspaces</h1>

      <button className="search-launch" onClick={() => void send("open-search", {}).then(() => window.close())}>
        <span>Search tabs and saved pages</span>
        <kbd>Alt+Shift+F</kbd>
      </button>

      <section className="popup-section">
        <h2 className="popup-heading">Workspaces</h2>
        <ul>
          {(workspaces ?? []).map((w) => (
            <li key={w.id} className="ws-row">
              <span className={`ws-mark${w.id === activeId ? " ws-mark-here" : ""}`} aria-hidden />
              <span className="ws-name">{w.name}</span>
              <span className="ws-count">{w.cards.length}</span>
              {w.id === activeId ? (
                <span className="muted" style={{ fontSize: 12 }}>This window</span>
              ) : (
                <button
                  className="btn"
                  onClick={() => windowId !== undefined && run(() => send("switch-workspace", { windowId, workspaceId: w.id }), "Switched workspace.")}
                >
                  Switch
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="ws-create">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="New workspace name" aria-label="New workspace name" />
          <div className="ws-create-actions">
            <button className="btn btn-primary" onClick={() => createWorkspace(true)}>From this window</button>
            <button className="btn" onClick={() => createWorkspace(false)}>Empty</button>
          </div>
        </div>
      </section>

      <section className="popup-section">
        <h2 className="popup-heading">Collections</h2>
        <div className="popup-actions">
          <button className="btn" onClick={() => saveWindow(false)}>Save window</button>
          <button className="btn" onClick={() => saveWindow(true)}>Save and close</button>
        </div>
      </section>

      <p className={`popup-status${status.error ? " popup-status-error" : ""}`} role="status">{status.text}</p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Popup />);

import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { send } from "../shared/messages";
import { useBindings, useCollections, useWorkspaces } from "../shared/useLive";

const box: React.CSSProperties = { width: 300, fontFamily: "system-ui", padding: 12 };

function Popup() {
  const collections = useCollections();
  const workspaces = useWorkspaces();
  const bindings = useBindings();
  const [windowId, setWindowId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => void chrome.windows.getCurrent().then((w) => setWindowId(w.id ?? null)), []);
  const activeId = windowId === null ? undefined : bindings?.get(windowId);

  const run = async (work: () => Promise<{ ok: boolean; error?: string }>, done: string) => {
    const res = await work();
    setStatus(res.ok ? done : `Failed: ${res.error}`);
  };

  const save = (closeAfter: boolean) =>
    windowId !== null &&
    run(async () => {
      const res = await send("save-window", { windowId, closeAfter });
      return res.ok && !res.collectionId ? { ok: false, error: "nothing to save" } : res;
    }, "Saved.");

  const create = (fromWindow: boolean) =>
    windowId !== null &&
    run(() => send("create-workspace", { windowId, name, fromWindow }), "Workspace created.").then(() => setName(""));

  return (
    <div style={box}>
      <h3 style={{ margin: "0 0 8px" }}>Tab Workspaces</h3>
      <button onClick={() => void send("open-search", {}).then(() => window.close())}>Search…</button>

      <section>
        <strong>Workspaces</strong>
        <ul style={{ listStyle: "none", padding: 0, margin: "6px 0" }}>
          {(workspaces ?? []).map((w) => (
            <li key={w.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>
                {w.id === activeId ? "● " : ""}
                {w.name} <small>({w.cards.length})</small>
              </span>
              {w.id !== activeId && (
                <button onClick={() => windowId !== null && run(() => send("switch-workspace", { windowId, workspaceId: w.id }), "Switched.")}>
                  Switch
                </button>
              )}
            </li>
          ))}
        </ul>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New workspace name" style={{ width: "100%", boxSizing: "border-box" }} />
        <button onClick={() => create(true)}>From this window</button> <button onClick={() => create(false)}>Empty</button>
      </section>

      <section style={{ marginTop: 12 }}>
        <strong>Collections</strong> <small>({collections?.length ?? 0})</small>
        <div>
          <button onClick={() => save(false)}>Save window</button> <button onClick={() => save(true)}>Save &amp; close</button>
        </div>
      </section>
      <p>{status}</p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Popup />);

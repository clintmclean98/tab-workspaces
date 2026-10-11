import { useEffect, useState } from "react";
import { send } from "../shared/messages";
import { deleteWorkspace, renameWorkspace } from "../shared/store";
import type { Workspace } from "../shared/types";
import { EditableText } from "./EditableText";
import { PageSummary } from "./PageRow";

interface Props {
  workspaces: Workspace[];
  /** windowId -> workspaceId for every window currently showing a workspace. */
  bindings: ReadonlyMap<number, string>;
}

/** Workspaces as a browser-style tab strip; the selected tab opens into the panel below it. */
export function WorkspaceTabs({ workspaces, bindings }: Props) {
  const [windowId, setWindowId] = useState<number>();
  const [picked, setPicked] = useState<string>();
  const [error, setError] = useState("");

  useEffect(() => void chrome.windows.getCurrent().then((w) => setWindowId(w.id)), []);

  const shownHere = windowId === undefined ? undefined : bindings.get(windowId);
  const shownAnywhere = new Set(bindings.values());
  const selected = workspaces.find((w) => w.id === picked) ?? workspaces.find((w) => w.id === shownHere) ?? workspaces[0];

  const switchHere = async (workspaceId: string) => {
    if (windowId === undefined) return;
    const res = await send("switch-workspace", { windowId, workspaceId });
    setError(res.ok ? "" : res.error);
  };

  if (!selected) {
    return (
      <div className="panel">
        <p className="panel-empty">No workspaces yet. Open the toolbar popup and choose From this window to turn the tabs you have open into one.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="strip" role="tablist" aria-label="Workspaces">
        {workspaces.map((w) => (
          <button
            key={w.id}
            role="tab"
            aria-selected={w.id === selected.id}
            className={`tab${w.id === selected.id ? " tab-selected" : ""}`}
            onClick={() => setPicked(w.id)}
            title={shownAnywhere.has(w.id) ? "Open in a window" : undefined}
          >
            {shownAnywhere.has(w.id) && <span className="tab-here" aria-label="Open in a window" />}
            <span className="tab-name">{w.name}</span>
          </button>
        ))}
      </div>
      <section className="panel" role="tabpanel">
        <div className="panel-head">
          <EditableText className="panel-title" value={selected.name} onSave={(n) => renameWorkspace(selected.id, n)} />
          <span className="muted">{selected.cards.length} {selected.cards.length === 1 ? "tab" : "tabs"}</span>
          <span className="panel-actions">
            {/* Wait for the window id: until then we can't tell whether this workspace is already showing. */}
            {windowId !== undefined && (
              <button className="btn btn-primary" disabled={selected.id === shownHere} onClick={() => switchHere(selected.id)}>
                {selected.id === shownHere ? "Showing in this window" : "Show in this window"}
              </button>
            )}
            <button
              className="btn btn-quiet btn-danger"
              disabled={shownAnywhere.has(selected.id)}
              title={shownAnywhere.has(selected.id) ? "Switch its window to another workspace first" : undefined}
              onClick={() => confirm(`Delete the workspace "${selected.name}"?`) && deleteWorkspace(selected.id)}
            >
              Delete
            </button>
          </span>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {selected.cards.length === 0 ? (
          <p className="panel-empty">This workspace has no tabs yet. Show it in a window and open tabs there; they are saved here as you go.</p>
        ) : (
          <ul className="rows">
            {selected.cards.map((k) => (
              <li key={k.id} className="row">
                <PageSummary card={k} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

import { deleteWorkspace, renameWorkspace } from "../shared/store";
import type { Workspace } from "../shared/types";
import { EditableText } from "./EditableText";

interface Props {
  workspaces: Workspace[];
  /** Ids of workspaces currently shown in a window. */
  active: ReadonlySet<string>;
}

export function WorkspaceList({ workspaces, active }: Props) {
  if (workspaces.length === 0) return <p>No workspaces yet. Create one from the toolbar popup.</p>;
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {workspaces.map((w) => (
        <li key={w.id} style={{ marginBottom: 12 }}>
          {active.has(w.id) && "● "}
          <EditableText value={w.name} onSave={(n) => renameWorkspace(w.id, n)} style={{ fontWeight: 600 }} />{" "}
          <small>({w.cards.length} tabs)</small>{" "}
          <button
            onClick={() => confirm(`Delete workspace "${w.name}"?`) && deleteWorkspace(w.id)}
            disabled={active.has(w.id)}
            title={active.has(w.id) ? "Switch the window to another workspace first" : undefined}
          >
            Delete
          </button>
          <ul style={{ listStyle: "none", fontSize: 12 }}>
            {w.cards.slice(0, 5).map((k) => (
              <li key={k.id}>{k.title}</li>
            ))}
            {w.cards.length > 5 && <li>… and {w.cards.length - 5} more</li>}
          </ul>
        </li>
      ))}
    </ul>
  );
}

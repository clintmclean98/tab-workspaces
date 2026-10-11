import { useEffect, useState } from "react";
import { listBindings, onBindingsChange } from "./bindings";
import { listCollections, listGoLinks, listWorkspaces, onCollectionsChange, onGoLinksChange, onWorkspacesChange } from "./store";

/** Load a value now and again whenever `subscribe` reports a change. `null` until first load. */
function useLive<T>(load: () => Promise<T>, subscribe: (cb: () => void) => () => void): T | null {
  const [value, setValue] = useState<T | null>(null);
  useEffect(() => {
    const refresh = () => void load().then(setValue);
    refresh();
    return subscribe(refresh);
    // load/subscribe are module-level functions, so they never change.
  }, []);
  return value;
}

export const useCollections = () => useLive(listCollections, onCollectionsChange);
export const useWorkspaces = () => useLive(listWorkspaces, onWorkspacesChange);
export const useGoLinks = () => useLive(listGoLinks, onGoLinksChange);
/** windowId -> workspaceId for bound windows. */
export const useBindings = () => useLive(listBindings, onBindingsChange);

import { send } from "../shared/messages";
import type { SearchItem } from "../shared/universalSearch";

/**
 * Do what choosing a result means. `windowId` is the browser window the search
 * was opened from: pages open there and workspaces switch it. Returns an error
 * message, or null on success.
 */
export async function activate(item: SearchItem, windowId: number): Promise<string | null> {
  switch (item.kind) {
    case "tab":
      await chrome.tabs.update(item.tabId, { active: true });
      await chrome.windows.update(item.windowId, { focused: true });
      return null;
    case "workspace": {
      const res = await send("switch-workspace", { windowId, workspaceId: item.workspaceId });
      if (!res.ok) return res.error;
      await chrome.windows.update(windowId, { focused: true });
      return null;
    }
    case "card":
    case "history":
    case "golink":
      await chrome.tabs.create({ windowId, url: item.url, active: true });
      await chrome.windows.update(windowId, { focused: true });
      return null;
  }
}

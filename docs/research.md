# Workona + Toby: reverse-engineering findings

Targets (downloaded from the Chrome Web Store, not included in this repo):
- Workona "Tab Manager by Workona" 3.1.35, id `ailcmbgekjpnablpdkmaaccecekgdhlh`, MV3
- Toby "Tab Manager & Session Saver" 2.0.0.11, id `hddnkoipeenegfoeaoibdmnaalmgkpip`, MV3

Evidence: REA `analyze_javascript_application` summaries
(`ev_efbbd948...` Workona, `ev_f57f2cfa...` Toby) plus direct reading of the
prettified background bundles. REA's graphs are partial (large bundles hit
semantic-graph limits). The conclusions below come from reading the code, not
from runtime observation.

## Workona: thin native bridge, the product is a web app

Observed:
- Permissions: tabs, history, storage, unlimitedStorage, contextMenus. Optional: tabGroups, system.memory.
- `externally_connectable` is workona.com. The background accepts `onConnect`,
  `onConnectExternal`, `onMessage` and `onMessageExternal`, so the web app at
  `workona.com/0/...` is the UI.
- The background exposes a numeric-method RPC (`Xh` switch) and a generic
  `chrome.*` proxy (`wS`). The proxy covers tabs/windows/history calls, plus
  `tabs.hide`, `tabs.show`, `tabs.group` and `tabs.discard`.
- It keeps a tab cache and pushes the full state (`method 245`: tabs, tabGroups,
  windowBindings, sessionId, clientId) to every connected "manager" port when tabs change.
- It listens to every tabs/windows/tabGroups event to maintain that cache.
- "Hide" tabs are emulated by moving them to a minimized window (`minimized`/`normal` window states).
- Web-app tabs get `autoDiscardable=false`.
- Placeholder/suspend URLs: `workona.com/redirect/#`, `/suspended/#`, `/inactive/`.
- Commands: Alt+D save tab (action), Alt+A switch space, Alt+S universal search, Alt+N new space/doc, close space.
- Cleanup of history entries for its own redirect/helper pages.

Inferred: the "workspace" model (spaces, resources, sync, search, teams) lives
server-side in the web app. It cannot be recovered from the extension and is
not worth cloning pixel for pixel.

## Toby: local-first React app plus a cloud API

Observed:
- Permissions: storage, tabs, contextMenus, cookies, sidePanel, declarativeNetRequestWithHostAccess. Optional: tabGroups, history, `<all_urls>`.
- Surfaces: new-tab override (`newtab.html`, 933 KB bundle), popup, side panel (user-switchable, `popupSurface`), `note.html` editor, omnibox keyword `to/`.
- Save flow: the action opens the popup/side panel. The new tab page sends
  `__TOBY_CLOSE_SAVED_TABS__` to the background, which focuses or creates the
  Toby tab, opens a replacement new tab if the window would otherwise be empty,
  then closes the saved tabs.
- Message `open-all`: opens a collection's card URLs as inactive tabs (`urls[]`), filtering unsafe URLs.
- Go links: a DNR dynamic rule redirects `http(s)://to/<x>` and search-engine queries `q=to/<x>` to `<app>/to/<x>`.
- Data model (from bundle identifiers): `teams -> spaces -> lists (collections) -> cards`,
  with `sessionListIds`, `labels`, notes and per-space ordering.
- API (`api2.gettoby.com/v2`): `/lists`, `/lists/batch`, `/lists/merge`, `/cards`, `/teams`, `/labels`, `/states`, `/links/search`.
- Local state is in `chrome.storage.local` (`toby_ui_state`, `user`, `auth_token`).

Unknown: exact request/response schemas and the sync/conflict protocol. These
need runtime capture and aren't needed for a local-first clone.

## Feature set to implement (own code, not copied)

1. Save session: one click saves all tabs in the window to a collection, then optionally closes them (Toby).
2. Collections of cards (url, title, favicon, note), with drag/drop, search, and open-all / open-one (Toby).
3. Workspaces: a named set of tabs bound to a window. Switching hides the current set and restores the other (Workona).
4. Tab suspension (`tabs.discard`) and hiding via a minimized window or tab groups (Workona).
5. Universal search over open tabs, saved cards and history, plus keyboard shortcuts (Workona).
6. New-tab override, side panel, and omnibox `to/` go-links (Toby).
7. Optional later: sync via `chrome.storage.sync` or a small backend.

## Proposed architecture

MV3, TypeScript, Vite + React. `chrome.storage.local` is the store (IndexedDB
if it gets large). One background service worker owns the tab cache and
window-to-workspace bindings. Popup, side panel and new-tab page are views
over the same store.

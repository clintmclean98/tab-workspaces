# tab-workspaces

An open-source Chrome extension (Manifest V3) that combines two ideas:

- **Session saving and collections**, in the style of [Toby](https://www.gettoby.com/): save a window's tabs in one click, organize them into collections, and restore them later.
- **Workspaces**, in the style of [Workona](https://workona.com/): bind a named set of tabs to a window and switch between them, with tab suspending and universal search.

This is an independent project. It shares no code with either product. The
notes in [`docs/research.md`](docs/research.md) describe how the two
extensions' public behavior and architecture informed the design.

## Status

Early scaffold. Working today: save a window's tabs into a collection (popup button
or `Alt+Shift+S`), view and delete collections on the new-tab page and side panel,
and open a collection's tabs. Workspaces, search and go-links are not built yet.

## Development

```
npm install
npm run build        # outputs the unpacked extension to dist/
npm run dev          # rebuild on change
```

Then open `chrome://extensions`, enable Developer mode, choose **Load unpacked**
and select the `dist/` folder.

Layout: `src/background` (service worker), `src/popup`, `src/newtab`,
`src/sidepanel` (views), `src/shared` (types and the `chrome.storage.local` store),
`public/manifest.json`.

## Planned features

- One-click save of the current window's tabs to a collection, optionally closing them
- Collections of cards (URL, title, favicon, note) with search and open-all
- Workspaces bound to windows, with tab hide and suspend
- Universal search across open tabs, saved cards and history
- New-tab page, side panel and `to/` omnibox go-links
- Keyboard shortcuts
- Local-first storage; optional sync later

## Planned stack

TypeScript, React, Vite, Manifest V3, `chrome.storage.local`.

## License

MIT

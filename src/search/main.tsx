import { createRoot } from "react-dom/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { displayUrl } from "../shared/format";
import { rankItems, type Kind, type SearchItem } from "../shared/universalSearch";
import "../styles/theme.css";
import "../styles/search.css";
import { activate } from "./activate";
import { hasHistoryAccess, loadLocalItems, requestHistoryAccess, searchHistory } from "./sources";

const params = new URLSearchParams(location.search);
const originWindowId = Number(params.get("w"));

const LABEL: Record<Kind, string> = { tab: "Open tab", card: "Saved", history: "History", golink: "Go-link", workspace: "Workspace" };

function Search() {
  const [query, setQuery] = useState("");
  const [local, setLocal] = useState<SearchItem[]>([]);
  const [history, setHistory] = useState<SearchItem[]>([]);
  const [historyOn, setHistoryOn] = useState(true); // assume granted until checked, to avoid a flash of the button
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    void loadLocalItems().then(setLocal);
    void hasHistoryAccess().then(setHistoryOn);
  }, []);

  // History is looked up per query; ignore answers that arrive after the query changed.
  useEffect(() => {
    let current = true;
    void searchHistory(query).then((items) => current && setHistory(items));
    return () => void (current = false);
  }, [query, historyOn]);

  const results = useMemo(() => rankItems([...local, ...history], query), [local, history, query]);
  useEffect(() => setSelected(0), [query]);
  useEffect(() => listRef.current?.children[selected]?.scrollIntoView({ block: "nearest" }), [selected]);

  const choose = async (item: SearchItem | undefined) => {
    if (!item) return;
    const failure = await activate(item, originWindowId);
    if (failure) return setError(failure);
    window.close();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") setSelected((s) => Math.min(s + 1, results.length - 1));
    else if (e.key === "ArrowUp") setSelected((s) => Math.max(s - 1, 0));
    else if (e.key === "Enter") void choose(results[selected]);
    else if (e.key === "Escape") window.close();
    else return;
    e.preventDefault();
  };

  return (
    <div className="finder" onKeyDown={onKeyDown}>
      <div className="finder-bar">
        <input
          autoFocus
          className="finder-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tabs, saved pages, workspaces and go-links"
          aria-label="Search"
        />
        {!historyOn && (
          <button className="btn finder-history" onClick={async () => setHistoryOn(await requestHistoryAccess())}>
            Include browsing history
          </button>
        )}
      </div>
      {error && <div className="finder-error" role="alert">{error}</div>}
      <ul ref={listRef} className="finder-results" role="listbox">
        {results.map((item, i) => (
          <li
            key={item.key}
            role="option"
            aria-selected={i === selected}
            className={`result${i === selected ? " result-selected" : ""}`}
            onMouseMove={() => setSelected(i)}
            onClick={() => void choose(item)}
          >
            <span className={`chip chip-${item.kind}`}>{LABEL[item.kind]}</span>
            <span className="result-main">
              <span className="result-title">{item.title}</span>
              <span className="result-sub">
                {item.url ? displayUrl(item.url) : item.subtitle}
                {item.url && item.subtitle ? `, ${item.subtitle.toLowerCase()}` : ""}
                {item.note ? <span className="result-note">{` “${item.note}”`}</span> : null}
              </span>
            </span>
          </li>
        ))}
        {results.length === 0 && <li className="finder-empty">Nothing matches “{query}”.</li>}
      </ul>
      <div className="finder-foot">Enter opens the highlighted result. Up and Down move. Esc closes.</div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Search />);

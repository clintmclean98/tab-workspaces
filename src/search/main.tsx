import { createRoot } from "react-dom/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { rankItems, type Kind, type SearchItem } from "../shared/universalSearch";
import { activate } from "./activate";
import { hasHistoryAccess, loadLocalItems, requestHistoryAccess, searchHistory } from "./sources";

const params = new URLSearchParams(location.search);
const originWindowId = Number(params.get("w"));

const LABEL: Record<Kind, string> = { tab: "Tab", card: "Saved", history: "History", golink: "Go", workspace: "Workspace" };

function Search() {
  const [query, setQuery] = useState("");
  const [local, setLocal] = useState<SearchItem[]>([]);
  const [history, setHistory] = useState<SearchItem[]>([]);
  const [historyOn, setHistoryOn] = useState(false);
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
    <div style={{ fontFamily: "system-ui", padding: 12 }} onKeyDown={onKeyDown}>
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tabs, saved pages, workspaces, go-links and history"
        style={{ width: "100%", boxSizing: "border-box", padding: 8, fontSize: 15 }}
      />
      {!historyOn && (
        <button style={{ marginTop: 6 }} onClick={async () => setHistoryOn(await requestHistoryAccess())}>
          Include browsing history
        </button>
      )}
      {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
      <ul ref={listRef} style={{ listStyle: "none", padding: 0, margin: "8px 0 0", maxHeight: 400, overflowY: "auto" }}>
        {results.map((item, i) => (
          <li
            key={item.key}
            onMouseMove={() => setSelected(i)}
            onClick={() => void choose(item)}
            style={{ padding: "6px 8px", cursor: "pointer", background: i === selected ? "#e0e7ff" : undefined, borderRadius: 4 }}
          >
            <small style={{ opacity: 0.6, marginRight: 6 }}>{LABEL[item.kind]}</small>
            {item.title}
            <div style={{ fontSize: 12, opacity: 0.6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.subtitle ? `${item.subtitle} · ` : ""}
              {item.url}
            </div>
          </li>
        ))}
        {results.length === 0 && <li style={{ padding: 8 }}>No results.</li>}
      </ul>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Search />);

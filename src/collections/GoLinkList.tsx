import { useState } from "react";
import { parseGoLink } from "../shared/golinks";
import { deleteGoLink, saveGoLink } from "../shared/store";
import type { GoLink } from "../shared/types";

export function GoLinkList({ links }: { links: GoLink[] }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const add = async () => {
    const parsed = parseGoLink(name, url);
    if ("error" in parsed) return setError(parsed.error);
    await saveGoLink(parsed.link);
    setName("");
    setUrl("");
    setError("");
  };

  return (
    <div>
      <p style={{ fontSize: 13 }}>
        Type <code>to</code>, press Space or Tab, then a name in the address bar.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="name (e.g. jira)" />{" "}
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" style={{ width: 280 }} />{" "}
        <button type="submit">Add</button>
        {error && <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div>}
      </form>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {links.map((l) => (
          <li key={l.name} style={{ marginTop: 6 }}>
            <strong>{l.name}</strong> → <a href={l.url} target="_blank" rel="noreferrer">{l.url}</a>{" "}
            <button onClick={() => deleteGoLink(l.name)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

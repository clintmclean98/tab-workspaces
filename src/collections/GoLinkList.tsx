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
      <p className="muted">
        In the address bar, type <strong>to</strong>, press Space or Tab, then the name.
      </p>
      <form
        className="golink-form"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name, such as jira" aria-label="Go-link name" />
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" aria-label="Go-link URL" />
        <button className="btn btn-primary" type="submit">Add go-link</button>
        {error && <div className="form-error" role="alert">{error}</div>}
      </form>
      <ul>
        {links.map((l) => (
          <li key={l.name} className="golink">
            <span className="golink-name">{l.name}</span>
            <a className="golink-url" href={l.url} target="_blank" rel="noreferrer">{l.url}</a>
            <button className="btn btn-quiet btn-danger" onClick={() => deleteGoLink(l.name)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

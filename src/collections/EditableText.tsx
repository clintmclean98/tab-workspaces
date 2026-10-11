import { useState } from "react";

interface Props {
  value: string;
  placeholder?: string;
  onSave: (value: string) => void;
  style?: React.CSSProperties;
}

/** Text that turns into an input on click; Enter or blur saves, Escape cancels. */
export function EditableText({ value, placeholder, onSave, style }: Props) {
  const [draft, setDraft] = useState<string | null>(null);

  if (draft === null) {
    return (
      <span onClick={() => setDraft(value)} style={{ cursor: "text", ...style }} title="Click to edit">
        {value || <em style={{ opacity: 0.5 }}>{placeholder}</em>}
      </span>
    );
  }
  const commit = () => {
    if (draft !== value) onSave(draft);
    setDraft(null);
  };
  return (
    <input
      autoFocus
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setDraft(null);
      }}
      style={style}
    />
  );
}

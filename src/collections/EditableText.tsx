import { useState } from "react";

interface Props {
  value: string;
  placeholder?: string;
  onSave: (value: string) => void;
  className?: string;
}

/** Text that turns into an input on click; Enter or blur saves, Escape cancels. */
export function EditableText({ value, placeholder, onSave, className = "" }: Props) {
  const [draft, setDraft] = useState<string | null>(null);

  if (draft === null) {
    return (
      <span
        className={`editable ${className}`}
        role="button"
        tabIndex={0}
        title="Click to edit"
        onClick={() => setDraft(value)}
        onKeyDown={(e) => e.key === "Enter" && setDraft(value)}
      >
        {value || <span className="muted">{placeholder}</span>}
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
      className={`editable-input ${className}`}
      value={draft}
      placeholder={placeholder}
      size={Math.max(draft.length, 8)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setDraft(null);
      }}
    />
  );
}

import { useState } from "react";
import { deleteCard, moveCard, setCardNote } from "../shared/store";
import type { Card } from "../shared/types";
import { EditableText } from "./EditableText";

interface Props {
  collectionId: string;
  card: Card;
  /** Drag-reorder is disabled while a search filters the card list. */
  reorderable: boolean;
}

const DRAG_TYPE = "application/x-card";

export function CardRow({ collectionId, card, reorderable }: Props) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <li
      draggable={reorderable}
      onDragStart={(e) => e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ collectionId, cardId: card.id }))}
      onDragOver={(e) => {
        if (reorderable && e.dataTransfer.types.includes(DRAG_TYPE)) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        setDragOver(false);
        const raw = e.dataTransfer.getData(DRAG_TYPE);
        if (!raw) return;
        const from = JSON.parse(raw) as { collectionId: string; cardId: string };
        if (from.collectionId === collectionId) void moveCard(collectionId, from.cardId, card.id);
      }}
      style={{ marginBottom: 4, borderTop: dragOver ? "2px solid #4f46e5" : "2px solid transparent" }}
    >
      {card.favIconUrl && <img src={card.favIconUrl} alt="" width={14} height={14} style={{ marginRight: 6 }} />}
      <a href={card.url} target="_blank" rel="noreferrer">{card.title}</a>{" "}
      <button onClick={() => deleteCard(collectionId, card.id)} aria-label="Remove card">×</button>
      <div style={{ marginLeft: 20, fontSize: 12 }}>
        <EditableText value={card.note ?? ""} placeholder="Add note" onSave={(n) => setCardNote(collectionId, card.id, n)} />
      </div>
    </li>
  );
}

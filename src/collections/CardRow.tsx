import { useState } from "react";
import { deleteCard, moveCard, setCardNote } from "../shared/store";
import type { Card } from "../shared/types";
import { EditableText } from "./EditableText";
import { PageSummary } from "./PageRow";

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
      className={`row${dragOver ? " row-over" : ""}`}
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
    >
      <PageSummary card={card} />
      <span className="row-note">
        <EditableText value={card.note ?? ""} placeholder="Add note" onSave={(n) => setCardNote(collectionId, card.id, n)} />
      </span>
      <button className="btn btn-quiet row-remove" onClick={() => deleteCard(collectionId, card.id)} aria-label={`Remove ${card.title}`}>
        Remove
      </button>
    </li>
  );
}

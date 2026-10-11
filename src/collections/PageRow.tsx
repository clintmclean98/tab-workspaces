import { displayUrl, siteInitial } from "../shared/format";
import type { Card } from "../shared/types";

/** The favicon, title and address shared by every row that shows a saved page. */
export function PageSummary({ card }: { card: Card }) {
  return (
    <>
      {card.favIconUrl ? <img className="favicon" src={card.favIconUrl} alt="" /> : <span className="favicon favicon-blank" aria-hidden>{siteInitial(card.url)}</span>}
      <span className="row-main">
        <a className="row-title" href={card.url} target="_blank" rel="noreferrer">
          {card.title}
        </a>
        <span className="row-sub">{displayUrl(card.url)}</span>
      </span>
    </>
  );
}

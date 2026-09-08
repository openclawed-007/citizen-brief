import Link from "next/link";
import type { NewsItem } from "@/lib/types";
import { formatDate, kindLabel } from "@/lib/format";
import { MediaImage } from "./MediaImage";

export function NewsLead({ item, href, priority = false }: { item: NewsItem; href: string; priority?: boolean }) {
  return (
    <Link href={href} className={`lead-story${item.image ? "" : " text-only"}`}>
      {item.image ? <MediaImage src={item.image} priority={priority} /> : null}
      <div>
        <div className="story-meta">
          <span className="kind">{kindLabel(item.kind)}</span>
          {item.publishedAt ? <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time> : null}
        </div>
        <h2>{item.title}</h2>
        <p>{item.excerpt}</p>
        <span className="story-cta">Read story <span aria-hidden="true">→</span></span>
      </div>
    </Link>
  );
}

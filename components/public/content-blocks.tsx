import Image from "next/image";
import Link from "next/link";
import type { ContentBlock } from "@/lib/cms-types";
import type { CSSProperties, ReactNode } from "react";

function lines(value: unknown) {
  return String(value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

export function ContentBody({ body, blocks = [] }: { body?: string; blocks?: ContentBlock[] }) {
  const visible = [...blocks].filter((block) => !block.hidden).sort((a, b) => a.order - b.order);
  return <div className="managed-content">
    {lines(body).map((paragraph, index) => <p key={`body-${index}`}>{paragraph}</p>)}
    {visible.map((block) => {
      const text = String(block.data.text || "");
      const source = String(block.data.src || block.data.url || text);
      const label = String(block.data.label || block.data.title || "Learn more");
      let content: ReactNode;
      if (block.type === "quote") content = <blockquote>{text}</blockquote>;
      else if (block.type === "image") content = <figure><div className="managed-image"><Image src={source || "/media/b28-logo.jpg"} alt={String(block.data.alt || "")} fill sizes="(max-width: 900px) 100vw, 900px"/></div>{block.data.caption && <figcaption>{String(block.data.caption)}</figcaption>}</figure>;
      else if (block.type === "video") content = <p><a className="button outline" href={source} target="_blank" rel="noreferrer">{label === "Learn more" ? "Watch video" : label}</a></p>;
      else if (block.type === "cta") content = <p><Link className="button light" href={source || "/contact"}>{label}</Link></p>;
      else if (["gallery", "stats", "timeline"].includes(block.type)) content = <div className={`managed-${block.type}`}>{lines(text).map((line) => <p key={line}>{line}</p>)}</div>;
      else content = <div>{lines(text).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>;
      const style = { backgroundColor: String(block.data.backgroundColor || "transparent"), backgroundImage: block.data.backgroundImage ? `url("${String(block.data.backgroundImage).replace(/["\\]/g, "")}")` : undefined, color: block.data.textColor ? String(block.data.textColor) : undefined, textAlign: block.data.align as CSSProperties["textAlign"], padding: block.data.padding ? `${Number(block.data.padding)}px` : undefined, backgroundSize: "cover", backgroundPosition: "center" } satisfies CSSProperties;
      return <section className="managed-block" style={style} key={block.id}>{block.data.heading ? <h2>{String(block.data.heading)}</h2> : null}{content}</section>;
    })}
  </div>;
}

export function contentBlocks(data: Record<string, unknown>) {
  return Array.isArray(data.blocks) ? data.blocks as ContentBlock[] : [];
}

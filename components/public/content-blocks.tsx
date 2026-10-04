import Image from "next/image";
import Link from "next/link";
import type { ContentBlock } from "@/lib/cms-types";

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
      if (block.type === "quote") return <blockquote key={block.id}>{text}</blockquote>;
      if (block.type === "image") return <figure key={block.id}><div className="managed-image"><Image src={source || "/media/b28-logo.jpg"} alt={String(block.data.alt || "")} fill sizes="(max-width: 900px) 100vw, 900px"/></div>{block.data.caption && <figcaption>{String(block.data.caption)}</figcaption>}</figure>;
      if (block.type === "video") return <p key={block.id}><a className="button outline" href={source} target="_blank" rel="noreferrer">{label === "Learn more" ? "Watch video" : label}</a></p>;
      if (block.type === "cta") return <p key={block.id}><Link className="button light" href={source || "/contact"}>{label}</Link></p>;
      if (["gallery", "stats", "timeline"].includes(block.type)) return <div className={`managed-${block.type}`} key={block.id}>{lines(text).map((line) => <p key={line}>{line}</p>)}</div>;
      return <div key={block.id}>{lines(text).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>;
    })}
  </div>;
}

export function contentBlocks(data: Record<string, unknown>) {
  return Array.isArray(data.blocks) ? data.blocks as ContentBlock[] : [];
}

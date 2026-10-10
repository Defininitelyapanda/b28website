import Image from "next/image";
import Link from "next/link";
import type { ContentItem } from "@/lib/cms-types";

type JournalGridProps = {
  articles: ContentItem[];
  fallbackImage?: string;
  showYear?: boolean;
};

export function JournalGrid({ articles, fallbackImage = "/media/after-rain.png", showYear = false }: JournalGridProps) {
  return <div className="journal-grid">{articles.map((article) => {
    const category = String(article.data.category || "Journal");
    const year = new Date(article.publishedAt || article.createdAt).getFullYear();
    return <article className="journal-card" key={article.id}>
      <Link href={`/journal/${article.slug}`}>
        <div className="journal-image"><Image src={article.coverImage || fallbackImage} alt={article.title} fill sizes="(max-width:700px) 100vw, 33vw"/></div>
        <p className="meta">{category}{showYear ? ` · ${year}` : ""}</p>
        <h3>{article.title}</h3>
        <p>{article.excerpt}</p>
      </Link>
    </article>;
  })}</div>;
}

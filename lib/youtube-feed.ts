export type YouTubeUpload = {
  videoId: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
};

function decodeXml(value: string) {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}

function tag(entry: string, name: string) {
  const match = entry.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

export function parseYouTubeFeed(xml: string): YouTubeUpload[] {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map((match) => {
    const entry = match[1];
    const alternateLink = entry.match(/<link\s+rel=["']alternate["']\s+href=["']([^"']+)["']/i)?.[1] ?? "";
    return {
      videoId: tag(entry, "yt:videoId"),
      title: tag(entry, "title"),
      description: tag(entry, "media:description"),
      url: decodeXml(alternateLink),
      publishedAt: tag(entry, "published"),
    };
  }).filter((upload) => upload.videoId && upload.title && upload.url && upload.publishedAt);
}

export function isProjectUpload(upload: YouTubeUpload) {
  const title = upload.title.toLocaleLowerCase();
  const isShort = upload.url.includes("/shorts/");
  const isPreview = /\b(trailer|teaser|preview|behind[ -]the[ -]scenes|bts)\b/.test(title);
  return !isShort && !isPreview;
}

import { updateStore } from "./local-store";
import { isProjectUpload, parseYouTubeFeed, type YouTubeUpload } from "./youtube-feed";

export const B28_YOUTUBE_CHANNEL_ID = "UC0UusFfIWqAa27wyuwjoVXw";
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${B28_YOUTUBE_CHANNEL_ID}`;
const REFRESH_SECONDS = 300;

function projectTitle(rawTitle: string) {
  const firstSection = rawTitle.split(/[|｜]/)[0].trim();
  const cleaned = firstSection
    .replace(/\bofficial\s+(?:short\s+)?film\b/gi, "")
    .replace(/\bfull\s+(?:short\s+)?film\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[\s\-–—:]+$/g, "")
    .trim();
  if (cleaned && cleaned === cleaned.toLocaleUpperCase()) {
    return cleaned.toLocaleLowerCase().replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase());
  }
  return cleaned || rawTitle;
}

function slugify(title: string, videoId: string) {
  const slug = title.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || `youtube-${videoId}`;
}

function projectExcerpt(upload: YouTubeUpload) {
  const summary = upload.description.split(/\n\s*\n/)[0].replace(/#\S+/g, "").replace(/\s+/g, " ").trim();
  return summary || "An official film from B28 Entertainment's YouTube channel.";
}

export async function syncYouTubeProjects() {
  try {
    const response = await fetch(FEED_URL, {
      next: { revalidate: REFRESH_SECONDS },
      headers: { Accept: "application/atom+xml, application/xml;q=0.9" },
    });
    if (!response.ok) return { added: 0, available: false };
    const uploads = parseYouTubeFeed(await response.text()).filter(isProjectUpload);
    const added = await updateStore((store) => {
      let count = 0;
      for (const upload of uploads) {
        const alreadyImported = store.content.some((entry) => {
          const youtubeUrl = typeof entry.data.youtubeUrl === "string" ? entry.data.youtubeUrl : "";
          return entry.data.youtubeVideoId === upload.videoId || youtubeUrl.includes(upload.videoId);
        });
        if (alreadyImported) continue;

        const title = projectTitle(upload.title);
        let slug = slugify(title, upload.videoId);
        if (store.content.some((entry) => entry.slug === slug)) slug = `${slug}-${upload.videoId.toLocaleLowerCase()}`;
        const excerpt = projectExcerpt(upload);
        const stamp = new Date().toISOString();
        store.content.push({
          id: `youtube_${upload.videoId}`,
          type: "project",
          slug,
          title,
          status: "published",
          excerpt,
          body: excerpt,
          coverImage: `/api/youtube/thumbnail/${upload.videoId}`,
          data: {
            year: new Date(upload.publishedAt).getUTCFullYear().toString(),
            format: "Film",
            genre: "Kenyan Film",
            youtubeUrl: upload.url,
            youtubeVideoId: upload.videoId,
            source: "youtube",
          },
          featured: true,
          sortOrder: -Date.parse(upload.publishedAt),
          publishedAt: upload.publishedAt,
          scheduledAt: null,
          createdAt: stamp,
          updatedAt: stamp,
        });
        count += 1;
      }
      if (count > 0) store.activity.push({ id: `activity_${crypto.randomUUID()}`, user_id: "system", action: "youtube_sync", object_type: "project", object_id: B28_YOUTUBE_CHANNEL_ID, detail: `${count} project(s) imported`, created_at: new Date().toISOString() });
      return count;
    });
    return { added, available: true };
  } catch (error) {
    console.warn("youtube_project_sync_failed", error instanceof Error ? error.message : "unknown");
    return { added: 0, available: false };
  }
}

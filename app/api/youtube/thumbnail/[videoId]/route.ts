import { NextResponse } from "next/server";

const VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/;

export async function GET(request: Request, { params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  if (!VIDEO_ID.test(videoId)) return new NextResponse("Invalid video ID", { status: 400 });
  try {
    const thumbnail = await fetch(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, { next: { revalidate: 86400 } });
    if (!thumbnail.ok || !thumbnail.body) throw new Error(`YouTube thumbnail returned ${thumbnail.status}`);
    return new NextResponse(thumbnail.body, {
      headers: {
        "Content-Type": thumbnail.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/media/b28-hero.png", request.url));
  }
}

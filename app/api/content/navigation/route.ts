import { NextResponse } from "next/server";
import { listContent } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function GET() {
  const pages = (await listContent("page", false, 20)).map((page) => ({ title: page.title, slug: page.slug }));
  return NextResponse.json({ pages }, { headers: { "Cache-Control": "no-store" } });
}

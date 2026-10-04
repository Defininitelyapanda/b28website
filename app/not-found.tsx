import Link from "next/link";
import { getSiteSettings } from "@/lib/cms";
import { SiteFooter, SiteHeader } from "@/components/public/site-chrome";
import { SiteTheme } from "@/components/public/site-theme";

export default async function NotFound() {
  const settings = await getSiteSettings();
  return <SiteTheme settings={settings}><SiteHeader settings={settings}/><main className="page-hero"><div className="wrap"><p className="section-kicker">404 / Lost frame</p><h1>Scene not found.</h1><p>The story may have moved, changed title or returned to the edit.</p><Link className="button light" href="/">Return home</Link></div></main><SiteFooter settings={settings}/></SiteTheme>;
}

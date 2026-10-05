import { getSiteSettings } from "@/lib/cms";
import type { SitePageKey } from "@/lib/site-settings";

type PageFrameProps = {
  kicker: string;
  title: string;
  intro: string;
  heroImage: string;
  heroImageAlt: string;
  children: React.ReactNode;
  pageKey?: SitePageKey;
};

import { PageFrameView } from "./page-frame-view";

export async function PageFrame(props: PageFrameProps) {
  return <PageFrameView {...props} settings={await getSiteSettings()}/>;
}

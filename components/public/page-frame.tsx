import Image from "next/image";
import { SiteFooter, SiteHeader } from "./site-chrome";

type PageFrameProps = {
  kicker: string;
  title: string;
  intro: string;
  heroImage: string;
  heroImageAlt: string;
  children: React.ReactNode;
};

export function PageFrame({ kicker, title, intro, heroImage, heroImageAlt, children }: PageFrameProps) {
  return <div className="site-shell"><SiteHeader/><main><header className="page-hero"><Image src={heroImage} alt={heroImageAlt} fill priority sizes="100vw" className="page-hero-image"/><div className="page-hero-shade"/><div className="grain" aria-hidden="true"/><div className="wrap page-hero-copy"><p className="section-kicker">{kicker}</p><h1>{title}</h1><p>{intro}</p></div></header>{children}</main><SiteFooter/></div>;
}

"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Camera, Mail, Menu, Music2, Play, X } from "lucide-react";
import type { SiteSettings } from "@/lib/site-settings";
import { useCanvasSettings } from "./use-canvas-settings";

export function Mark({ logo }: { logo: string }) { return <span className="brand-mark official"><Image src={logo} alt="" width={43} height={43}/></span>; }

function useNavigationLinks(settings: SiteSettings) {
  const [managed, setManaged] = useState<Array<readonly [string, string]>>([]);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/content/navigation", { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Navigation unavailable")))
      .then((result: { pages?: Array<{ title: string; slug: string }> }) => setManaged((result.pages || []).map((page) => [page.title, `/${page.slug}`] as const)))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  const baseLinks = [[settings.navLabels.work, "/work"], [settings.navLabels.about, "/about"], [settings.navLabels.services, "/services"], [settings.navLabels.contact, "/contact"]] as const;
  const links = [...baseLinks.slice(0, 3), ...managed, ...(settings.navigationLinks || []).map((link) => [link.label, link.href] as const), baseLinks[3]];
  return links.filter(([label, href], index) => label && href && links.findIndex((link) => link[1] === href) === index);
}

export function SiteHeader({ settings: initial }: { settings: SiteSettings }) {
  const settings = useCanvasSettings(initial);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = useNavigationLinks(settings);
  return <header className="site-header"><Link href="/" className="brand" aria-label={`${settings.brandName} home`}><Mark logo={settings.logo}/><span>{settings.brandName}</span></Link><nav aria-label="Primary navigation">{links.map(([label, href]) => <Link className={pathname === href ? "active" : ""} key={href} href={href}>{label}</Link>)}<a className="nav-cta" href={settings.projectButtonUrl} target="_blank" rel="noreferrer">{settings.projectButtonLabel}</a></nav><button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-menu"><span>Menu</span>{open ? <X/> : <Menu/>}</button><div id="mobile-menu" className={`mobile-menu ${open ? "open" : ""}`} aria-hidden={!open}><div className="mobile-menu-inner"><p className="eyebrow">{settings.shortName} / Navigate</p>{links.map(([label, href], index) => <Link href={href} key={href} onClick={() => setOpen(false)}><span>0{index + 1}</span>{label}</Link>)}<div className="mobile-bottom"><p>{settings.tagline}</p><a href={settings.projectButtonUrl} target="_blank" rel="noreferrer" className="button light" onClick={() => setOpen(false)}>{settings.projectButtonLabel}</a></div></div></div></header>;
}

export function SiteFooter({ settings: initial }: { settings: SiteSettings }) {
  const settings = useCanvasSettings(initial);
  const links = useNavigationLinks(settings);
  const socials = [{ label: settings.email, href: `mailto:${settings.email}`, Icon: Mail }, { label: "YouTube", href: settings.social.youtube, Icon: Play }, { label: "Instagram", href: settings.social.instagram, Icon: Camera }, { label: "TikTok", href: settings.social.tiktok, Icon: Music2 }];
  return <footer className="site-footer"><div className="wrap footer-grid"><div><Link href="/" className="brand"><Mark logo={settings.logo}/><span>{settings.brandName}</span></Link><p>{settings.tagline}<br/>{settings.location}</p></div><div><p className="footer-label">Explore</p>{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</div><div><p className="footer-label">Connect</p>{socials.filter((item) => item.href).map(({ label, href, Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer"><Icon size={18}/>{label}</a>)}</div><div className="footer-big">{settings.tagline}</div></div><div className="wrap legal"><span>© {new Date().getFullYear()} {settings.brandName}</span><span>{settings.tagline}</span></div></footer>;
}

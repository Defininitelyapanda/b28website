"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Camera, Mail, Menu, Music2, Play, X } from "lucide-react";
import { CONTACT_EMAIL, PROJECT_EMAIL_URL } from "@/lib/contact";

const links = [["Projects", "/work"], ["About", "/about"], ["Services", "/services"], ["Contact", "/contact"]];
const socials = [
  { label: CONTACT_EMAIL, href: PROJECT_EMAIL_URL, Icon: Mail },
  { label: "YouTube", href: "https://www.youtube.com/@officialb28entertainment", Icon: Play },
  { label: "Instagram", href: "https://www.instagram.com/b28entertainment/", Icon: Camera },
  { label: "TikTok", href: "https://www.tiktok.com/@b28entertainment", Icon: Music2 },
];

export function Mark() { return <span className="brand-mark official"><Image src="/media/b28-logo.jpg" alt="" width={43} height={43}/></span>; }

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return <header className="site-header"><Link href="/" className="brand" aria-label="B28 Entertainment home"><Mark/><span>B28<br/>Entertainment</span></Link><nav aria-label="Primary navigation">{links.map(([label, href]) => <Link className={pathname === href ? "active" : ""} key={href} href={href}>{label}</Link>)}<a className="nav-cta" href={PROJECT_EMAIL_URL} target="_blank" rel="noreferrer">Start a project</a></nav><button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-menu"><span>Menu</span>{open ? <X/> : <Menu/>}</button><div id="mobile-menu" className={`mobile-menu ${open ? "open" : ""}`} aria-hidden={!open}><div className="mobile-menu-inner"><p className="eyebrow">B28 / Navigate</p>{links.map(([label, href], index) => <Link href={href} key={href} onClick={() => setOpen(false)}><span>0{index + 1}</span>{label}</Link>)}<div className="mobile-bottom"><p>Entertainment made,<br/>simply for you.</p><a href={PROJECT_EMAIL_URL} target="_blank" rel="noreferrer" className="button light" onClick={() => setOpen(false)}>Start a project</a></div></div></div></header>;
}

export function SiteFooter() {
  return <footer className="site-footer"><div className="wrap footer-grid"><div><Link href="/" className="brand"><Mark/><span>B28<br/>Entertainment</span></Link><p>Kenyan film studio<br/>Nairobi, Kenya</p></div><div><p className="footer-label">Explore</p>{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</div><div><p className="footer-label">Connect</p>{socials.map(({ label, href, Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer"><Icon size={18}/>{label}</a>)}</div><div className="footer-big">Entertainment<br/><em>made for you.</em></div></div><div className="wrap legal"><span>© {new Date().getFullYear()} B28 Entertainment</span><span>Original Kenyan films and visual stories.</span></div></footer>;
}

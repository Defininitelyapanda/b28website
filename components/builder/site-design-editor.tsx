"use client";

import { RotateCcw, Upload } from "lucide-react";
import type { PageDesign, SitePageKey, SiteSettings } from "@/lib/site-settings";

type Props = { settings: SiteSettings; target: "global" | SitePageKey; onChange: (settings: SiteSettings) => void; onUpload: (receiver: (path: string) => void) => void; onReset: () => void };
const fontChoices = ["Helvetica Neue, Arial, sans-serif", "Arial, sans-serif", "Georgia, serif", "Courier New, monospace", "Trebuchet MS, sans-serif", "Verdana, sans-serif"];

function Text({ label, value, onChange, area = false }: { label: string; value: string; onChange: (value: string) => void; area?: boolean }) {
  return <label>{label}{area ? <textarea value={value} onChange={(event) => onChange(event.target.value)}/> : <input value={value} onChange={(event) => onChange(event.target.value)}/>}</label>;
}

function Color({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const safe = /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";
  return <label>{label}<span className="builder-color"><input type="color" value={safe} onChange={(event) => onChange(event.target.value)}/><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="#000000 or CSS color"/></span></label>;
}

function Media({ label, value, onChange, onUpload }: { label: string; value: string; onChange: (value: string) => void; onUpload: Props["onUpload"] }) {
  return <label>{label}<span className="builder-media-field"><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="/media/image.jpg or URL"/><button type="button" onClick={() => onUpload(onChange)} aria-label={`Upload ${label}`}><Upload size={14}/></button></span></label>;
}

export function SiteDesignInspector({ settings, target, onChange, onUpload, onReset }: Props) {
  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => onChange({ ...settings, [key]: value });
  const group = <K extends keyof SiteSettings>(key: K, field: string, value: unknown) => set(key, { ...(settings[key] as object), [field]: value } as SiteSettings[K]);
  if (target !== "global") {
    const page = settings.pages[target];
    const pageSet = <K extends keyof PageDesign>(key: K, value: PageDesign[K]) => onChange({ ...settings, pages: { ...settings.pages, [target]: { ...page, [key]: value } } });
    const copy = (key: string, value: string) => pageSet("copy", { ...page.copy, [key]: value });
    return <><div className="builder-inspector-head"><div><small>Page design</small><strong>{target[0].toUpperCase()+target.slice(1)}</strong></div></div><div className="builder-fields">
      <p className="builder-field-note">Everything here controls the live page. Publish design when you are ready.</p>
      <Text label="Hero eyebrow / kicker" value={page.kicker} onChange={(value) => pageSet("kicker", value)}/>
      <Text label="Hero title" value={page.title} onChange={(value) => pageSet("title", value)} area/>
      <Text label="Hero introduction" value={page.intro} onChange={(value) => pageSet("intro", value)} area/>
      <Media label="Hero image" value={page.heroImage} onChange={(value) => pageSet("heroImage", value)} onUpload={onUpload}/>
      <Text label="Hero image description" value={page.heroAlt} onChange={(value) => pageSet("heroAlt", value)}/>
      <label>Hero image position<select value={page.heroPosition} onChange={(event) => pageSet("heroPosition", event.target.value)}><option>center</option><option>top</option><option>bottom</option><option>left</option><option>right</option></select></label>
      <label>Hero height — {page.heroHeight}vh<input type="range" min="35" max="120" value={page.heroHeight} onChange={(event) => pageSet("heroHeight", Number(event.target.value))}/></label>
      <label>Image darkness — {page.overlayStrength}%<input type="range" min="0" max="100" value={page.overlayStrength} onChange={(event) => pageSet("overlayStrength", Number(event.target.value))}/></label>
      <Color label="Page background" value={page.backgroundColor} onChange={(value) => pageSet("backgroundColor", value)}/>
      <Media label="Page background image" value={page.backgroundImage} onChange={(value) => pageSet("backgroundImage", value)} onUpload={onUpload}/>
      <Color label="Page text" value={page.textColor} onChange={(value) => pageSet("textColor", value)}/>
      {target === "home" && <div className="builder-type-fields wide"><Text label="Statement" value={page.copy.statement || ""} onChange={(value) => copy("statement", value)} area/><Text label="About title" value={page.copy.aboutTitle || ""} onChange={(value) => copy("aboutTitle", value)}/><Text label="About paragraph" value={page.copy.aboutBody || ""} onChange={(value) => copy("aboutBody", value)} area/><Text label="Final callout" value={page.copy.finalTitle || ""} onChange={(value) => copy("finalTitle", value)}/></div>}
      {target !== "home" && <div className="builder-field-group"><strong>Page sections</strong><Text label="Section heading" value={page.copy.sectionHeading || ""} onChange={(value) => copy("sectionHeading", value)}/><Text label="Section text" value={page.copy.sectionBody || ""} onChange={(value) => copy("sectionBody", value)} area/><Text label="Second heading" value={page.copy.secondHeading || ""} onChange={(value) => copy("secondHeading", value)}/><Text label="Second section text" value={page.copy.secondBody || ""} onChange={(value) => copy("secondBody", value)} area/><Text label="Final heading" value={page.copy.finalHeading || ""} onChange={(value) => copy("finalHeading", value)}/><Text label="Final text / callout" value={page.copy.finalBody || ""} onChange={(value) => copy("finalBody", value)} area/></div>}
    </div></>;
  }
  return <><div className="builder-inspector-head"><div><small>Entire website</small><strong>Global design</strong></div><button type="button" onClick={onReset} title="Reset all design fields"><RotateCcw size={16}/></button></div><div className="builder-fields">
    <p className="builder-field-note">Brand, navigation, fonts, colors and spacing apply across every public page.</p>
    <div className="builder-field-group"><strong>Identity</strong><Text label="Brand name" value={settings.brandName} onChange={(value) => set("brandName", value)}/><Text label="Short name" value={settings.shortName} onChange={(value) => set("shortName", value)}/><Text label="Tagline" value={settings.tagline} onChange={(value) => set("tagline", value)}/><Media label="Logo" value={settings.logo} onChange={(value) => set("logo", value)} onUpload={onUpload}/><Text label="Location" value={settings.location} onChange={(value) => set("location", value)}/><Text label="Email" value={settings.email} onChange={(value) => set("email", value)}/></div>
    <div className="builder-field-group"><strong>Navigation & action</strong>{(["work","about","services","contact"] as const).map((key) => <Text key={key} label={`${key} label`} value={settings.navLabels[key]} onChange={(value) => group("navLabels", key, value)}/>)}<Text label="Action button label" value={settings.projectButtonLabel} onChange={(value) => set("projectButtonLabel", value)}/><Text label="Action button URL" value={settings.projectButtonUrl} onChange={(value) => set("projectButtonUrl", value)}/></div>
    <div className="builder-field-group"><strong>Colors</strong>{(["background","surface","text","muted","accent","light","header","footer"] as const).map((key) => <Color key={key} label={key} value={settings.colors[key]} onChange={(value) => group("colors", key, value)}/>)}</div>
    <div className="builder-field-group"><strong>Typography</strong><label>Body font<select value={settings.typography.body} onChange={(event) => group("typography", "body", event.target.value)}>{fontChoices.map((font) => <option key={font}>{font}</option>)}</select></label><label>Heading font<select value={settings.typography.heading} onChange={(event) => group("typography", "heading", event.target.value)}>{fontChoices.map((font) => <option key={font}>{font}</option>)}</select></label><label>Base text size — {settings.typography.baseSize}px<input type="range" min="12" max="24" value={settings.typography.baseSize} onChange={(event) => group("typography", "baseSize", Number(event.target.value))}/></label><label>Heading weight — {settings.typography.headingWeight}<input type="range" min="200" max="900" step="50" value={settings.typography.headingWeight} onChange={(event) => group("typography", "headingWeight", Number(event.target.value))}/></label></div>
    <div className="builder-field-group"><strong>Layout</strong><label>Content width — {settings.layout.maxWidth}px<input type="range" min="900" max="2000" step="10" value={settings.layout.maxWidth} onChange={(event) => group("layout", "maxWidth", Number(event.target.value))}/></label><label>Corner radius — {settings.layout.radius}px<input type="range" min="0" max="60" value={settings.layout.radius} onChange={(event) => group("layout", "radius", Number(event.target.value))}/></label><label>Section spacing — {settings.layout.sectionSpacing}px<input type="range" min="32" max="220" value={settings.layout.sectionSpacing} onChange={(event) => group("layout", "sectionSpacing", Number(event.target.value))}/></label></div>
    <div className="builder-field-group"><strong>Social links</strong>{(["youtube","instagram","tiktok"] as const).map((key) => <Text key={key} label={key} value={settings.social[key]} onChange={(value) => group("social", key, value)}/>)}</div>
    <div className="builder-field-group"><strong>Advanced appearance</strong><label>Custom CSS<textarea className="builder-code" value={settings.customCss} onChange={(event) => set("customCss", event.target.value)} placeholder=".site-shell .hero h1 { letter-spacing: -0.08em; }"/></label><p className="builder-field-note">Custom CSS gives you unrestricted visual control. Invalid CSS can affect the public layout, so preview before publishing.</p></div>
  </div></>;
}

export function SiteDesignPreview({ settings, pageKey }: { settings: SiteSettings; pageKey: SitePageKey }) {
  const page = settings.pages[pageKey];
  const safeImage = page.heroImage.replace(/["\\]/g, "");
  return <div className="builder-site-preview" style={{ backgroundColor: page.backgroundColor, color: page.textColor, fontFamily: settings.typography.body, fontSize: settings.typography.baseSize }}><header style={{ background: settings.colors.header }}><strong>{settings.brandName}</strong><span>{settings.navLabels.work}　{settings.navLabels.about}　{settings.navLabels.services}　{settings.navLabels.contact}</span></header><section style={{ minHeight: `${Math.max(45, page.heroHeight * .72)}vh`, backgroundImage: `linear-gradient(rgba(0,0,0,${page.overlayStrength/100}),rgba(0,0,0,${page.overlayStrength/100})),url("${safeImage}")`, backgroundPosition: page.heroPosition }}><div><small style={{ color: settings.colors.accent }}>{page.kicker}</small><h1 style={{ fontFamily: settings.typography.heading, fontWeight: settings.typography.headingWeight }}>{page.title}</h1><p>{page.intro}</p><button style={{ background: settings.colors.light, borderRadius: settings.layout.radius }}>{settings.projectButtonLabel}</button></div></section><article style={{ maxWidth: settings.layout.maxWidth }}><small style={{ color: settings.colors.accent }}>LIVE DESIGN PREVIEW</small><h2 style={{ fontFamily: settings.typography.heading, fontWeight: settings.typography.headingWeight }}>{page.copy.statement || page.copy.aboutTitle || settings.tagline}</h2><p>This canvas previews the page’s identity, hero, colors, fonts, width, spacing and button style. Publish design to update the public website.</p></article></div>;
}

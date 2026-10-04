export type SitePageKey = "home" | "work" | "about" | "services" | "journal" | "contact";

export type ElementStyles = Record<string, string>;
export type ElementOverride = { id: string; path: string; selector: string; tag: string; text?: string; src?: string; href?: string; alt?: string; hidden?: boolean; styles: ElementStyles };
export type CustomElement = { id: string; path: string; type: "text" | "heading" | "image" | "button" | "divider" | "spacer"; content: string; src: string; href: string; order: number; styles: ElementStyles };

export type PageDesign = {
  kicker: string;
  title: string;
  intro: string;
  heroImage: string;
  heroAlt: string;
  heroHeight: number;
  heroPosition: string;
  overlayStrength: number;
  backgroundColor: string;
  backgroundImage: string;
  textColor: string;
  copy: Record<string, string>;
};

export type SiteSettings = {
  brandName: string;
  shortName: string;
  tagline: string;
  logo: string;
  location: string;
  email: string;
  projectButtonLabel: string;
  projectButtonUrl: string;
  navLabels: Record<"work" | "about" | "services" | "contact", string>;
  social: Record<"youtube" | "instagram" | "tiktok", string>;
  colors: {
    background: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
    light: string;
    header: string;
    footer: string;
  };
  typography: {
    body: string;
    heading: string;
    baseSize: number;
    headingWeight: number;
  };
  layout: {
    maxWidth: number;
    radius: number;
    sectionSpacing: number;
  };
  pages: Record<SitePageKey, PageDesign>;
  elementOverrides: ElementOverride[];
  customElements: CustomElement[];
  customCss: string;
};

const page = (values: Partial<PageDesign>): PageDesign => ({
  kicker: "B28 Entertainment",
  title: "",
  intro: "",
  heroImage: "/media/b28-hero.png",
  heroAlt: "B28 Entertainment",
  heroHeight: 78,
  heroPosition: "center",
  overlayStrength: 72,
  backgroundColor: "#080909",
  backgroundImage: "",
  textColor: "#ece9e1",
  copy: {},
  ...values,
});

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brandName: "B28 Entertainment",
  shortName: "B28",
  tagline: "Entertainment made, simply for you.",
  logo: "/media/b28-logo.jpg",
  location: "Nairobi, Kenya",
  email: "b28entertainment@gmail.com",
  projectButtonLabel: "Start a project",
  projectButtonUrl: "mailto:b28entertainment@gmail.com",
  navLabels: { work: "Projects", about: "About", services: "Services", contact: "Contact" },
  social: {
    youtube: "https://www.youtube.com/@officialb28entertainment",
    instagram: "https://www.instagram.com/b28entertainment/",
    tiktok: "https://www.tiktok.com/@b28entertainment",
  },
  colors: { background: "#080909", surface: "#171919", text: "#ece9e1", muted: "#9b9b94", accent: "#d99042", light: "#ece9e1", header: "transparent", footer: "#080909" },
  typography: { body: "Helvetica Neue, Arial, sans-serif", heading: "Helvetica Neue, Arial, sans-serif", baseSize: 16, headingWeight: 520 },
  layout: { maxWidth: 1380, radius: 4, sectionSpacing: 100 },
  pages: {
    home: page({ kicker: "Nairobi, Kenya · Original Kenyan films", title: "Entertainment made, simply for you.", intro: "B28 Entertainment creates short films about love, faith, family, youth, mental health and the realities people carry.", heroHeight: 100, copy: { statement: "Kenyan stories about the choices, pressures and connections that shape us.", aboutTitle: "Entertainment made, simply for you.", aboutBody: "B28 Entertainment creates original Kenyan short films rooted in contemporary relationships, family, youth and mental health.", finalTitle: "Entertainment made, simply for you." } }),
    work: page({ kicker: "B28 / The archive", title: "Projects", intro: "Original Kenyan short films exploring relationships, family, youth, mental health and the realities carried in silence.", heroImage: "/media/threshold.jpg", heroAlt: "A cinematic frame from Threshold" }),
    about: page({ kicker: "B28 / About", title: "Entertainment made, simply for you.", intro: "B28 Entertainment is a Kenyan film studio creating short dramas rooted in contemporary life, relationships and the pressures people carry.", heroAlt: "A cinematic view across Nairobi at sunset", copy: { sectionHeading: "Who we are", sectionBody: "B28 Entertainment creates original Kenyan films for audiences at home and beyond. Our catalogue moves through love, faith, family, youth and mental health with an eye for the human story inside each subject.", secondHeading: "Our stories", secondBody: "Our work centres intimate choices and the realities that shape everyday life.", finalHeading: "Our promise", finalBody: "Entertainment made, simply for you." } }),
    services: page({ kicker: "B28 / Capabilities", title: "Services", intro: "Original film production and focused short-form storytelling from B28 Entertainment.", heroImage: "/media/fragile-hearts.jpg", heroAlt: "A B28 Entertainment production" }),
    journal: page({ kicker: "B28 / Journal", title: "From the work", intro: "Production diaries, field notes, company news and conversations with the people behind the frame.", heroImage: "/media/shattered.jpg", heroAlt: "A cinematic B28 Entertainment frame" }),
    contact: page({ kicker: "B28 / Contact", title: "Let’s create something.", intro: "Tell us what you are making, where you are in the process and what you need next.", heroImage: "/media/after-rain.png", heroAlt: "A cinematic rainy-night journey through Nairobi" }),
  },
  elementOverrides: [],
  customElements: [],
  customCss: "",
};

function text(value: unknown, fallback: string, maximum = 5_000) {
  return typeof value === "string" ? value.slice(0, maximum) : fallback;
}

function number(value: unknown, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}

export function normalizeSiteSettings(input?: Partial<SiteSettings> | null): SiteSettings {
  const source = input || {};
  const elementOverrides = Array.isArray(source.elementOverrides) ? source.elementOverrides.slice(0, 2_000).map((entry, index) => ({ id: text(entry?.id, `element-${index}`, 120), path: text(entry?.path, "/", 300), selector: text(entry?.selector, "", 1_000), tag: text(entry?.tag, "div", 30), text: entry?.text === undefined ? undefined : text(entry.text, "", 20_000), src: entry?.src === undefined ? undefined : text(entry.src, "", 2_000), href: entry?.href === undefined ? undefined : text(entry.href, "", 2_000), alt: entry?.alt === undefined ? undefined : text(entry.alt, "", 1_000), hidden: Boolean(entry?.hidden), styles: Object.fromEntries(Object.entries(entry?.styles || {}).slice(0, 100).map(([key, value]) => [text(key, "", 80), text(value, "", 500)])) })) : [];
  const customElements = Array.isArray(source.customElements) ? source.customElements.slice(0, 1_000).map((entry, index) => ({ id: text(entry?.id, `custom-${index}`, 120), path: text(entry?.path, "/", 300), type: (["text", "heading", "image", "button", "divider", "spacer"] as const).includes(entry?.type as never) ? entry.type : "text", content: text(entry?.content, "", 20_000), src: text(entry?.src, "", 2_000), href: text(entry?.href, "", 2_000), order: number(entry?.order, index, 0, 10_000), styles: Object.fromEntries(Object.entries(entry?.styles || {}).slice(0, 100).map(([key, value]) => [text(key, "", 80), text(value, "", 500)])) })) : [];
  const pages = {} as Record<SitePageKey, PageDesign>;
  for (const key of Object.keys(DEFAULT_SITE_SETTINGS.pages) as SitePageKey[]) {
    const fallback = DEFAULT_SITE_SETTINGS.pages[key];
    const candidate = source.pages?.[key];
    pages[key] = {
      ...fallback,
      ...candidate,
      kicker: text(candidate?.kicker, fallback.kicker, 200),
      title: text(candidate?.title, fallback.title, 300),
      intro: text(candidate?.intro, fallback.intro, 2_000),
      heroImage: text(candidate?.heroImage, fallback.heroImage, 500),
      heroAlt: text(candidate?.heroAlt, fallback.heroAlt, 300),
      heroPosition: text(candidate?.heroPosition, fallback.heroPosition, 50),
      heroHeight: number(candidate?.heroHeight, fallback.heroHeight, 35, 120),
      overlayStrength: number(candidate?.overlayStrength, fallback.overlayStrength, 0, 100),
      backgroundColor: text(candidate?.backgroundColor, fallback.backgroundColor, 40),
      backgroundImage: text(candidate?.backgroundImage, fallback.backgroundImage, 500),
      textColor: text(candidate?.textColor, fallback.textColor, 40),
      copy: { ...fallback.copy, ...(candidate?.copy || {}) },
    };
  }
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...source,
    brandName: text(source.brandName, DEFAULT_SITE_SETTINGS.brandName, 120),
    shortName: text(source.shortName, DEFAULT_SITE_SETTINGS.shortName, 40),
    tagline: text(source.tagline, DEFAULT_SITE_SETTINGS.tagline, 300),
    logo: text(source.logo, DEFAULT_SITE_SETTINGS.logo, 500),
    location: text(source.location, DEFAULT_SITE_SETTINGS.location, 200),
    email: text(source.email, DEFAULT_SITE_SETTINGS.email, 200),
    projectButtonLabel: text(source.projectButtonLabel, DEFAULT_SITE_SETTINGS.projectButtonLabel, 80),
    projectButtonUrl: text(source.projectButtonUrl, DEFAULT_SITE_SETTINGS.projectButtonUrl, 500),
    navLabels: { ...DEFAULT_SITE_SETTINGS.navLabels, ...(source.navLabels || {}) },
    social: { ...DEFAULT_SITE_SETTINGS.social, ...(source.social || {}) },
    colors: { ...DEFAULT_SITE_SETTINGS.colors, ...(source.colors || {}) },
    typography: {
      ...DEFAULT_SITE_SETTINGS.typography,
      ...(source.typography || {}),
      baseSize: number(source.typography?.baseSize, DEFAULT_SITE_SETTINGS.typography.baseSize, 12, 24),
      headingWeight: number(source.typography?.headingWeight, DEFAULT_SITE_SETTINGS.typography.headingWeight, 200, 900),
    },
    layout: {
      ...DEFAULT_SITE_SETTINGS.layout,
      ...(source.layout || {}),
      maxWidth: number(source.layout?.maxWidth, DEFAULT_SITE_SETTINGS.layout.maxWidth, 900, 2_000),
      radius: number(source.layout?.radius, DEFAULT_SITE_SETTINGS.layout.radius, 0, 60),
      sectionSpacing: number(source.layout?.sectionSpacing, DEFAULT_SITE_SETTINGS.layout.sectionSpacing, 32, 220),
    },
    pages,
    elementOverrides,
    customElements,
    customCss: text(source.customCss, "", 50_000).replace(/[<>]/g, ""),
  };
}

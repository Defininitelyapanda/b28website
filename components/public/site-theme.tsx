import type { CSSProperties, ReactNode } from "react";
import type { PageDesign, SiteSettings } from "@/lib/site-settings";

export function SiteTheme({ settings, page, children }: { settings: SiteSettings; page?: PageDesign; children: ReactNode }) {
  const variables = {
    "--ink": settings.colors.background,
    "--coal": settings.colors.surface,
    "--panel": settings.colors.surface,
    "--paper": settings.colors.text,
    "--muted": settings.colors.muted,
    "--amber": settings.colors.accent,
    "--site-light": settings.colors.light,
    "--site-header": settings.colors.header,
    "--site-footer": settings.colors.footer,
    "--site-max": `${settings.layout.maxWidth}px`,
    "--site-radius": `${settings.layout.radius}px`,
    "--section-space": `${settings.layout.sectionSpacing}px`,
    "--body-font": settings.typography.body,
    "--heading-font": settings.typography.heading,
    "--heading-weight": settings.typography.headingWeight,
    fontSize: `${settings.typography.baseSize}px`,
    color: page?.textColor || settings.colors.text,
    backgroundColor: page?.backgroundColor || settings.colors.background,
    backgroundImage: page?.backgroundImage ? `url("${page.backgroundImage.replace(/["\\]/g, "")}")` : undefined,
    backgroundSize: "cover",
    backgroundAttachment: page?.backgroundImage ? "fixed" : undefined,
  } as CSSProperties;
  return <div className="site-shell" style={variables}>
    {settings.customCss ? <style dangerouslySetInnerHTML={{ __html: settings.customCss }}/>: null}
    {children}
  </div>;
}

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "B28 Entertainment — Stories That Stay", template: "%s — B28 Entertainment" },
  description: "B28 Entertainment is a Kenyan production company making emotionally powerful films, documentaries and visual stories.",
  applicationName: "B28 Entertainment", keywords: ["Kenyan film", "film production", "Nairobi production company", "documentary", "B28 Entertainment"],
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: { title: "B28 Entertainment", description: "Stories that stay with you.", type: "website", locale: "en_KE", siteName: "B28 Entertainment" },
  twitter: { card: "summary_large_image", title: "B28 Entertainment", description: "Stories that stay with you." },
};
export const viewport: Viewport = { colorScheme: "dark", themeColor: "#0a0a0a", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }

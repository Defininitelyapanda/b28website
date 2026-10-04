import { Camera, Mail, Music2, Play } from "lucide-react";
import { PageFrame } from "@/components/public/page-frame";
import { ContactForm } from "@/components/public/contact-form";
import { getSiteSettings } from "@/lib/cms";

export const metadata = { title: "Contact", description: "Start a film or visual production with B28 Entertainment." };
export const dynamic = "force-dynamic";

export default async function Contact() {
  const settings = await getSiteSettings();
  return <PageFrame pageKey="contact"
    kicker="B28 / Contact"
    title="Let’s create something."
    intro="Tell us what you are making, where you are in the process and what you need next."
    heroImage="/media/after-rain.png"
    heroImageAlt="A cinematic rainy-night journey through Nairobi"
  >
    <section className="wrap section-pad contact-layout">
      <div className="contact-meta">
        <p className="section-kicker">Contact B28</p>
        <a href={`mailto:${settings.email}`} target="_blank" rel="noreferrer"><Mail size={20}/> {settings.email}</a>
        <a href={settings.social.youtube} target="_blank" rel="noreferrer"><Play size={20}/> YouTube</a>
        <a href={settings.social.instagram} target="_blank" rel="noreferrer"><Camera size={20}/> Instagram</a>
        <a href={settings.social.tiktok} target="_blank" rel="noreferrer"><Music2 size={20}/> TikTok</a>
        <p>{settings.location}</p>
      </div>
      <ContactForm/>
    </section>
  </PageFrame>;
}

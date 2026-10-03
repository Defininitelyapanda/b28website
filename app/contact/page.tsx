import { Camera, Mail, Music2, Play } from "lucide-react";
import { PageFrame } from "@/components/public/page-frame";
import { ContactForm } from "@/components/public/contact-form";
import { CONTACT_EMAIL, PROJECT_EMAIL_URL } from "@/lib/contact";

export const metadata = { title: "Contact", description: "Start a film or visual production with B28 Entertainment." };

export default function Contact() {
  return <PageFrame
    kicker="B28 / Contact"
    title="Let’s create something."
    intro="Tell us what you are making, where you are in the process and what you need next."
    heroImage="/media/after-rain.png"
    heroImageAlt="A cinematic rainy-night journey through Nairobi"
  >
    <section className="wrap section-pad contact-layout">
      <div className="contact-meta">
        <p className="section-kicker">Contact B28</p>
        <a href={PROJECT_EMAIL_URL} target="_blank" rel="noreferrer"><Mail size={20}/> {CONTACT_EMAIL}</a>
        <a href="https://www.youtube.com/@officialb28entertainment" target="_blank" rel="noreferrer"><Play size={20}/> YouTube</a>
        <a href="https://www.instagram.com/b28entertainment/" target="_blank" rel="noreferrer"><Camera size={20}/> Instagram</a>
        <a href="https://www.tiktok.com/@b28entertainment" target="_blank" rel="noreferrer"><Music2 size={20}/> TikTok</a>
        <p>Nairobi, Kenya</p>
      </div>
      <ContactForm/>
    </section>
  </PageFrame>;
}

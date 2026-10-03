import Image from "next/image";
import { PageFrame } from "@/components/public/page-frame";

export const metadata = { title: "About", description: "B28 Entertainment — entertainment made, simply for you." };
export default function About() {
  return <PageFrame kicker="B28 / About" title="Entertainment made, simply for you." intro="B28 Entertainment is a Kenyan film studio creating short dramas rooted in contemporary life, relationships and the pressures people carry.">
    <section className="wrap section-pad prose-page"><div className="about-logo"><Image src="/media/b28-logo.jpg" alt="B28 Entertainment official logo" width={900} height={900}/></div><h2>Who we are</h2><p>B28 Entertainment creates original Kenyan films for audiences at home and beyond. Our catalogue moves through love, faith, family, youth and mental health with an eye for the human story inside each subject.</p><h2>Our stories</h2><p>From <em>Fragile Hearts</em> and <em>Kiza</em> to <em>Please Call Me</em>, <em>Betrayed</em>, <em>Shattered</em> and <em>Threshold</em>, our work centres intimate choices and the realities that shape everyday life.</p><h2>Our promise</h2><p>Entertainment made, simply for you.</p></section>
  </PageFrame>;
}

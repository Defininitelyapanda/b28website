import { PageFrame } from "@/components/public/page-frame";
import { ContactForm } from "@/components/public/contact-form";
export const metadata={title:"Contact",description:"Start a film, documentary or visual production with B28 Entertainment."};
export default function Contact(){return <PageFrame kicker="B28 / Contact" title="Let’s create something." intro="Tell us what you are making, where you are in the process and what you need next."><section className="wrap section-pad contact-layout"><div className="contact-meta"><p className="section-kicker">Direct</p><a href="mailto:hello@b28entertainment.com">hello@b28entertainment.com</a><p>Nairobi, Kenya<br/>Available for productions across Africa and beyond.</p></div><ContactForm/></section></PageFrame>}

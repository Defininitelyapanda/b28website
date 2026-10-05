import { ensureSeedData, getSiteSettings, listContent } from "@/lib/cms";
import { ServicesView } from "@/components/public/services-view";
export const metadata = { title: "Services", description: "Development, production and post-production services from B28 Entertainment." };
export const dynamic = "force-dynamic";

export default async function Services() {
  await ensureSeedData();
  const [services, settings] = await Promise.all([listContent("service"), getSiteSettings()]);
  return <ServicesView services={services} settings={settings}/>;
}

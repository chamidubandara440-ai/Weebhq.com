import AnimeBrowseCatalog from "@/components/AnimeBrowseCatalog";

export const metadata = {
  title: "Upcoming Anime — WeebHQ",
  description: "Discover upcoming anime releases coming soon on WeebHQ.",
};

export default function UpcomingAnimePage() {
  return <AnimeBrowseCatalog initialCategory="coming_soon" pageTitle="Coming Soon" />;
}

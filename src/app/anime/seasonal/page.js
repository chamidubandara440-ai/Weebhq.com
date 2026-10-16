import AnimeBrowseCatalog from "@/components/AnimeBrowseCatalog";

export const metadata = {
  title: "Seasonal Anime & Release Calendar — WeebHQ",
  description: "Browse currently airing and upcoming seasonal anime releases on WeebHQ.",
};

export default function SeasonalAnimePage() {
  return (
    <AnimeBrowseCatalog
      initialCategory="currently_airing"
      pageTitle="Seasonal Anime Schedule"
      initialViewMode="calendar"
    />
  );
}

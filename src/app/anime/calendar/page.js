import AnimeBrowseCatalog from "@/components/AnimeBrowseCatalog";

export const metadata = {
  title: "Anime Release Calendar & Monthly Schedule — WeebHQ",
  description: "Track all upcoming anime episodes, movie premiere dates, and seasonal schedules with the WeebHQ interactive Release Calendar.",
};

export default function AnimeCalendarPage() {
  return (
    <AnimeBrowseCatalog
      initialCategory="currently_airing"
      pageTitle="Anime Release Calendar"
      initialViewMode="calendar"
    />
  );
}

import AnimeBrowseCatalog from "@/components/AnimeBrowseCatalog";

export const metadata = {
  title: "Top Rated Anime — WeebHQ",
  description: "Browse the highest rated anime of all time on WeebHQ.",
};

export default function TopAnimePage() {
  return <AnimeBrowseCatalog initialCategory="top_rated" pageTitle="Top Rated Anime" />;
}

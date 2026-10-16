import AnimeBrowseCatalog from "@/components/AnimeBrowseCatalog";

export const metadata = {
  title: "Popular Anime — WeebHQ",
  description: "Explore the most popular anime movies, series, and upcoming releases on WeebHQ.",
};

export default function AnimeSearchPage() {
  return <AnimeBrowseCatalog initialCategory="popular" pageTitle="Popular Anime" />;
}

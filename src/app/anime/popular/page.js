import AnimeBrowseCatalog from "@/components/AnimeBrowseCatalog";

export const metadata = {
  title: "Popular Anime — WeebHQ",
  description: "Explore the most popular anime movies and series on WeebHQ.",
};

export default function PopularAnimePage() {
  return <AnimeBrowseCatalog initialCategory="popular" pageTitle="Popular Anime" />;
}

import AnimeBrowseCatalog from "@/components/AnimeBrowseCatalog";

export const metadata = {
  title: "All Anime Catalog — Complete Anime Database | WeebHQ",
  description: "Explore the comprehensive anime catalog on WeebHQ. Filter by genre, score, popularity, release date, and studio.",
};

export default function AllAnimeCatalogPage() {
  return (
    <AnimeBrowseCatalog
      initialCategory="popular"
      pageTitle="All Anime Catalog"
      initialViewMode="list"
    />
  );
}

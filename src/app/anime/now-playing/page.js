import AnimeBrowseCatalog from "@/components/AnimeBrowseCatalog";

export const metadata = {
  title: "Now Playing Anime — WeebHQ",
  description: "Browse anime in theatres and currently playing on WeebHQ.",
};

export default function NowPlayingAnimePage() {
  return <AnimeBrowseCatalog initialCategory="theatres" pageTitle="In Theatres" />;
}

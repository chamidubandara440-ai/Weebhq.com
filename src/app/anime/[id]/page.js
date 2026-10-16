import ClientAnimeLoader from './ClientAnimeLoader';
import AnimeDetailView from '@/components/AnimeDetailView';

export async function generateStaticParams() {
  const ids = new Set(['1']);
  
  try {
    let offset = 0;
    const limit = 50;
    let hasMore = true;
    
    while (hasMore && offset < 1000) {
      const res = await fetch(`https://weebhq-api.chamidubandara440.workers.dev/api/anime?limit=${limit}&offset=${offset}`);
      if (!res.ok) break;
      
      const json = await res.json();
      const data = json.data || [];
      
      if (data.length === 0) {
        hasMore = false;
      } else {
        data.forEach(a => ids.add(a.id.toString()));
        offset += limit;
        if (data.length < limit) hasMore = false;
      }
    }
  } catch (e) {
    console.error("Failed to fetch ids for static generation", e);
  }

  return [...ids].map((id) => ({ id }));
}

async function fetchAnimeById(id) {
  try {
    const res = await fetch(`https://weebhq-api.chamidubandara440.workers.dev/api/anime/${id}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (!data.error) return data;
    }
  } catch (e) {
    console.error("Error fetching anime data for id:", id, e);
  }
  return null;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const anime = await fetchAnimeById(id);

  if (!anime) {
    return {
      title: 'Anime Details & Overview',
      description: 'Explore comprehensive anime details, ratings, reviews, voice actors, and streaming guides on WeebHQ.',
    };
  }

  const primaryTitle = anime.title_english || anime.title || `Anime #${id}`;
  const year = anime.season_year || (anime.start_date ? anime.start_date.substring(0, 4) : '');
  const yearSuffix = year ? ` (${year})` : '';
  const pageTitle = `${primaryTitle}${yearSuffix} — Overview, Voice Cast, Trailers & Reviews`;

  const synopsisClean = anime.synopsis
    ? anime.synopsis.replace(/\r?\n+/g, ' ').replace(/\[Written by MAL Rewrite\]/gi, '').trim()
    : '';

  const genreNames = Array.isArray(anime.genres)
    ? anime.genres.map(g => (typeof g === 'string' ? g : g.name)).filter(Boolean)
    : [];
  const genreText = genreNames.length > 0 ? ` [${genreNames.slice(0, 3).join(', ')}]` : '';
  const scoreText = anime.score ? `★ ${anime.score}/10` : '';

  const metaDesc = synopsisClean
    ? `${scoreText ? scoreText + ' — ' : ''}${synopsisClean.slice(0, 145)}...`
    : `Explore ${primaryTitle}${genreText} overview, ratings, voice cast, trailers, and reviews on WeebHQ.`;

  const canonicalUrl = `https://weebhq.com/anime/${id}`;
  const imageUrl = anime.banner_url || anime.image_url || 'https://weebhq.com/og-default.jpg';
  const isMovie = (anime.anime_type || '').toLowerCase() === 'movie';

  return {
    title: pageTitle,
    description: metaDesc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: metaDesc,
      url: canonicalUrl,
      siteName: 'WeebHQ',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${primaryTitle} Poster`,
        },
      ],
      type: isMovie ? 'video.movie' : 'video.tv_show',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: metaDesc,
      images: [imageUrl],
    },
    keywords: [
      primaryTitle,
      anime.title,
      anime.title_japanese,
      ...genreNames,
      'anime',
      'anime reviews',
      'watch anime',
      'anime voice actors',
      'anime trailer',
      'WeebHQ',
    ].filter(Boolean),
  };
}

export default async function AnimeDetail({ params }) {
  const { id } = await params;
  const anime = await fetchAnimeById(id);

  if (!anime) return <ClientAnimeLoader id={id} />;

  const primaryTitle = anime.title_english || anime.title || `Anime #${id}`;
  const isMovie = (anime.anime_type || '').toLowerCase() === 'movie';
  const imageUrl = anime.banner_url || anime.image_url || 'https://weebhq.com/og-default.jpg';
  const genreNames = Array.isArray(anime.genres)
    ? anime.genres.map(g => (typeof g === 'string' ? g : g.name)).filter(Boolean)
    : [];

  const synopsisClean = anime.synopsis
    ? anime.synopsis.replace(/\r?\n+/g, ' ').replace(/\[Written by MAL Rewrite\]/gi, '').trim()
    : '';

  // Breadcrumbs JSON-LD
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://weebhq.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Anime Catalog',
        item: 'https://weebhq.com/anime/catalog',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: primaryTitle,
        item: `https://weebhq.com/anime/${id}`,
      },
    ],
  };

  // TVSeries / Movie JSON-LD
  const itemLd = {
    '@context': 'https://schema.org',
    '@type': isMovie ? 'Movie' : 'TVSeries',
    name: primaryTitle,
    alternateName: [anime.title, anime.title_japanese].filter(Boolean),
    description: synopsisClean || `Overview and reviews for ${primaryTitle} on WeebHQ`,
    image: imageUrl,
    url: `https://weebhq.com/anime/${id}`,
    datePublished: anime.start_date || undefined,
    genre: genreNames.length > 0 ? genreNames : undefined,
    ...(anime.score && parseFloat(anime.score) > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: anime.score.toString(),
        bestRating: '10',
        worstRating: '1',
        ratingCount: (anime.members && anime.members > 0) ? anime.members : 100,
      },
    } : {}),
    ...(anime.episodes ? { numberOfEpisodes: anime.episodes } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemLd) }}
      />
      <AnimeDetailView anime={anime} />
    </>
  );
}

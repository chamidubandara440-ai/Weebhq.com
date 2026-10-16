'use client';

import { useEffect, useState } from 'react';
import AnimeDetailView from '@/components/AnimeDetailView';

export default function ClientAnimeLoader({ id }) {
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('https://weebhq-api.chamidubandara440.workers.dev/api/anime/' + id)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(json => {
        if (json && !json.error) {
          setAnime(json);
        } else {
          setError(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="whq-detail-loading-box">
        <div className="whq-loading-spinner" />
        <p>Loading Anime Details...</p>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="whq-detail-error-box">
        <h2>Anime Not Found</h2>
        <p>We couldn&apos;t find this anime in the database.</p>
        <a href="/anime/search" className="whq-btn-primary">Search Catalog</a>
      </div>
    );
  }

  return <AnimeDetailView anime={anime} />;
}
import { useState, useEffect } from 'react';

export const useAnimeDetail = (id) => {
  const [movie, setMovie] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Detail & Episodes in parallel
        const [detailRes, episodesRes] = await Promise.all([
          fetch(`https://animein.vercel.app/api/anime/${id}`),
          fetch(`https://animein.vercel.app/api/anime/${id}/episodes`)
        ]);

        if (!detailRes.ok || !episodesRes.ok) {
          throw new Error('Gagal mengambil data anime');
        }

        const detailData = await detailRes.json();
        const episodesData = await episodesRes.json();

        setMovie(detailData.movie);
        // Endpoint episodes mengembalikan array object { episodes: [...] } atau langsung array?
        // Mari kita asumsikan strukturnya nanti, tapi biasanya API ini konsisten. 
        // Jika responsenya { episodes: [...] }, ambil propertinya. Jika array langsung, ambil langsung.
        // Kita akan cek struktur episodesData nanti, untuk aman sementara kita simpan raw dulu.
        setEpisodes(episodesData.episodes || episodesData); 

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { movie, episodes, loading, error };
};

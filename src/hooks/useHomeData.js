import { useState, useEffect } from 'react';

export const useHomeData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const CACHE_KEY = 'home_data';
      const CACHE_EXPIRY = 30 * 60 * 1000; // 30 Menit

      // 1. Cek Cache
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
          try {
              const { data, timestamp } = JSON.parse(cached);
              if (Date.now() - timestamp < CACHE_EXPIRY) {
                  setData(data);
                  setLoading(false);
                  return;
              }
          } catch (e) {
              console.error("Cache parsing error", e);
              localStorage.removeItem(CACHE_KEY);
          }
      }

      // 2. Fetch API
      try {
        const response = await fetch('https://animein.vercel.app/api/home');
        if (!response.ok) {
          throw new Error('Gagal mengambil data');
        }
        const result = await response.json();
        
        // Simpan Cache
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: result,
            timestamp: Date.now()
        }));

        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

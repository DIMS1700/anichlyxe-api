import { useState, useEffect } from 'react';

export const useStreamData = (id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataId, setDataId] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setData(null); // Reset data saat ganti ID
      setDataId(null);
      setError(null);
      try {
        const response = await fetch(`https://animein.vercel.app/api/stream/${id}`);
        if (!response.ok) {
          throw new Error('Gagal mengambil data stream');
        }
        const result = await response.json();
        setData(result);
        setDataId(id);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { data, loading, error, dataId };
};

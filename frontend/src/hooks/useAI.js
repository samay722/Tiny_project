import { useState, useCallback } from 'react';

export function useAI(apiFn) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const run = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args);
      setData(result);
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Request failed';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  const reset = () => { setData(null); setError(null); };

  return { data, loading, error, run, reset };
}
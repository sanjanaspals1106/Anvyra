import { useCallback, useEffect, useState } from 'react';
import api, { errorText } from './api';

// Loads data from the API. Returns { data, loading, error, reload }.
export function useFetch(url, { skip = false } = {}) {
  const [state, setState] = useState({ data: null, loading: !skip, error: '' });
  const load = useCallback(async () => {
    if (!url || skip) return;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const res = await api.get(url);
      setState({ data: res.data, loading: false, error: '' });
    } catch (err) {
      setState({ data: null, loading: false, error: errorText(err) });
    }
  }, [url, skip]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}

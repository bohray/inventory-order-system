import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

// Run an async fetcher on mount, tracking data/loading/error and exposing a
// manual reload(). Shows a toast on failure. `deps` re-creates the fetch when
// they change (pass a stable fetcher or memoize it).
export function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableFetcher = useCallback(fetcher, deps);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await stableFetcher());
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [stableFetcher]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}

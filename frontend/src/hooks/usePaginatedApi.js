import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { DEFAULT_PAGE_SIZE } from "../constants/app-data.js";

// Manage page/pageSize state for a paginated endpoint.
// `fetcher` is ({ page, pageSize }) => Promise<{items,total,page,page_size,pages}>.
export function usePaginatedApi(fetcher, initialPageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetcher({ page, pageSize });
      setItems(res.items);
      setTotal(res.total);
      setPages(res.pages);
      // If the requested page is now beyond the last page (e.g. after deleting
      // the last row on a page), step back so the user isn't stranded on empty.
      if (res.pages > 0 && page > res.pages) {
        setPage(res.pages);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  function setPageSize(size) {
    setPageSizeState(size);
    setPage(1); // a different page size invalidates the current page index
  }

  return {
    items,
    total,
    pages,
    page,
    pageSize,
    loading,
    setPage,
    setPageSize,
    reload: load,
  };
}

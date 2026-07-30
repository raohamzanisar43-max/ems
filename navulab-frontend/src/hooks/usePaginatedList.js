import { useCallback, useEffect, useState } from "react";
import api from "../api/client";

/**
 * Backend paginates every list endpoint 10-per-page (DRF PageNumberPagination).
 * This hook wraps the page/next/previous bookkeeping so list pages don't each
 * reimplement it.
 */
export function usePaginatedList(endpoint, errorMessage = "Couldn't load that data.") {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const goToPage = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(endpoint, { params: { page: pageNum } });
        const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        setItems(list);
        setCount(typeof data?.count === "number" ? data.count : list.length);
        setHasNext(Boolean(data?.next));
        setHasPrevious(Boolean(data?.previous));
        setPage(pageNum);
      } catch {
        setItems([]);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [endpoint, errorMessage]
  );

  const reload = useCallback(() => goToPage(page), [goToPage, page]);

  useEffect(() => {
    goToPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  return { items, page, count, hasNext, hasPrevious, loading, error, setError, goToPage, reload };
}

import { useState } from "react";
import { tablePage } from "@/lib/tableNavigation";

export function useTableNavigation<T>(rows: readonly T[], filterKey = "") {
  const [state, setState] = useState({ page: 1, pageSize: 10, filterKey });
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const result = tablePage(rows, state.filterKey === filterKey ? state.page : 1, state.pageSize);
  return {
    ...result,
    pageSize: state.pageSize,
    density,
    setDensity,
    setPage: (page: number) => setState({ ...state, page, filterKey }),
    setPageSize: (pageSize: number) => setState({ page: 1, pageSize, filterKey }),
  };
}
export function tablePage<T>(rows: readonly T[], requestedPage: number, pageSize: number) {
  const size = Math.max(1, Math.floor(pageSize) || 10);
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const page = Math.min(pageCount, Math.max(1, Math.floor(requestedPage) || 1));
  const offset = (page - 1) * size;
  return {
    page,
    pageCount,
    total: rows.length,
    start: rows.length ? offset + 1 : 0,
    end: Math.min(offset + size, rows.length),
    visibleRows: rows.slice(offset, offset + size),
  };
}
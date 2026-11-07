import { useRef, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ChevronsLeft, ChevronsRight, Rows3, AlignJustify } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { useTableNavigation } from "@/hooks/useTableNavigation";

type Navigation = Omit<ReturnType<typeof useTableNavigation>, "visibleRows">;

export function DashboardTable({ navigation: nav, children, label = "Records" }: {
  navigation: Navigation;
  children: ReactNode;
  label?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const changePage = (page: number) => {
    nav.setPage(page);
    scrollRef.current?.scrollTo({ top: 0 });
  };
  return (
    <section className="dashboard-table min-w-0 max-w-full" data-density={nav.density} aria-label={label}>
      <div className="table-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 print:hidden">
        <span className="text-sm font-semibold text-foreground">{label} <span className="ml-2 font-normal tabular-nums text-muted-foreground">{nav.total}</span></span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border-r border-border pr-3" role="group" aria-label="Row spacing">
            <Button type="button" variant={nav.density === "comfortable" ? "secondary" : "ghost"} size="icon" aria-label="Comfortable rows" title="Comfortable rows" aria-pressed={nav.density === "comfortable"} onClick={() => nav.setDensity("comfortable")}><Rows3 /></Button>
            <Button type="button" variant={nav.density === "compact" ? "secondary" : "ghost"} size="icon" aria-label="Compact rows" title="Compact rows" aria-pressed={nav.density === "compact"} onClick={() => nav.setDensity("compact")}><AlignJustify /></Button>
          </div>
          <Select value={String(nav.pageSize)} onValueChange={value => nav.setPageSize(Number(value))}>
            <SelectTrigger className="h-10 w-[112px] bg-background" aria-label="Rows per page"><SelectValue /></SelectTrigger>
            <SelectContent>{[10, 25, 50, 100].map(size => <SelectItem key={size} value={String(size)}>{size} rows</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div ref={scrollRef} className="dashboard-table-scroll" tabIndex={0} role="region" aria-label={`${label} table`}>{children}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 print:hidden">
        <p className="text-xs tabular-nums text-muted-foreground" aria-live="polite">{nav.start}–{nav.end} of {nav.total} records</p>
        <nav className="flex items-center gap-1" aria-label={`${label} pages`}>
          <Button type="button" variant="ghost" size="icon" disabled={nav.page <= 1} aria-label="First page" title="First page" onClick={() => changePage(1)}><ChevronsLeft /></Button>
          <Button type="button" variant="outline" size="icon" disabled={nav.page <= 1} aria-label="Previous page" title="Previous page" onClick={() => changePage(nav.page - 1)}><ArrowLeft /></Button>
          <span className="min-w-20 px-2 text-center text-xs font-medium tabular-nums">{nav.page} / {nav.pageCount}</span>
          <Button type="button" variant="outline" size="icon" disabled={nav.page >= nav.pageCount} aria-label="Next page" title="Next page" onClick={() => changePage(nav.page + 1)}><ArrowRight /></Button>
          <Button type="button" variant="ghost" size="icon" disabled={nav.page >= nav.pageCount} aria-label="Last page" title="Last page" onClick={() => changePage(nav.pageCount)}><ChevronsRight /></Button>
        </nav>
      </div>
    </section>
  );
}
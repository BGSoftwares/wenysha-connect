import { useState } from "react";
import { Search, BookOpen, Clock, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useBooks, useBorrowBook, useMyBorrowings, useRenewBook, Borrowing } from "@/lib/hooks";
import { getErrorMessage } from "@/lib/api";

const daysLeft = (due: string) =>
  Math.ceil((new Date(due).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);

const DueBadge = ({ loan }: { loan: Borrowing }) => {
  if (loan.status === "Returned") return <Badge variant="secondary">Returned</Badge>;
  const d = daysLeft(loan.due_date);
  if (d < 0) return <Badge variant="destructive">{Math.abs(d)} day{d === -1 ? "" : "s"} overdue</Badge>;
  if (d <= 3) return <Badge className="bg-accent text-accent-foreground">Due in {d} day{d === 1 ? "" : "s"}</Badge>;
  return <Badge variant="outline">Due in {d} days</Badge>;
};

const StudentLibrarySection = () => {
  const [search, setSearch] = useState("");
  const { data: books = [], isLoading } = useBooks({ search: search || undefined });
  const { data: loans = [] } = useMyBorrowings();
  const borrow = useBorrowBook();
  const renew = useRenewBook();

  const active = loans.filter((l) => l.status !== "Returned");
  const history = loans.filter((l) => l.status === "Returned");
  const overdue = active.filter((l) => daysLeft(l.due_date) < 0).length;
  const heldIds = new Set(active.map((l) => l.book));

  const onBorrow = async (id: number, title: string) => {
    try {
      await borrow.mutateAsync(id);
      toast.success(`"${title}" borrowed — due in 14 days`);
    } catch (e) { toast.error(getErrorMessage(e)); }
  };
  const onRenew = async (id: number) => {
    try { await renew.mutateAsync(id); toast.success("Extended by 7 days"); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground">Library</h2>
        <p className="text-sm text-muted-foreground">Search titles, borrow books and keep track of due dates.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "On loan", value: active.length, icon: BookOpen },
          { label: "Overdue", value: overdue, icon: AlertTriangle },
          { label: "Returned", value: history.length, icon: CheckCircle2 },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4 flex items-center gap-3">
            <s.icon className="h-5 w-5 text-primary" />
            <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5" /> My books</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {active.length === 0 && <p className="text-sm text-muted-foreground">You have no books on loan.</p>}
          {active.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-border">
              <div>
                <p className="font-medium">{l.book_title}</p>
                <p className="text-xs text-muted-foreground">Borrowed {l.borrow_date} · Due {l.due_date}</p>
              </div>
              <div className="flex items-center gap-2">
                <DueBadge loan={l} />
                {daysLeft(l.due_date) >= 0 && (
                  <Button size="sm" variant="outline" onClick={() => onRenew(l.id)} disabled={renew.isPending}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Renew
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Find a book</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by title, author or ISBN" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && books.length === 0 && <p className="text-sm text-muted-foreground">No books found.</p>}
          {books.map((b) => (
            <div key={b.id} className="p-4 rounded-lg border border-border flex flex-col gap-2">
              <div className="flex justify-between gap-2">
                <div>
                  <p className="font-medium">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.author}{b.category ? ` · ${b.category}` : ""}</p>
                </div>
                <Badge variant={b.available > 0 ? "outline" : "destructive"}>{b.available}/{b.copies}</Badge>
              </div>
              <Button size="sm" disabled={b.available < 1 || heldIds.has(b.id) || borrow.isPending} onClick={() => onBorrow(b.id, b.title)}>
                {heldIds.has(b.id) ? "Already borrowed" : b.available < 1 ? "Unavailable" : "Borrow"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">History</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {history.map((l) => (
              <div key={l.id} className="flex justify-between text-sm">
                <span>{l.book_title}</span>
                <span className="text-muted-foreground">Returned {l.return_date}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentLibrarySection;

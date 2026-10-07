import { useState } from "react";
import { Plus, Edit, Trash2, Search, Book, BookOpen, Users, Clock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useBooks, useSaveBook, useDeleteBook, useBorrowings, useReturnBook, Book as BookT,
} from "@/lib/hooks";
import { getErrorMessage } from "@/lib/api";

const empty: Partial<BookT> = { title: "", author: "", isbn: "", category: "", copies: 1 };

const LibrarySection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loanFilter, setLoanFilter] = useState("active");
  const [editing, setEditing] = useState<Partial<BookT> | null>(null);

  const { data: books = [], isLoading } = useBooks({ search: searchQuery || undefined });
  const { data: loans = [] } = useBorrowings();
  const save = useSaveBook();
  const del = useDeleteBook();
  const ret = useReturnBook();

  const categories = [...new Set(books.map((b) => b.category).filter(Boolean))] as string[];
  const filteredBooks = books.filter((b) => categoryFilter === "all" || b.category === categoryFilter);
  const filteredLoans = loans.filter((l) =>
    loanFilter === "all" ? true : loanFilter === "active" ? l.status !== "Returned" : l.status === loanFilter
  );

  const stats = [
    { label: "Total copies", value: books.reduce((a, b) => a + b.copies, 0), icon: Book },
    { label: "Available", value: books.reduce((a, b) => a + b.available, 0), icon: BookOpen },
    { label: "On loan", value: loans.filter((l) => l.status === "Borrowed").length, icon: Users },
    { label: "Overdue", value: loans.filter((l) => l.status === "Overdue").length, icon: Clock },
  ];

  const onSave = async () => {
    if (!editing?.title || !editing?.author) return toast.error("Title and author are required");
    try {
      await save.mutateAsync({ ...editing, copies: Number(editing.copies) || 1 });
      toast.success(editing.id ? "Book updated" : "Book added");
      setEditing(null);
    } catch (e) { toast.error(getErrorMessage(e)); }
  };
  const onDelete = async (b: BookT) => {
    if (!confirm(`Delete "${b.title}"?`)) return;
    try { await del.mutateAsync(b.id); toast.success("Book deleted"); } catch (e) { toast.error(getErrorMessage(e)); }
  };
  const onReturn = async (id: number) => {
    try { await ret.mutateAsync(id); toast.success("Book checked in"); } catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Library Management</h2>
          <p className="text-sm text-muted-foreground">Manage book inventory and student borrowings</p>
        </div>
        <Button variant="gold" onClick={() => setEditing({ ...empty })}>
          <Plus className="h-4 w-4 mr-2" /> Add Book
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}><CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><s.icon className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="catalog" className="w-full">
        <TabsList>
          <TabsTrigger value="catalog">Book Catalog</TabsTrigger>
          <TabsTrigger value="borrowings">Borrowings</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search title, author or ISBN" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Card><CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr><th className="p-3">Title</th><th className="p-3">Author</th><th className="p-3">ISBN</th><th className="p-3">Category</th><th className="p-3">Available</th><th className="p-3 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={6} className="p-4 text-muted-foreground">Loading…</td></tr>}
                {!isLoading && filteredBooks.length === 0 && <tr><td colSpan={6} className="p-4 text-muted-foreground">No books yet. Add your first book.</td></tr>}
                {filteredBooks.map((b) => (
                  <tr key={b.id} className="border-t border-border">
                    <td className="p-3 font-medium">{b.title}</td>
                    <td className="p-3">{b.author}</td>
                    <td className="p-3 text-muted-foreground">{b.isbn}</td>
                    <td className="p-3">{b.category}</td>
                    <td className="p-3"><Badge variant={b.available > 0 ? "outline" : "destructive"}>{b.available}/{b.copies}</Badge></td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setEditing(b)}><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => onDelete(b)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="borrowings" className="space-y-4 mt-4">
          <div className="flex gap-2 flex-wrap">
            {["active", "Overdue", "Returned", "all"].map((f) => (
              <Button key={f} size="sm" variant={loanFilter === f ? "default" : "outline"} onClick={() => setLoanFilter(f)}>
                {f === "active" ? "Active" : f === "all" ? "All" : f}
              </Button>
            ))}
          </div>
          <Card><CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr><th className="p-3">Book</th><th className="p-3">Student</th><th className="p-3">Class</th><th className="p-3">Borrowed</th><th className="p-3">Due</th><th className="p-3">Status</th><th className="p-3 text-right">Action</th></tr>
              </thead>
              <tbody>
                {filteredLoans.length === 0 && <tr><td colSpan={7} className="p-4 text-muted-foreground">No borrowings.</td></tr>}
                {filteredLoans.map((l) => (
                  <tr key={l.id} className="border-t border-border">
                    <td className="p-3 font-medium">{l.book_title}</td>
                    <td className="p-3">{l.student_name}</td>
                    <td className="p-3">{l.class_name}</td>
                    <td className="p-3">{l.borrow_date}</td>
                    <td className="p-3">{l.due_date}</td>
                    <td className="p-3">
                      <Badge variant={l.status === "Overdue" ? "destructive" : l.status === "Returned" ? "secondary" : "outline"}>{l.status}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      {l.status !== "Returned" && (
                        <Button size="sm" variant="outline" onClick={() => onReturn(l.id)} disabled={ret.isPending}>
                          <RotateCcw className="h-3 w-3 mr-1" /> Check in
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit book" : "Add book"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3">
              {(["title", "author", "isbn", "category"] as const).map((f) => (
                <div key={f} className="grid gap-1">
                  <Label className="capitalize">{f === "isbn" ? "ISBN" : f}</Label>
                  <Input value={(editing[f] as string) ?? ""} onChange={(e) => setEditing({ ...editing, [f]: e.target.value })} />
                </div>
              ))}
              <div className="grid gap-1">
                <Label>Total copies</Label>
                <Input type="number" min={1} value={editing.copies ?? 1} onChange={(e) => setEditing({ ...editing, copies: Number(e.target.value) })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="gold" onClick={onSave} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LibrarySection;

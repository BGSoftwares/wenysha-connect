import { useState } from "react";
import { Plus, Edit, Trash2, Search, Book, BookOpen, Users, Clock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockBooks = [
  { id: 1, title: "Advanced Mathematics", author: "John Smith", isbn: "978-3-16-148410-0", category: "Mathematics", copies: 15, available: 8 },
  { id: 2, title: "Physics for O Level", author: "David Brown", isbn: "978-1-23-456789-0", category: "Science", copies: 20, available: 12 },
  { id: 3, title: "English Grammar Complete", author: "Jane Wilson", isbn: "978-0-98-765432-1", category: "Languages", copies: 25, available: 20 },
  { id: 4, title: "History of Zimbabwe", author: "Peter Ncube", isbn: "978-2-34-567890-2", category: "History", copies: 10, available: 3 },
  { id: 5, title: "Biology Concepts", author: "Mary Clark", isbn: "978-4-56-789012-3", category: "Science", copies: 18, available: 14 },
  { id: 6, title: "Chemistry Fundamentals", author: "Robert Lee", isbn: "978-5-67-890123-4", category: "Science", copies: 12, available: 7 },
];

const mockBorrowings = [
  { id: 1, book: "Advanced Mathematics", student: "John Moyo", class: "Form 4A", borrowDate: "2024-12-01", dueDate: "2024-12-15", status: "Borrowed" },
  { id: 2, book: "Physics for O Level", student: "Sarah Ndlovu", class: "Form 3B", borrowDate: "2024-11-25", dueDate: "2024-12-09", status: "Overdue" },
  { id: 3, book: "English Grammar Complete", student: "Peter Chikwanda", class: "Form 4A", borrowDate: "2024-12-03", dueDate: "2024-12-17", status: "Borrowed" },
  { id: 4, book: "History of Zimbabwe", student: "Grace Moyo", class: "Form 2B", borrowDate: "2024-11-20", dueDate: "2024-12-04", status: "Returned" },
];

const LibrarySection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = [...new Set(mockBooks.map(book => book.category))];

  const filteredBooks = mockBooks.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || book.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Library Management</h2>
          <p className="text-sm text-muted-foreground">Manage books, borrowings, and library resources</p>
        </div>
        <Button variant="gold">
          <Plus className="h-4 w-4 mr-2" />
          Add Book
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Book className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockBooks.reduce((acc, b) => acc + b.copies, 0)}</p>
                <p className="text-xs text-muted-foreground">Total Books</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <BookOpen className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockBooks.reduce((acc, b) => acc + b.available, 0)}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockBorrowings.filter(b => b.status === "Borrowed").length}</p>
                <p className="text-xs text-muted-foreground">Borrowed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Clock className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockBorrowings.filter(b => b.status === "Overdue").length}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="catalog" className="w-full">
        <TabsList>
          <TabsTrigger value="catalog">Book Catalog</TabsTrigger>
          <TabsTrigger value="borrowings">Borrowings</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4 mt-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Books Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Author</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">ISBN</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Available</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book) => (
                  <tr key={book.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-primary/10">
                          <Book className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{book.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{book.author}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded bg-secondary text-foreground">{book.category}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{book.isbn}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-medium ${book.available > 5 ? 'text-green-600' : book.available > 0 ? 'text-amber-600' : 'text-destructive'}`}>
                        {book.available}/{book.copies}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1 hover:bg-secondary rounded"><Edit className="h-4 w-4 text-muted-foreground" /></button>
                      <button className="p-1 hover:bg-secondary rounded ml-2"><Trash2 className="h-4 w-4 text-destructive" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="borrowings" className="space-y-4 mt-4">
          {/* Borrowings Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Book</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Student</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Class</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Borrow Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Due Date</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockBorrowings.map((borrow) => (
                  <tr key={borrow.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium text-foreground">{borrow.book}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{borrow.student}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{borrow.class}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{borrow.borrowDate}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{borrow.dueDate}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded ${
                        borrow.status === "Borrowed" ? "bg-blue-100 text-blue-700" :
                        borrow.status === "Overdue" ? "bg-red-100 text-red-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {borrow.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {borrow.status !== "Returned" && (
                        <Button variant="outline" size="sm">
                          <RotateCcw className="h-4 w-4 mr-1" /> Return
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LibrarySection;

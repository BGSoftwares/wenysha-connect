import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Book as BookIcon, Search, Library as LibraryIcon, ExternalLink, ArrowRight, Filter, Info, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBooks, useBorrowBook } from "@/lib/hooks";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getStoredUser } from "@/lib/api";

const categories = [
    { name: "Academic Resources", icon: BookIcon },
    { name: "Research Papers", icon: Search },
    { name: "Interactive Media", icon: LibraryIcon },
    { name: "E-Books", icon: ExternalLink },
];

const Library = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
    const [selectedBook, setSelectedBook] = useState<any>(null);
    const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);

    const { data: books, isLoading } = useBooks({ search: searchTerm, category: selectedCategory });
    const borrowMutation = useBorrowBook();
    const user = getStoredUser();

    const handleBorrowRequest = async () => {
        if (!user || user.role !== 'student') {
            toast.error("Only students can borrow books online. Please log in as a student.");
            return;
        }

        try {
            await borrowMutation.mutateAsync({
                book: selectedBook.id,
                student: user.id, // Assuming student ID matches user ID for simplicity if profile exists
                borrow_date: new Date().toISOString().split('T')[0],
                due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days
                status: "Borrowed"
            });
            toast.success("Borrowing request submitted successfully!");
            setIsBorrowModalOpen(false);
        } catch (error) {
            toast.error("Failed to submit borrowing request. Please try again.");
        }
    };

    return (
        <Layout>
            <section className="py-16 bg-forest relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000')] bg-cover bg-center opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/80 to-transparent" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl">
                        <Badge variant="outline" className="text-accent border-accent/30 mb-6 bg-accent/10 px-4 py-1">
                            WENYASHA DIGITAL REPOSITORY
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-heading font-black text-white mb-6 leading-tight">
                            Your Gateway to <span className="text-accent underline decoration-accent/30">Infinite Knowledge.</span>
                        </h1>
                        <p className="text-lg text-white/70 mb-8 max-w-2xl font-light">
                            Search through thousands of curated books, research papers, and interactive media designed to elevate your academic journey.
                        </p>

                        <div className="relative max-w-2xl group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-accent transition-colors" />
                            <Input
                                placeholder="Search by title, author, or ISBN..."
                                className="pl-12 h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-2xl backdrop-blur-md focus:ring-accent/50 focus:border-accent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-12 bg-background">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar Filters */}
                        <aside className="lg:w-64 space-y-8">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                                    <Filter className="h-4 w-4" /> Categories
                                </h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setSelectedCategory(undefined)}
                                        className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-all ${!selectedCategory ? 'bg-accent text-accent-foreground font-bold shadow-md' : 'hover:bg-secondary text-foreground'}`}
                                    >
                                        All Resources
                                    </button>
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.name}
                                            onClick={() => setSelectedCategory(cat.name)}
                                            className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-all ${selectedCategory === cat.name ? 'bg-accent text-accent-foreground font-bold shadow-md' : 'hover:bg-secondary text-foreground'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <cat.icon className="h-4 w-4 opacity-70" />
                                                {cat.name}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl bg-secondary/50 border border-border">
                                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                    <Info className="h-4 w-4 text-accent" /> Borrowing Rules
                                </h4>
                                <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                                    <li>• Standard loan period is 14 days.</li>
                                    <li>• Maximum of 3 books at a time.</li>
                                    <li>• Renewals available if no pending holds.</li>
                                </ul>
                            </div>
                        </aside>

                        {/* Results Grid */}
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-heading font-bold text-foreground">
                                    {selectedCategory || "All Resources"}
                                    <span className="ml-3 text-sm font-normal text-muted-foreground">({books?.length || 0} items)</span>
                                </h2>
                            </div>

                            {isLoading ? (
                                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="h-[200px] rounded-2xl bg-secondary animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {books?.map((book) => (
                                        <div key={book.id} className="group bg-card border border-border rounded-2xl p-6 hover:shadow-2xl hover:border-accent/30 transition-all duration-300 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                                                        <BookIcon className="h-6 w-6" />
                                                    </div>
                                                    <Badge variant={book.available > 0 ? "default" : "secondary"} className={book.available > 0 ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}>
                                                        {book.available > 0 ? `${book.available} Available` : "On Loan"}
                                                    </Badge>
                                                </div>
                                                <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-1">{book.title}</h3>
                                                <p className="text-sm text-muted-foreground mb-4">by {book.author}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
                                                    <span className="px-2 py-0.5 rounded bg-secondary">{book.category}</span>
                                                    <span>ISBN: {book.isbn || "N/A"}</span>
                                                </div>
                                            </div>
                                            <Button
                                                variant={book.available > 0 ? "gold" : "outline"}
                                                disabled={book.available === 0}
                                                className="w-full rounded-xl"
                                                onClick={() => {
                                                    setSelectedBook(book);
                                                    setIsBorrowModalOpen(true);
                                                }}
                                            >
                                                {book.available > 0 ? "Borrow Now" : "Request Hold"}
                                            </Button>
                                        </div>
                                    ))}
                                    {books?.length === 0 && (
                                        <div className="col-span-full py-20 text-center">
                                            <div className="h-20 w-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Search className="h-10 w-10 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-xl font-bold text-foreground mb-2">No matching resources</h3>
                                            <p className="text-muted-foreground">Try adjusting your search terms or filters.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <Dialog open={isBorrowModalOpen} onOpenChange={setIsBorrowModalOpen}>
                <DialogContent className="sm:max-w-md bg-card rounded-2xl border-border">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-heading font-black">Confirm Borrowing</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            You are requesting to borrow:
                        </DialogDescription>
                    </DialogHeader>
                    {selectedBook && (
                        <div className="py-6 space-y-4">
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border border-border">
                                <div className="p-3 rounded-lg bg-accent/20 text-accent">
                                    <BookIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground">{selectedBook.title}</h4>
                                    <p className="text-xs text-muted-foreground">by {selectedBook.author}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-border">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                        <CheckCircle2 className="h-3 w-3 text-green-500" /> Borrow Date
                                    </div>
                                    <p className="text-sm font-bold text-foreground">{new Date().toLocaleDateString()}</p>
                                </div>
                                <div className="p-4 rounded-xl border border-border">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                        <Clock className="h-3 w-3 text-accent" /> Due Date
                                    </div>
                                    <p className="text-sm font-bold text-foreground">{new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest pt-2">
                                By confirming, you agree to return the resource within 14 days.
                            </p>
                        </div>
                    )}
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsBorrowModalOpen(false)} className="flex-1 rounded-xl">Cancel</Button>
                        <Button
                            variant="gold"
                            onClick={handleBorrowRequest}
                            disabled={borrowMutation.isPending}
                            className="flex-1 rounded-xl shadow-lg shadow-accent/20"
                        >
                            {borrowMutation.isPending ? "Processing..." : "Confirm Request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <section className="py-20 bg-secondary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-64 w-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="container mx-auto px-4 text-center relative z-10">
                    <div className="max-w-2xl mx-auto space-y-8">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl dark:bg-card">
                            <Info className="h-8 w-8 text-accent" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-heading font-black text-foreground mb-4">Can't find what you're looking for?</h2>
                            <p className="text-muted-foreground text-lg mb-8">
                                Our librarians are dedicated to supporting your research. Request specific materials or schedule a consultation.
                            </p>
                            <Button
                                variant="outline"
                                size="lg"
                                className="rounded-2xl border-accent text-accent hover:bg-accent hover:text-accent-foreground px-12 transition-all hover:scale-105 active:scale-95"
                            >
                                Request a Resource
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Library;

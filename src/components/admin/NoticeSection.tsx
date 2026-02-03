import { useState } from "react";
import { Plus, Edit, Trash2, Search, Bell, Calendar, Users, Eye, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const mockNotices = [
  { 
    id: 1, 
    title: "End of Term Examinations", 
    content: "End of term examinations will commence on December 9th, 2024. All students are required to be in full school uniform and arrive 30 minutes before the start of each exam. Examination timetables have been posted on the notice boards.",
    author: "Mr. Christopher Wenyasha",
    date: "2024-12-05",
    audience: "All Students",
    priority: "High",
    pinned: true,
    views: 342
  },
  { 
    id: 2, 
    title: "School Fees Payment Reminder", 
    content: "This is a reminder that all outstanding school fees should be paid before the end of term. Students with outstanding balances will not be able to sit for examinations. Please contact the accounts office for any queries.",
    author: "Mrs. Accounts Manager",
    date: "2024-12-04",
    audience: "All Parents",
    priority: "High",
    pinned: true,
    views: 256
  },
  { 
    id: 3, 
    title: "Sports Day 2024", 
    content: "Annual Sports Day will be held on December 15th, 2024. All students are encouraged to participate. Parents are welcome to attend and support their children. Refreshments will be available.",
    author: "Mr. Sports Coordinator",
    date: "2024-12-03",
    audience: "All",
    priority: "Medium",
    pinned: false,
    views: 189
  },
  { 
    id: 4, 
    title: "Staff Meeting", 
    content: "There will be a mandatory staff meeting on Friday at 3:00 PM in the conference hall. All teaching staff are required to attend. The agenda will be distributed via email.",
    author: "Principal's Office",
    date: "2024-12-02",
    audience: "Staff Only",
    priority: "Medium",
    pinned: false,
    views: 45
  },
  { 
    id: 5, 
    title: "Library Book Returns", 
    content: "All library books must be returned by December 6th, 2024. Students with outstanding books will be charged a fine. Please check your library accounts and return all borrowed items.",
    author: "School Librarian",
    date: "2024-12-01",
    audience: "All Students",
    priority: "Low",
    pinned: false,
    views: 124
  },
];

const NoticeSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: "", content: "", audience: "All", priority: "Medium" });

  const audiences = ["All", "All Students", "All Parents", "Staff Only", "Form 4", "Form 3"];

  const filteredNotices = mockNotices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAudience = audienceFilter === "all" || notice.audience === audienceFilter;
    return matchesSearch && matchesAudience;
  });

  // Sort: pinned first, then by date
  const sortedNotices = [...filteredNotices].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Notice Board</h2>
          <p className="text-sm text-muted-foreground">Manage school announcements and notices</p>
        </div>
        <Button variant="gold" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Notice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockNotices.length}</p>
                <p className="text-xs text-muted-foreground">Total Notices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Pin className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockNotices.filter(n => n.pinned).length}</p>
                <p className="text-xs text-muted-foreground">Pinned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Bell className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockNotices.filter(n => n.priority === "High").length}</p>
                <p className="text-xs text-muted-foreground">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockNotices.reduce((acc, n) => acc + n.views, 0)}</p>
                <p className="text-xs text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select 
          value={audienceFilter}
          onChange={(e) => setAudienceFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
        >
          <option value="all">All Audiences</option>
          {audiences.map(aud => <option key={aud} value={aud}>{aud}</option>)}
        </select>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {sortedNotices.map((notice) => (
          <Card key={notice.id} className={`hover:shadow-md transition-shadow ${notice.pinned ? 'border-accent' : ''}`}>
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    {notice.pinned && (
                      <Pin className="h-4 w-4 text-accent mt-1 flex-shrink-0" />
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg text-foreground">{notice.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          notice.priority === "High" ? "bg-red-100 text-red-700" :
                          notice.priority === "Medium" ? "bg-amber-100 text-amber-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {notice.priority}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{notice.content}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {notice.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {notice.audience}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {notice.views} views
                        </span>
                        <span>By: {notice.author}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm">
                    <Pin className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Notice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-card rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading text-xl font-bold text-foreground mb-4">Create New Notice</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                <Input 
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                  placeholder="Enter notice title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Content</label>
                <Textarea 
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({...newNotice, content: e.target.value})}
                  placeholder="Enter notice content..."
                  rows={5}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Audience</label>
                  <select 
                    value={newNotice.audience}
                    onChange={(e) => setNewNotice({...newNotice, audience: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  >
                    {audiences.map(aud => <option key={aud} value={aud}>{aud}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
                  <select 
                    value={newNotice.priority}
                    onChange={(e) => setNewNotice({...newNotice, priority: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">Cancel</Button>
              <Button variant="gold" onClick={() => setShowCreateModal(false)} className="flex-1">Publish Notice</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeSection;

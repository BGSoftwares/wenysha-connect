import { useState } from "react";
import { Plus, Edit, Trash2, Search, Phone, Mail, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const mockParents = [
  { 
    id: 1, 
    name: "Mr. & Mrs. Moyo", 
    phone: "+263 77 123 4567", 
    email: "moyo.family@gmail.com",
    children: ["John Moyo (Form 4A)", "Grace Moyo (Form 2B)"],
    address: "123 Borrowdale Road, Harare",
    status: "Active"
  },
  { 
    id: 2, 
    name: "Mrs. Ndlovu", 
    phone: "+263 71 234 5678", 
    email: "ndlovu.p@yahoo.com",
    children: ["Sarah Ndlovu (Form 3B)"],
    address: "45 Avondale, Harare",
    status: "Active"
  },
  { 
    id: 3, 
    name: "Mr. Chikwanda", 
    phone: "+263 78 345 6789", 
    email: "chikwanda.t@gmail.com",
    children: ["Peter Chikwanda (Form 4A)", "Tendai Chikwanda (Form 1A)"],
    address: "78 Mount Pleasant, Harare",
    status: "Active"
  },
  { 
    id: 4, 
    name: "Mrs. Sibanda", 
    phone: "+263 73 456 7890", 
    email: "sibanda.m@outlook.com",
    children: ["Mary Sibanda (Form 2A)"],
    address: "32 Eastlea, Harare",
    status: "Inactive"
  },
];

const ParentsSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredParents = mockParents.filter(parent => {
    const matchesSearch = parent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parent.children.some(child => child.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || parent.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Parents & Guardians</h2>
          <p className="text-sm text-muted-foreground">Manage parent/guardian information and communications</p>
        </div>
        <Button variant="gold">
          <Plus className="h-4 w-4 mr-2" />
          Add Parent/Guardian
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockParents.length}</p>
                <p className="text-xs text-muted-foreground">Total Parents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <User className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockParents.filter(p => p.status === "Active").length}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Mail className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">24</p>
                <p className="text-xs text-muted-foreground">Emails Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Phone className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">12</p>
                <p className="text-xs text-muted-foreground">SMS Sent</p>
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
            placeholder="Search by parent name or child..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Parents List */}
      <div className="grid gap-4">
        {filteredParents.map((parent) => (
          <Card key={parent.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{parent.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        parent.status === "Active" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {parent.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {parent.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {parent.email}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{parent.address}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {parent.children.map((child, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 rounded bg-secondary text-foreground">
                          {child}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 md:flex-col">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Mail className="h-4 w-4 mr-1" /> Email
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Phone className="h-4 w-4 mr-1" /> SMS
                  </Button>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm"><Edit className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ParentsSection;

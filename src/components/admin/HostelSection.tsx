import { useState } from "react";
import { Plus, Edit, Trash2, Search, Building, User, Bed, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockHostels = [
  { id: 1, name: "Boys Hostel A", type: "Boys", capacity: 120, occupied: 98, warden: "Mr. Tafadzwa Moyo", phone: "+263 77 555 1111" },
  { id: 2, name: "Boys Hostel B", type: "Boys", capacity: 100, occupied: 85, warden: "Mr. David Banda", phone: "+263 77 555 2222" },
  { id: 3, name: "Girls Hostel A", type: "Girls", capacity: 120, occupied: 110, warden: "Mrs. Grace Ncube", phone: "+263 77 555 3333" },
  { id: 4, name: "Girls Hostel B", type: "Girls", capacity: 100, occupied: 78, warden: "Mrs. Faith Chikwanda", phone: "+263 77 555 4444" },
];

const mockRooms = [
  { id: 1, room: "A101", hostel: "Boys Hostel A", beds: 4, occupied: 4, students: ["John Moyo", "Peter Ncube", "David Sithole", "James Banda"] },
  { id: 2, room: "A102", hostel: "Boys Hostel A", beds: 4, occupied: 3, students: ["Thomas Chikwanda", "Paul Ndlovu", "Brian Moyo"] },
  { id: 3, room: "A103", hostel: "Boys Hostel A", beds: 4, occupied: 4, students: ["Mike Dube", "Chris Sibanda", "Kevin Phiri", "Eric Tembo"] },
  { id: 4, room: "G101", hostel: "Girls Hostel A", beds: 4, occupied: 4, students: ["Sarah Ndlovu", "Mary Sibanda", "Grace Moyo", "Faith Ncube"] },
  { id: 5, room: "G102", hostel: "Girls Hostel A", beds: 4, occupied: 4, students: ["Linda Phiri", "Susan Banda", "Joyce Tembo", "Diana Dube"] },
];

const mockRequests = [
  { id: 1, student: "John Moyo", type: "Maintenance", issue: "Broken bed frame", room: "A101", date: "2024-12-05", status: "Pending" },
  { id: 2, student: "Sarah Ndlovu", type: "Transfer", issue: "Request to change room", room: "G101", date: "2024-12-04", status: "Under Review" },
  { id: 3, student: "Peter Ncube", type: "Maintenance", issue: "Light not working", room: "A102", date: "2024-12-03", status: "Resolved" },
];

const HostelSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [hostelFilter, setHostelFilter] = useState("all");

  const filteredRooms = mockRooms.filter(room => {
    const matchesSearch = room.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.students.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesHostel = hostelFilter === "all" || room.hostel === hostelFilter;
    return matchesSearch && matchesHostel;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Hostel Management</h2>
          <p className="text-sm text-muted-foreground">Manage hostels, rooms, and boarding students</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
          <Button variant="gold">
            <Plus className="h-4 w-4 mr-2" />
            Add Hostel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockHostels.length}</p>
                <p className="text-xs text-muted-foreground">Hostels</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Bed className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockHostels.reduce((acc, h) => acc + h.capacity, 0)}</p>
                <p className="text-xs text-muted-foreground">Total Beds</p>
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
                <p className="text-2xl font-bold text-foreground">{mockHostels.reduce((acc, h) => acc + h.occupied, 0)}</p>
                <p className="text-xs text-muted-foreground">Boarders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockRequests.filter(r => r.status === "Pending").length}</p>
                <p className="text-xs text-muted-foreground">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="hostels" className="w-full">
        <TabsList>
          <TabsTrigger value="hostels">Hostels</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="hostels" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {mockHostels.map((hostel) => (
              <Card key={hostel.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${hostel.type === "Boys" ? "bg-blue-500/10" : "bg-pink-500/10"}`}>
                        <Building className={`h-6 w-6 ${hostel.type === "Boys" ? "text-blue-500" : "text-pink-500"}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground">{hostel.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${hostel.type === "Boys" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}>
                          {hostel.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm"><Edit className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">Warden: {hostel.warden}</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{hostel.phone}</p>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Occupancy</span>
                      <span className="font-semibold text-foreground">{hostel.occupied}/{hostel.capacity}</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${hostel.occupied / hostel.capacity > 0.9 ? 'bg-amber-500' : 'bg-primary'}`}
                        style={{ width: `${(hostel.occupied / hostel.capacity) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {hostel.capacity - hostel.occupied} beds available
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4 mt-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by room or student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select 
              value={hostelFilter}
              onChange={(e) => setHostelFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
            >
              <option value="all">All Hostels</option>
              {mockHostels.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
            </select>
          </div>

          {/* Rooms Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => (
              <Card key={room.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bed className="h-5 w-5 text-primary" />
                      <h3 className="font-bold text-foreground">{room.room}</h3>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      room.occupied === room.beds ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                    }`}>
                      {room.occupied}/{room.beds} beds
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{room.hostel}</p>
                  <div className="space-y-1">
                    {room.students.map((student, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-foreground">{student}</span>
                      </div>
                    ))}
                    {room.occupied < room.beds && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                        <Bed className="h-3 w-3" />
                        <span>{room.beds - room.occupied} bed(s) available</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4 mt-4">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Student</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Issue</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Room</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Date</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockRequests.map((request) => (
                  <tr key={request.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium text-foreground">{request.student}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        request.type === "Maintenance" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                      }`}>
                        {request.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{request.issue}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{request.room}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{request.date}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded ${
                        request.status === "Pending" ? "bg-amber-100 text-amber-700" :
                        request.status === "Under Review" ? "bg-blue-100 text-blue-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {request.status !== "Resolved" && (
                        <Button variant="outline" size="sm">Resolve</Button>
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

export default HostelSection;

import { useState } from "react";
import { Plus, Edit, Trash2, Search, Bus, MapPin, User, Phone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockBuses = [
  { id: 1, number: "WEN-001", route: "Borrowdale - School", driver: "James Sithole", phone: "+263 77 111 2222", capacity: 45, students: 38, status: "Active" },
  { id: 2, number: "WEN-002", route: "Avondale - School", driver: "Peter Moyo", phone: "+263 77 222 3333", capacity: 45, students: 42, status: "Active" },
  { id: 3, number: "WEN-003", route: "Mount Pleasant - School", driver: "David Ncube", phone: "+263 77 333 4444", capacity: 40, students: 35, status: "Active" },
  { id: 4, number: "WEN-004", route: "Eastlea - School", driver: "Thomas Banda", phone: "+263 77 444 5555", capacity: 40, students: 28, status: "Maintenance" },
];

const mockRoutes = [
  { id: 1, name: "Borrowdale Route", stops: ["Borrowdale Brooke", "Sam Levy Village", "Groombridge", "School"], bus: "WEN-001", departureAM: "06:30", departureAM_School: "07:15", departurePM: "15:30" },
  { id: 2, name: "Avondale Route", stops: ["Avondale Shops", "King George", "Montagu", "School"], bus: "WEN-002", departureAM: "06:45", departureAM_School: "07:20", departurePM: "15:30" },
  { id: 3, name: "Mount Pleasant Route", stops: ["Mt Pleasant Shops", "UZ", "Highlands", "School"], bus: "WEN-003", departureAM: "06:30", departureAM_School: "07:10", departurePM: "15:30" },
  { id: 4, name: "Eastlea Route", stops: ["Eastlea Shops", "Greendale", "Msasa", "School"], bus: "WEN-004", departureAM: "06:40", departureAM_School: "07:15", departurePM: "15:30" },
];

const TransportSection = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBuses = mockBuses.filter(bus => 
    bus.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bus.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bus.driver.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Transport Management</h2>
          <p className="text-sm text-muted-foreground">Manage school buses, routes, and drivers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Route
          </Button>
          <Button variant="gold">
            <Plus className="h-4 w-4 mr-2" />
            Add Bus
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockBuses.length}</p>
                <p className="text-xs text-muted-foreground">Total Buses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Bus className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockBuses.filter(b => b.status === "Active").length}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <MapPin className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockRoutes.length}</p>
                <p className="text-xs text-muted-foreground">Routes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockBuses.reduce((acc, b) => acc + b.students, 0)}</p>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="buses" className="w-full">
        <TabsList>
          <TabsTrigger value="buses">Buses</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
        </TabsList>

        <TabsContent value="buses" className="space-y-4 mt-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search buses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Buses Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {filteredBuses.map((bus) => (
              <Card key={bus.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Bus className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground">{bus.number}</h3>
                        <p className="text-sm text-muted-foreground">{bus.route}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      bus.status === "Active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {bus.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{bus.driver}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{bus.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Capacity</p>
                      <p className="font-semibold text-foreground">{bus.students}/{bus.capacity}</p>
                    </div>
                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${bus.students / bus.capacity > 0.9 ? 'bg-amber-500' : 'bg-primary'}`}
                        style={{ width: `${(bus.students / bus.capacity) * 100}%` }}
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm"><Edit className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4 mt-4">
          {/* Routes Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Route</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Stops</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Bus</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-foreground">AM Pickup</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-foreground">PM Drop</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockRoutes.map((route) => (
                  <tr key={route.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">{route.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {route.stops.slice(0, 3).map((stop, idx) => (
                          <span key={idx} className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                            {stop}
                          </span>
                        ))}
                        {route.stops.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{route.stops.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{route.bus}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-foreground">{route.departureAM}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-foreground">{route.departurePM}</span>
                      </div>
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
      </Tabs>
    </div>
  );
};

export default TransportSection;

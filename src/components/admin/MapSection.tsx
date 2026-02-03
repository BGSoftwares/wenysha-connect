import { MapPin, Building, Compass, School, Flag, TreePine, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const facilities = [
  { id: 1, name: "Main Administration Block", icon: Building, color: "bg-primary", position: { top: "20%", left: "45%" } },
  { id: 2, name: "Science Laboratory", icon: Compass, color: "bg-blue-500", position: { top: "35%", left: "30%" } },
  { id: 3, name: "Library", icon: School, color: "bg-green-500", position: { top: "40%", left: "60%" } },
  { id: 4, name: "Sports Field", icon: Flag, color: "bg-amber-500", position: { top: "70%", left: "25%" } },
  { id: 5, name: "Hostels", icon: Building, color: "bg-purple-500", position: { top: "65%", left: "70%" } },
  { id: 6, name: "Garden Area", icon: TreePine, color: "bg-emerald-500", position: { top: "50%", left: "45%" } },
  { id: 7, name: "Parking", icon: Car, color: "bg-gray-500", position: { top: "15%", left: "70%" } },
  { id: 8, name: "Main Entrance", icon: MapPin, color: "bg-red-500", position: { top: "85%", left: "45%" } },
];

const MapSection = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground">School Campus Map</h2>
        <p className="text-sm text-muted-foreground">Interactive map of Wenyasha International School facilities</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20">
                {/* Campus background pattern */}
                <div className="absolute inset-0 opacity-30">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-green-600" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                {/* Roads */}
                <div className="absolute top-1/2 left-0 right-0 h-3 bg-gray-400/50 transform -translate-y-1/2" />
                <div className="absolute top-0 bottom-0 left-1/2 w-3 bg-gray-400/50 transform -translate-x-1/2" />

                {/* Facility markers */}
                {facilities.map((facility) => (
                  <div
                    key={facility.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    style={{ top: facility.position.top, left: facility.position.left }}
                  >
                    <div className={`${facility.color} p-2 rounded-full shadow-lg group-hover:scale-110 transition-transform`}>
                      <facility.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <div className="bg-card px-3 py-1.5 rounded-lg shadow-lg border border-border whitespace-nowrap">
                        <p className="text-xs font-medium text-foreground">{facility.name}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Compass */}
                <div className="absolute top-4 right-4 bg-card/90 backdrop-blur p-2 rounded-full shadow-lg">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">N</span>
                    </div>
                    <Compass className="w-full h-full text-muted-foreground" />
                  </div>
                </div>

                {/* Scale */}
                <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur px-3 py-2 rounded-lg shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-0.5 bg-foreground" />
                    <span className="text-xs text-muted-foreground">50m</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legend */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-4">Facilities Legend</h3>
              <div className="space-y-3">
                {facilities.map((facility) => (
                  <div key={facility.id} className="flex items-center gap-3">
                    <div className={`${facility.color} p-1.5 rounded-full`}>
                      <facility.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm text-foreground">{facility.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3">Campus Information</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Total Area:</strong> 15 Hectares</p>
                <p><strong className="text-foreground">Buildings:</strong> 12 Structures</p>
                <p><strong className="text-foreground">Sports Fields:</strong> 3</p>
                <p><strong className="text-foreground">Parking Capacity:</strong> 100 vehicles</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3">Emergency Exits</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Main Gate (South)
                </p>
                <p className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Service Gate (East)
                </p>
                <p className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Emergency Exit (North)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MapSection;

import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MapCampus {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

const TILE = 256;
const ZOOM = 17;
// Slightly larger than any card the map sits in; the container clips the overflow.
const WIDTH = TILE * 5;
const HEIGHT = TILE * 3;

/** Web-Mercator pixel position of a coordinate at the given zoom. */
const project = (lat: number, lng: number, zoom: number) => {
  const size = TILE * 2 ** zoom;
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * size,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
  };
};

/**
 * A small map with one pin per campus, drawn from OpenStreetMap tiles. Built by hand so it needs
 * no map library; the view is centred between all the campuses.
 */
const CampusMap = ({ campuses, className }: { campuses: readonly MapCampus[]; className?: string }) => {
  if (!campuses.length) return null;
  const points = campuses.map((campus) => ({ campus, ...project(campus.lat, campus.lng, ZOOM) }));
  const centre = {
    x: (Math.min(...points.map((p) => p.x)) + Math.max(...points.map((p) => p.x))) / 2,
    y: (Math.min(...points.map((p) => p.y)) + Math.max(...points.map((p) => p.y))) / 2,
  };
  const originX = centre.x - WIDTH / 2;
  const originY = centre.y - HEIGHT / 2;

  const tiles: { key: string; x: number; y: number; url: string }[] = [];
  for (let tx = Math.floor(originX / TILE); tx <= Math.floor((originX + WIDTH) / TILE); tx++) {
    for (let ty = Math.floor(originY / TILE); ty <= Math.floor((originY + HEIGHT) / TILE); ty++) {
      tiles.push({
        key: `${tx}/${ty}`,
        x: tx * TILE - originX,
        y: ty * TILE - originY,
        url: `https://tile.openstreetmap.org/${ZOOM}/${tx}/${ty}.png`,
      });
    }
  }

  return (
    <div
      className={cn("relative h-56 overflow-hidden rounded-xl border border-border bg-muted", className)}
      role="img"
      aria-label={`Map showing ${campuses.map((c) => c.name).join(" and ")}`}
    >
      <div className="absolute left-1/2 top-1/2" style={{ width: WIDTH, height: HEIGHT, marginLeft: -WIDTH / 2, marginTop: -HEIGHT / 2 }}>
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.url}
            alt=""
            width={TILE}
            height={TILE}
            loading="lazy"
            draggable={false}
            className="absolute max-w-none select-none"
            style={{ left: tile.x, top: tile.y }}
          />
        ))}
        {points.map(({ campus, x, y }) => (
          <div
            key={campus.id}
            className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
            style={{ left: x - originX, top: y - originY }}
          >
            <span className="mb-0.5 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground shadow-md">
              {campus.name}
            </span>
            <MapPin className="h-7 w-7 fill-accent text-primary drop-shadow-md" aria-hidden="true" />
          </div>
        ))}
      </div>
      <span className="absolute bottom-0 right-0 bg-white/80 px-1.5 py-0.5 text-[10px] text-slate-700">
        © OpenStreetMap contributors
      </span>
    </div>
  );
};

export default CampusMap;

export const schoolContact = {
  name: "Able God College",
  address: "3878 Zexcom, Masvingo, Zimbabwe",
  // 20.10296° S, 30.79553° E (south and west are negative in map links)
  coordinates: { lat: -20.10296, lng: 30.79553 },
  /** Every campus shown on the map. Coordinates are decimal degrees (south and west are negative). */
  campuses: [
    { id: "main", name: "Main Campus", lat: -20.10296, lng: 30.79553 },
    { id: "arts", name: "Arts Campus", lat: -20.102384, lng: 30.797424 },
  ],
  mapUrl: "https://maps.app.goo.gl/eVFTtgt5UncoxNob8?g_st=ic",
  directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=-20.10296,30.79553",
  mapEmbedUrl: "https://www.google.com/maps?q=-20.10296,30.79553&z=16&output=embed",
  phones: [
    { label: "+263 779 381 415", href: "tel:+263779381415" },
    { label: "+263 775 686 614", href: "tel:+263775686614" },
  ],
} as const;

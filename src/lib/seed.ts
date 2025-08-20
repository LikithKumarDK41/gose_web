import { interpolateStops } from "@/lib/trip";

export const HOSKERALLI = { lat: 12.9330, lng: 77.5350 };               // start
export const LALBAGH = { lat: 12.9507, lng: 77.5848 };                   // end (example)

export const TRIP = (() => {
    const { stops, legs } = interpolateStops(HOSKERALLI, LALBAGH, 8, "POI");
    return { name: "Hoskeralli → Lalbagh", stops, legs };
})();

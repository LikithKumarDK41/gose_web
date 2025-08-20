import type { Stop, Leg } from "@/lib/store/slices/planSlice";

export function interpolateStops(
    start: { lat: number; lng: number }, end: { lat: number; lng: number },
    n: number, // number of intermediate stops
    titlePrefix = "Stop"
) {
    const stops: Stop[] = [];
    for (let i = 0; i <= n; i++) {
        const t = i / n;
        const lat = start.lat + (end.lat - start.lat) * t;
        const lng = start.lng + (end.lng - start.lng) * t;
        stops.push({
            id: `s${i + 1}`, order: i + 1,
            time: `${String(9 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
            title: `${titlePrefix} ${i + 1}`,
            subtitle: "Auto‑generated along route",
            lat, lng, image: "/demo/1.jpg", radius: 100,
        });
    }
    const legs: Leg[] = [];
    for (let i = 0; i < stops.length - 1; i++) {
        legs.push({ fromId: stops[i].id, toId: stops[i + 1].id, mode: (i % 2 ? "walk" : "car"), minutes: 10 });
    }
    return { stops, legs };
}

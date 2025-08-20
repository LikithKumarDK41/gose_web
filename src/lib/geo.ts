export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const R = 6371000, toRad = (x: number) => x * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}
export const metersLabel = (m: number) => m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
export const within = (p: { lat: number; lng: number }, c: { lat: number; lng: number }, r: number) => haversine(p, c) <= r;

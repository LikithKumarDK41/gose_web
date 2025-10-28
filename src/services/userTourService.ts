// src/lib/services/userTourist.service.ts
import api from "@/lib/api";

/* -------------------- Shared Types -------------------- */
export type TravelMode = "car" | "walk" | "train";

/** Cloudinary Image Type */
export interface CloudinaryImage {
    public_id?: string;
    version?: number;
    signature?: string;
    format?: string;
    resource_type?: string;
    url?: string;
    secure_url?: string;
    width?: number;
    height?: number;
    [key: string]: any;
}
export type CloudinaryIcon = CloudinaryImage;

/* ------------------------------------------------------------------ */
/** Related Tour Type (inside monument.relatedtours[]) */
export interface RelatedTour {
    _id?: string;
    title?: string;
    duration?: string;
    traveltime?: string;
    link?: string;
    content?: {
        brief?: string;
        extended?: string;
    };
    image?: CloudinaryImage;
    featured?: boolean;
}

/* ------------------------------------------------------------------ */
/** Region Type (inside monument.region) */
export interface Region {
    _id?: string;
    slug?: string;
    name?: string;
    title?: string;
    location?: [number, number];
    featuredmonument?: string[];
    content?: {
        brief?: string;
        extended?: string;
    };
    state?: string;
    __v?: number;
}

/* ------------------------------------------------------------------ */
/** Subtheme / Theme Type */
export interface Theme {
    _id?: string;
    title?: string;
    image?: CloudinaryImage;
    theme?: string[];
}

/* ------------------------------------------------------------------ */
/** Monument Interface (main type) */
export interface Monument {
    _id: string;
    slug?: string;
    sortOrder?: number;

    name: string;
    title?: string;
    description?: string;

    /** Images */
    image?: CloudinaryImage;
    gallery?: CloudinaryImage[];

    /** Geo & Region */
    location?: { lat?: number; lng?: number } | [number, number];
    region?: Region;

    /** Classification */
    subtheme?: Theme[];
    theme?: Theme[];
    artemplates?: any[];

    /** Settings / Flags */
    arenabled?: boolean;
    avenabled?: boolean;
    featured?: boolean;
    rare?: boolean;
    tourpoint?: boolean;

    /** Meta Info */
    era?: string;
    year?: string;
    size?: string;
    mtype?: string;
    access?: string;
    georadius?: number;
    state?: string;

    /** Content */
    content?: {
        brief?: string;
        extended?: string;
    };

    /** Relations */
    nearbyservices?: any[];
    nearbymonuments?: any[];
    relatedtours?: RelatedTour[];

    /** Other Metadata */
    imagecredit?: string | { en?: string; ja?: string };
    popularity?: number;
    __v?: number;
}

export interface TravelType {
    _id: string;
    title?: string;
    name?: TravelMode;
    icon?: CloudinaryIcon;
    state?: string;
}

export interface TourPoint {
    _id: string;
    name?: string;
    waypointtype?: "start" | "place" | "end";
    traveltype?: TravelType;
    monument?: Monument;
    traveltime?: string;
    starttime?: string;
    state?: string;
    pointtype?: "monument" | "station" | "lunch";
}

export interface Tour {
    _id: string;
    title: string;
    description?: string;
    duration?: string;
    traveltime?: string;
    link?: string;
    tour?: Record<string, any>;
    content?: { brief?: string; extended?: string };
    monuments?: string[];
    image?: CloudinaryImage;
    routeImage?: CloudinaryImage;
    routeJson?: string;
    featured?: boolean;
    special?: boolean;
    specialContent?: string;
    tourpoints?: TourPoint[];
}

/* -------------------- Helpers -------------------- */
function parseAxiosError(err: any, fallback: string) {
    return err?.response?.data?.message || err?.message || fallback;
}

function getLocale(): string {
    if (typeof window === "undefined") return "ja";
    return localStorage.getItem("site_locale") || "ja";
}

type ToursEnvelope = { tours?: { results?: Tour[] } } | { results?: Tour[] } | Tour[];

function extractTours(data: ToursEnvelope): Tour[] {
    if (Array.isArray(data)) return data;
    if ("tours" in data && data.tours?.results) return data.tours.results!;
    if ("results" in data && data.results) return data.results!;
    return [];
}

/* -------------------- Service API -------------------- */
export async function apiFetchTours(): Promise<Tour[]> {
    try {
        const { data } = await api.get<ToursEnvelope>("/v1/tours");
        return extractTours(data);
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to load tours"));
    }
}

export async function apiFetchTourById(id: string): Promise<Tour> {
    const locale = getLocale();
    try {
        const { data } = await api.get<{ tour: Tour }>(`/v1/tours/${id}?lang=${locale}`, {
            headers: {
                "Accept-Language": locale,
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
            },
        });
        return data.tour;
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to load tour"));
    }
}

export async function apiFetchTourPoints(tourId: string): Promise<TourPoint[]> {
    try {
        const filter = encodeURIComponent(JSON.stringify({ tour: tourId }));
        const { data } = await api.get<{ tourpoints: { results: TourPoint[] } }>(
            `/v1/tourpoints?filter=${filter}`
        );

        const results = data.tourpoints?.results ?? [];
        const order: Record<"start" | "place" | "end", number> = { start: 1, place: 2, end: 3 };

        return results.sort((a, b) => {
            const ord = (t?: "start" | "place" | "end") => (t ? order[t] : 99);
            return ord(a.waypointtype) - ord(b.waypointtype);
        });
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to load tourpoints"));
    }
}

export async function apiFetchMonumentDetails(monument: string): Promise<Monument> {
    try {
        const { data } = await api.post<{ monument: Monument }>("/v2/monument", { monument });
        return data.monument;
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to load monument details"));
    }
}

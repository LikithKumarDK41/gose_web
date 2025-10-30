// src/services/userTourService.ts
import api from "@/lib/api";

/* ------------------------------------------------------------
   Shared Types
------------------------------------------------------------ */
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

/* ------------------------------------------------------------
   Related Types
------------------------------------------------------------ */
export interface RelatedTour {
    _id?: string;
    title?: string;
    duration?: string;
    traveltime?: string;
    link?: string;
    content?: { brief?: string; extended?: string };
    image?: CloudinaryImage;
    featured?: boolean;
}

export interface Region {
    _id?: string;
    slug?: string;
    name?: string;
    title?: string;
    location?: [number, number];
    featuredmonument?: string[];
    content?: { brief?: string; extended?: string };
    state?: string;
    __v?: number;
}

export interface Theme {
    _id?: string;
    title?: string;
    image?: CloudinaryImage;
    theme?: string[];
}

/* ------------------------------------------------------------
   Monument Interface
------------------------------------------------------------ */
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

    /** Flags */
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
    content?: { brief?: string; extended?: string };

    /** Relations */
    nearbyservices?: any[];
    nearbymonuments?: any[];
    relatedtours?: RelatedTour[];

    /** Other Metadata */
    imagecredit?: string | { en?: string; ja?: string };
    popularity?: number;
    __v?: number;
}

/* ------------------------------------------------------------
   Tour Types
------------------------------------------------------------ */
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
    location?: { lat?: number; lng?: number } | [number, number];
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

/* ------------------------------------------------------------
   Monument Sort Interface
------------------------------------------------------------ */
export interface MonumentSort {
    _id: string;
    name?: string;
    state?: string;
    title?: string;
    icon?: CloudinaryIcon;
    priority?: number;
    link?: string;
}

/* ------------------------------------------------------------
   Helpers
------------------------------------------------------------ */
function parseAxiosError(err: any, fallback: string): string {
    return err?.response?.data?.message || err?.message || fallback;
}

type ToursEnvelope = { tours?: { results?: Tour[] } } | { results?: Tour[] } | Tour[];

function extractTours(data: ToursEnvelope): Tour[] {
    if (Array.isArray(data)) return data;
    if ("tours" in data && data.tours?.results) return data.tours.results!;
    if ("results" in data && data.results) return data.results!;
    return [];
}

/* ------------------------------------------------------------
   API Services (Locale + Token handled globally in api.ts)
------------------------------------------------------------ */

/** Fetch all tours */
export async function apiFetchTours(): Promise<Tour[]> {
    try {
        const { data } = await api.get<ToursEnvelope>("/v1/tours");
        return extractTours(data);
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to load tours"));
    }
}

/** Fetch a single tour by ID */
export async function apiFetchTourById(id: string): Promise<Tour> {
    try {
        const { data } = await api.get<{ tour: Tour }>(`/v1/tours/${id}`);
        return data.tour;
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to load tour"));
    }
}

/** Fetch all tourpoints for a specific tour */
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

/** Fetch detailed monument data */
export async function apiFetchMonumentDetails(monument: string): Promise<Monument> {
    try {
        const { data } = await api.post<{ monument: Monument }>("/v2/monument", { monument });
        return data.monument;
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to load monument details"));
    }
}

/** ------------------------------------------------------------
 * 🏛️ Fetch all monuments
 * ------------------------------------------------------------
 * GET /v1/monuments
 * Returns: { monuments: { total: number; results: Monument[] } }
 */
export async function apiFetchAllMonuments(): Promise<Monument[]> {
    try {
        const { data } = await api.get<{ monuments: { total: number; results: Monument[] } }>(
            "/v1/monuments"
        );

        // Safely extract results (if payload shape changes)
        const results = data?.monuments?.results ?? [];
        return results;
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to load monuments"));
    }
}

/* ------------------------------------------------------------
   Fetch Monument Sorts
------------------------------------------------------------ */
/**
 * 🗂️ Fetch all monument sorts
 * ------------------------------------------------------------
 * GET /v1/monumentsorts
 * Returns: { monumentsorts: { total: number; results: MonumentSort[] } }
 */
export async function apiFetchMonumentSorts(): Promise<MonumentSort[]> {
    try {
        const { data } = await api.get<{ monumentsorts: { total: number; results: MonumentSort[] } }>(
            "/v1/monumentsorts"
        );

        // Safely extract results (if payload shape changes)
        const results = data?.monumentsorts?.results ?? [];
        return results;
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to load monument sorts"));
    }
}

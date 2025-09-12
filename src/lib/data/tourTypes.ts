// src/lib/data/tourTypes.ts

export type PlaceKind = 'start' | 'place' | 'end';

/** How you move from the previous stop to this stop */
export type TravelMode = 'walk' | 'drive' | 'cycle' | 'transit' | 'other';

export type LegMeta = {
    /** Movement type between the previous stop and this stop */
    mode: TravelMode;
    /** Distance traveled from previous stop (in meters) */
    distanceMeters?: number;
    /** Time taken from previous stop (in minutes) */
    durationMin?: number;
    /** Optional note, e.g., “short climb”, “busy crossing” */
    notes?: string;
};

export type Place = {
    id: string;
    name: string;

    /** Optional time hint like "09:30" */
    time?: string;

    /** Short description for UI */
    blurb?: string;

    /** Optional image URL */
    image?: string;

    /** Coordinates (required for routing & map) */
    lat: number;
    lng: number;

    /** Geofence radius in meters (default via UI if undefined) */
    geofenceRadius?: number;

    /** What this stop represents in the tour */
    kind: PlaceKind;

    /* ──────── Optional rich metadata for UI ──────── */
    /** Small badges like "Temple", "Viewpoint", etc. */
    tags?: string[];

    /** Suggested time to spend here (minutes) */
    visitDurationMin?: number;

    /** Human-friendly location line */
    address?: string;

    /** Quick suggestions (etiquette, photo angle, etc.) */
    tips?: string;

    /** Key things to notice */
    highlights?: string[];

    /** Travel information from the previous stop to this one */
    travelFromPrev?: LegMeta;
};

export type Tour = {
    id: string;
    title: string;
    description: string;
    createdAt: string; // ISO string
    image?: string;
    tags?: string[];
    places: Place[];

    /* ──────── Optional tour-level summaries ──────── */
    /** Total loop/route distance (meters) */
    distanceMetersTotal?: number;

    /** Moving time only (minutes), excludes time spent at stops */
    walkTimeMinutesTotal?: number;

    /** e.g., "Leisurely (2–3 km/h)" */
    suggestedPace?: string;

    /** e.g., "Morning 9:30 – 12:30" */
    bestTimeToGo?: string;

    /** Safety or practical tips that apply to the whole tour */
    safetyNotes?: string[];
};

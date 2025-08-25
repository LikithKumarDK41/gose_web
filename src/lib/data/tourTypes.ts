export type PlaceKind = 'start' | 'place' | 'end';

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
};

export type Tour = {
    id: string;
    title: string;
    description: string;
    createdAt: string; // ISO string
    image?: string;
    tags?: string[];
    places: Place[];
};

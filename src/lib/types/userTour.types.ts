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
    stamp: {
        _id: string;
        user: string;
        monument: string;
        tourpoint: string;
        usertour?: string;
        stamptime: number;
        status: string;
    };
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
    stamp?: any;
    sortOrder?: number;
    pointtitle?: string;
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

type ToursEnvelope = { tours?: { results?: Tour[] } } | { results?: Tour[] } | Tour[];

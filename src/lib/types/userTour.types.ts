export type TravelMode = "car" | "walk" | "train";

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

export interface Monument {
    _id: string;
    slug?: string;
    sortOrder?: number;
    name: string;
    title?: string;
    description?: string;
    image?: CloudinaryImage;
    gallery?: CloudinaryImage[];
    location?: { lat?: number; lng?: number } | [number, number];
    region?: Region;
    subtheme?: Theme[];
    theme?: Theme[];
    artemplates?: any[];
    arenabled?: boolean;
    avenabled?: boolean;
    featured?: boolean;
    rare?: boolean;
    tourpoint?: boolean;
    era?: string;
    year?: string;
    size?: string;
    mtype?: string;
    access?: string;
    georadius?: number;
    state?: string;
    content?: { brief?: string; extended?: string };
    nearbyservices?: any[];
    nearbymonuments?: any[];
    relatedtours?: RelatedTour[];
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

export interface MonumentSort {
    _id: string;
    name?: string;
    state?: string;
    title?: string;
    icon?: CloudinaryIcon;
    priority?: number;
    link?: string;
}

export interface QueueItem {
  id: string;                   
  name: string;
  lat: number;
  lng: number;
  radius: number;
  blurb?: string;
  monumentId: string | null;
  tourpointId: string | null;
  tourId: string | null;
}

export interface TouristState {
  detail: Tour | null;
  monumentDetail: Monument | null;
  loading: boolean;
  error: string | null;
}
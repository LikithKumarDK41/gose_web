// src/lib/services/userGlobalservice.ts
import api from "@/lib/api";

/* ===== Types ===== */
export interface Shortcut {
    _id: string;
    title: string;
    icon?: {
        secure_url?: string;
        url?: string;
    };
    link?: string;
    pdffile?: {
        url?: string;
        mimetype?: string;
        filename?: string;
        size?: number;
    };
    screentype?: string;
    content?: {
        brief?: string;
        extended?: string;
    };
    priority?: number;
    primarymenu?: boolean;
    authrequired?: boolean;
}

export type ShortcutsEnvelope =
    | { shortcuts: { results: Shortcut[] } }
    | { results: Shortcut[] }
    | Shortcut[];

function parseAxiosError(err: any, fallback: string) {
    return err?.response?.data?.message || err?.message || fallback;
}

/** Normalize whatever the backend returns into Shortcut[] */
function extractShortcuts(data: ShortcutsEnvelope): Shortcut[] {
    if (Array.isArray(data)) return data;
    if ("shortcuts" in data && Array.isArray((data as any).shortcuts?.results)) {
        return (data as any).shortcuts.results as Shortcut[];
    }
    if ("results" in data && Array.isArray((data as any).results)) {
        return (data as any).results as Shortcut[];
    }
    return [];
}

/* ===== Service API ===== */
export async function apiFetchShortcuts(): Promise<Shortcut[]> {
    try {
        const { data } = await api.get<ShortcutsEnvelope>("/v1/shortcuts");
        return extractShortcuts(data);
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to load shortcuts"));
    }
}

/* ========= About Types ========= */
export interface About {
    _id: string;
    name: string;
    state?: string;
    title?: string;
    image?: {
        secure_url?: string;
        url?: string;
    } | null;
    link?: string;
    content?: {
        brief?: string;
        extended?: string;
    };
    relatedtours?: any[];
}

export type AboutsEnvelope =
    | { abouts: { results: About[] } }
    | { results: About[] }
    | About[];

/** Normalize /v1/abouts/ response */
function extractAbouts(data: AboutsEnvelope): About[] {
    if (Array.isArray(data)) return data;
    if ("abouts" in data && Array.isArray((data as any).abouts?.results)) {
        return (data as any).abouts.results as About[];
    }
    if ("results" in data && Array.isArray((data as any).results)) {
        return (data as any).results as About[];
    }
    return [];
}

/* ========= About API ========= */
export async function apiFetchAbouts(): Promise<About[]> {
    try {
        const { data } = await api.get<AboutsEnvelope>("/v1/abouts");
        return extractAbouts(data);
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to load abouts"));
    }
}

/* ========= Events Types ========= */
export interface EventItem {
    _id: string;
    title: string;
    description?: string;
    image?: {
        secure_url?: string;
        url?: string;
    } | null;
    displaydate?: string;
    eventmonth?: string;
    state?: string;
    priority?: number;
    monument?: {
        _id: string;
        title: string;
    } | null;
}

export type EventsEnvelope =
    | { events: { results: EventItem[]; total?: number } }
    | { results: EventItem[] }
    | EventItem[];

/** Normalize /v1/events response */
function extractEvents(data: EventsEnvelope): EventItem[] {
    if (Array.isArray(data)) return data;
    if ("events" in data && Array.isArray((data as any).events?.results)) {
        return (data as any).events.results as EventItem[];
    }
    if ("results" in data && Array.isArray((data as any).results)) {
        return (data as any).results as EventItem[];
    }
    return [];
}

/* ========= Events API ========= */
export async function apiFetchEvents(): Promise<EventItem[]> {
    try {
        const { data } = await api.get<EventsEnvelope>("/v1/events");
        return extractEvents(data);
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to load events"));
    }
}

// Place Types
export interface PlaceImage {
  secure_url?: string;
  url?: string;
  public_id?: string;
}

export interface PlaceCategory {
  _id: string;
  title: string;
  name: string;
  image?: PlaceImage;
}

export interface PlaceItem {
  _id: string;
  title: string;
  name: string;
  location?: [number, number];
  content?: {
    brief: string;
    extended: string;
  };
  image?: PlaceImage;
  state?: string;
  category?: PlaceCategory;
}

export interface PlacesEnvelope {
  places?: {
    total: number;
    results: PlaceItem[];
  };
  results?: PlaceItem[];
}

/** Normalize /v1/place response */
function extractPlaces(data: any): PlaceItem[] {
  if (Array.isArray(data)) return data;

  if (data?.places?.results && Array.isArray(data.places.results)) {
    return data.places.results;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

/* ========= Places API ========= */
export async function apiFetchPlaces(): Promise<PlaceItem[]> {
  try {
    const { data } = await api.get<PlacesEnvelope>("/v1/places");
    return extractPlaces(data);
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Failed to load places"));
  }
}


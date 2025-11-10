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

/* ========= Theme Types ========= */
export interface ThemeItem {
  _id: string;
  title: string;
  image?: {
    secure_url?: string;
    url?: string;
  } | null;
}

export interface ThemesEnvelope {
  themes?: {
    total: number;
    results: ThemeItem[];
  };
  results?: ThemeItem[];
}

/** Normalize /v1/themes response */
function extractThemes(data: any): ThemeItem[] {
  if (Array.isArray(data)) return data;
  if (data?.themes?.results && Array.isArray(data.themes.results)) {
    return data.themes.results;
  }
  if (Array.isArray(data?.results)) {
    return data.results;
  }
  return [];
}

/* ========= Themes API ========= */
/**
 * 🔹 Fetch all themes
 * GET /v1/themes
 */
export async function apiFetchThemes(): Promise<ThemeItem[]> {
  try {
    const { data } = await api.get<ThemesEnvelope>("/v1/themes");
    return extractThemes(data);
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Failed to load themes"));
  }
}

/* ========= Subtheme Types ========= */
export interface SubthemeItem {
  _id: string;
  slug?: string;
  name?: string;
  state?: string;
  title?: string;
  description?: string;
  sortOrder?: number;
  priority?: number | null;
  image?: {
    secure_url?: string;
    url?: string;
  } | null;
  theme?: {
    _id: string;
    slug?: string;
    name?: string;
    title?: string;
  }[];
}

export interface SubthemesEnvelope {
  subthemes?: {
    total: number;
    results: SubthemeItem[];
  };
  results?: SubthemeItem[];
}

/** Normalize /v1/subthemes response */
function extractSubthemes(data: any): SubthemeItem[] {
  if (Array.isArray(data)) return data;
  if (data?.subthemes?.results && Array.isArray(data.subthemes.results)) {
    return data.subthemes.results;
  }
  if (Array.isArray(data?.results)) {
    return data.results;
  }
  return [];
}

/* ========= Subthemes API ========= */
/**
 * 🔹 Fetch subthemes dynamically with filter & sort (raw URL, no encoding)
 * Example:
 * apiFetchSubthemesWithQuery({
 *   filter: { theme: "609e37a8c463476d312ba4b9" },
 *   sort: "sortOrder"
 * });
 *
 * ✅ Calls:
 * /v1/subthemes?filter={"theme":"609e37a8c463476d312ba4b9"}&sort=sortOrder
 */
export async function apiFetchSubthemesWithQuery({
  filter,
  sort,
}: {
  filter?: Record<string, any>;
  sort?: string;
}): Promise<SubthemeItem[]> {
  try {
    // Build query string exactly as Postman
    let query = "";

    if (filter) {
      const filterString = JSON.stringify(filter);
      query += `filter=${filterString}`;
    }

    if (sort) {
      query += (query ? "&" : "") + `sort=${sort}`;
    }

    const url = `/v1/subthemes${query ? `?${query}` : ""}`;

    const { data } = await api.get<SubthemesEnvelope>(url);

    return extractSubthemes(data);
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Failed to load subthemes"));
  }
}


/* ========= Events by Monument (Server Filter) ========= */
/**
 * 🔹 Fetch events filtered by related monument (server-side filter)
 * Example: /v1/events?filter={"relatedmonument":"60a36932c463476d312ba82f"}
 */
export async function apiFetchEventsByMonument(monumentId: string): Promise<EventItem[]> {
  try {
    // Build encoded filter query
    const filter = encodeURIComponent(JSON.stringify({ relatedmonument: monumentId }));
    const url = `/v1/events?filter=${filter}`;

    const { data } = await api.get<EventsEnvelope>(url);
    return extractEvents(data);
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Failed to load events for monument"));
  }
}

// Bookmark API
export interface BookmarkPayload {
  marktype: string;
  user: string;
  monument?: string;
  place?: string;
  tour?: string;
  status: string;
}

export interface BookmarkResponse {
  success: boolean;
  message?: string;
  data?: { _id: string };
}
/* ------------ API Methods ------------ */

/** ✅ Create Bookmark */
export async function apiCreateBookmark(
  payload: BookmarkPayload
): Promise<BookmarkResponse> {
  try {
    const { data } = await api.post<BookmarkResponse>("/v1/bookmarks", payload);
    return data;
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Failed to create bookmark"));
  }
}

/** ✅ Remove Bookmark (by monument ID, not bookmark ID) */
export async function apiRemoveBookmark(refId: string): Promise<void> {
  if (!refId) {
    // extra safety guard in case someone calls it with null/empty
    console.warn("apiRemoveBookmark called with empty refId");
    return;
  }

  try {
    await api.patch(`/v1/bookmarks/${refId}`, { status: "remove" });
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Failed to remove bookmark"));
  }
}

/** ✅ Fetch Bookmark by user + marktype + ref ID */
export async function apiFetchBookmarkByRef(): Promise<{ _id?: string } | null> {
  try {
    const { data } = await api.get(`/v1/bookmarks`);
    const result = Array.isArray(data?.results) ? data.results[0] : data;
    return result || null;
  } catch {
    return null;
  }
}
// src/lib/services/userGlobalservice.ts
import api from "@/lib/api";

import type { Shortcut, About, EventItem, PlaceItem, ThemeItem, SubthemeItem, SearchFilter, SearchSuggestion } from "@/lib/types/userGlobal.types";

/* ===== Shortcuts API'S ===== */

export type ShortcutsEnvelope =
  | { shortcuts: { results: Shortcut[] } }
  | { results: Shortcut[] }
  | Shortcut[];

function parseAxiosError(err: any, fallback: string) {
  return err?.response?.data?.message || err?.message || fallback;
}

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

export async function apiFetchShortcuts(): Promise<Shortcut[]> {
  try {
    const { data } = await api.get<ShortcutsEnvelope>("/v1/shortcuts");
    return extractShortcuts(data);
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Failed to load shortcuts"));
  }
}

/* ===== About API'S ===== */

export type AboutsEnvelope =
  | { abouts: { results: About[] } }
  | { results: About[] }
  | About[];

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

export async function apiFetchAbouts(): Promise<About[]> {
  try {
    const { data } = await api.get<AboutsEnvelope>("/v1/abouts");
    return extractAbouts(data);
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Failed to load abouts"));
  }
}

/* ===== Event API'S ===== */

export type EventsEnvelope =
  | { events: { results: EventItem[]; total?: number } }
  | { results: EventItem[] }
  | EventItem[];

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

export async function apiFetchEvents(): Promise<EventItem[]> {
  try {
    const { data } = await api.get<EventsEnvelope>("/v1/events");
    return extractEvents(data);
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Failed to load events"));
  }
}

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

/* ===== Place API'S ===== */

export interface PlacesEnvelope {
  places?: {
    total: number;
    results: PlaceItem[];
  };
  results?: PlaceItem[];
}

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

export async function apiFetchPlaces(): Promise<PlaceItem[]> {
  try {
    const { data } = await api.get<PlacesEnvelope>("/v1/places");
    return extractPlaces(data);
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Failed to load places"));
  }
}

/* ===== Theme API'S ===== */

export interface ThemesEnvelope {
  themes?: {
    total: number;
    results: ThemeItem[];
  };
  results?: ThemeItem[];
}

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

export async function apiFetchThemes(): Promise<ThemeItem[]> {
  try {
    const { data } = await api.get<ThemesEnvelope>("/v1/themes");
    return extractThemes(data);
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Failed to load themes"));
  }
}

/* ===== Subtheme API'S ===== */

export interface SubthemesEnvelope {
  subthemes?: {
    total: number;
    results: SubthemeItem[];
  };
  results?: SubthemeItem[];
}

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

export async function apiFetchSubthemesWithQuery({
  filter,
  sort,
}: {
  filter?: Record<string, any>;
  sort?: string;
}): Promise<SubthemeItem[]> {
  try {
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

/* ===== Bookmarks API'S ===== */

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

export async function apiRemoveBookmark(refId: string): Promise<void> {
  if (!refId) {
    console.warn("apiRemoveBookmark called with empty refId");
    return;
  }

  try {
    await api.patch(`/v1/bookmarks/${refId}`, { status: "remove" });
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Failed to remove bookmark"));
  }
}

export async function apiFetchBookmarkByRef(): Promise<{ _id?: string } | null> {
  try {
    const { data } = await api.get(`/v1/bookmarks`);
    const result = Array.isArray(data?.results) ? data.results[0] : data;
    return result || null;
  } catch {
    return null;
  }
}

/* ===== Search API'S ===== */

export interface SearchFiltersEnvelope {
  searchfilters?: {
    total: number;
    results: SearchFilter[];
  };
  results?: SearchFilter[];
}

function extractSearchFilters(data: any): SearchFilter[] {
  if (Array.isArray(data)) return data;

  if (data?.searchfilters?.results && Array.isArray(data.searchfilters.results)) {
    return data.searchfilters.results;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

export async function apiFetchSearchFilters(): Promise<SearchFilter[]> {
  try {
    const { data } = await api.get<SearchFiltersEnvelope>("/v1/searchfilters");
    return extractSearchFilters(data);
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Failed to load search filters"));
  }
}

export interface SearchSuggestionsEnvelope {
  suggestions?: SearchSuggestion[];
}

function extractSearchSuggestions(data: any): SearchSuggestion[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.suggestions)) return data.suggestions;
  return [];
}

export async function apiFetchSearchSuggestionsAdv(
  keyword: string
): Promise<SearchSuggestion[]> {
  if (!keyword || !keyword.trim()) return [];

  try {
    const encodedKeyword = encodeURIComponent(keyword.trim());
    const { data } = await api.get<SearchSuggestionsEnvelope>(
      `/v1/searchsuggestionsadv?keyword=${encodedKeyword}`
    );
    return extractSearchSuggestions(data);
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Failed to load search suggestions"));
  }
}

export interface FreeTextSearchResponse {
  monuments: any[];
  regions: any[];
}

export async function apiFetchFreeTextSearch(
  keyword: string
): Promise<FreeTextSearchResponse> {
  if (!keyword || !keyword.trim()) {
    return { monuments: [], regions: [] };
  }

  try {
    const encodedKeyword = encodeURIComponent(keyword.trim());
    const { data } = await api.get<FreeTextSearchResponse>(
      `/v1/freetextsearch?keyword=${encodedKeyword}`
    );
    return {
      monuments: Array.isArray(data.monuments) ? data.monuments : [],
      regions: Array.isArray(data.regions) ? data.regions : [],
    };
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Failed to perform free-text search"));
  }
}

/* ===== UserProfile API'S ===== */

export interface UserProfileUpdatePayload {
  name?: string;
  gender?: string;
  agegroup?: string;
  country?: string;
  nationality?: string;
  phoneNumber?: string | number;
}

export async function apiUpdateUserProfile(
  userId: string,
  payload: UserProfileUpdatePayload
) {
  try {
    const { data } = await api.patch(`/v1/userprofiles/${userId}`, payload);
    return data;
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Failed to update profile"));
  }
}

export async function apiUploadProfileImage(userId: string, file: File) {
  const fd = new FormData();
  fd.append("_id", userId);
  fd.append("image_upload", file);

  const { data } = await api.post("/v1/profileimage", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}



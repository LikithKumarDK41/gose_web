import api from "@/lib/api";

/* ------------------------------------------------------------
   📘 Types
------------------------------------------------------------ */
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

export interface TourContent {
    brief?: string;
    extended?: string;
}

export interface Tour {
    _id: string;
    title: string;
    duration?: string;
    traveltime?: string;
    link?: string;
    routeJson?: string;
    routeImage?: CloudinaryImage;
    content?: TourContent;
    image?: CloudinaryImage;
    monuments?: any[];
    featured?: boolean;
}

export interface Monument {
    _id?: string;
    title?: string;
    image?: CloudinaryImage;
    [key: string]: any;
}

export type MarkType = "monument" | "tour";

export interface Bookmark {
    _id: string;
    user?: string;
    marktype?: MarkType;
    marktime?: string;
    status?: string;
    markid?: string;
    monument?: Monument;
    tour?: Tour;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: any;
}

export interface BookmarksData {
    total: number;
    results: Bookmark[];
}

export interface BookmarksResponse {
    bookmarks: BookmarksData;
}

export interface CreateBookmarkPayload {
    marktype: MarkType;
    user: string;
    monument?: string;
    tour?: string;
    status?: string;
}

/* ------------------------------------------------------------
   🆕 Visit History Types
------------------------------------------------------------ */
export type HistoryType = "monument" | "tour";

export interface VisitHistoryPayload {
    user: string;
    historytype: HistoryType;
    monument?: string;
    tour?: string;
    historytime?: string | null;
    visitmode?: "auto" | "manual";
    status?: string;
    historyid?: string;
}

export interface VisitHistory {
    _id: string;
    user: string;
    historytype: HistoryType;
    visitmode: "auto" | "manual";
    status: string;
    historytime?: string | null;
    monument?: Monument;
    tour?: Tour;
    historyid?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface VisitHistoryResponse {
    visithistories: {
        total: number;
        results: VisitHistory[];
    };
}

/* ------------------------------------------------------------
   ⚙️ Helpers
------------------------------------------------------------ */
function parseAxiosError(err: any, fallback: string): string {
    return err?.response?.data?.message || err?.message || fallback;
}

/* ------------------------------------------------------------
   🌐 API Services - Bookmarks
------------------------------------------------------------ */

/** Fetch all bookmarks of the current user */
export async function apiGetBookmarks(): Promise<BookmarksResponse> {
    try {
        const { data } = await api.get<BookmarksResponse>("/v1/bookmarks");
        return data;
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to fetch bookmarks"));
    }
}

/** Fetch single bookmark by ID */
export async function apiGetBookmarkById(id: string): Promise<Bookmark> {
    try {
        const { data } = await api.get<Bookmark>(`/v1/bookmarks/${id}`);
        return data;
    } catch (err: any) {
        throw new Error(parseAxiosError(err, `Failed to fetch bookmark with ID: ${id}`));
    }
}

/** Create a new bookmark (for either monument or tour) */
export async function apiCreateBookmark(payload: CreateBookmarkPayload): Promise<Bookmark> {
    try {
        const body: any = {
            marktype: payload.marktype,
            user: payload.user,
            status: payload.status || "active",
        };

        if (payload.marktype === "monument" && payload.monument) {
            body.monument = payload.monument;
        } else if (payload.marktype === "tour" && payload.tour) {
            body.tour = payload.tour;
        } else {
            throw new Error("Invalid payload: monument or tour ID is required based on marktype");
        }

        const { data } = await api.post<Bookmark>("/v1/bookmarks", body);
        return data;
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to create bookmark"));
    }
}

/* ------------------------------------------------------------
   🌐 API Services - Visit Histories
------------------------------------------------------------ */

/**
 * 🧭 Get all visit histories
 * GET /v1/visithistories
 */
export async function apiGetVisitHistories(): Promise<VisitHistoryResponse> {
    try {
        const { data } = await api.get<VisitHistoryResponse>("/v1/visithistories");
        return data;
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to fetch visit histories"));
    }
}

/**
 * 🧭 Get single visit history by ID
 * GET /v1/visithistories/:id
 */
export async function apiGetVisitHistoryById(id: string): Promise<VisitHistory> {
    try {
        const { data } = await api.get<VisitHistory>(`/v1/visithistories/${id}`);
        return data;
    } catch (err: any) {
        throw new Error(parseAxiosError(err, `Failed to fetch visit history with ID: ${id}`));
    }
}

/**
 * 🧭 Create a new visit history
 * POST /v1/visithistories
 */
export async function apiCreateVisitHistory(
    payload: VisitHistoryPayload
): Promise<VisitHistory> {
    try {
        const { data } = await api.post<VisitHistory>("/v1/visithistories", payload);
        return data;
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to create visit history"));
    }
}


import api from "@/lib/api";

import type { Bookmark, MarkType, HistoryType, VisitHistory, MonumentVisitHistory, TourVisitHistory } from "@/lib/types/userMyList.types";

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

export interface VisitHistoryResponse {
    visithistories: {
        total: number;
        results: VisitHistory[];
    };
}

export interface UserVisitHistoryResponse {
    monuments: MonumentVisitHistory[];
    tours: TourVisitHistory[];
}


function parseAxiosError(err: any, fallback: string): string {
    return err?.response?.data?.message || err?.message || fallback;
}

export async function apiGetBookmarks(): Promise<BookmarksResponse> {
    try {
        const { data } = await api.get<BookmarksResponse>("/v1/bookmarks");
        return data;
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to fetch bookmarks"));
    }
}

export async function apiGetBookmarkById(id: string): Promise<Bookmark> {
    try {
        const { data } = await api.get<Bookmark>(`/v1/bookmarks/${id}`);
        return data;
    } catch (err: any) {
        throw new Error(parseAxiosError(err, `Failed to fetch bookmark with ID: ${id}`));
    }
}

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

export async function apiGetVisitHistories(): Promise<VisitHistoryResponse> {
    try {
        const { data } = await api.get<VisitHistoryResponse>("/v1/visithistories");
        return data;
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to fetch visit histories"));
    }
}

export async function apiGetVisitHistoryById(id: string): Promise<VisitHistory> {
    try {
        const { data } = await api.get<VisitHistory>(`/v1/visithistories/${id}`);
        return data;
    } catch (err: any) {
        throw new Error(parseAxiosError(err, `Failed to fetch visit history with ID: ${id}`));
    }
}

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

export async function apiGetVisitHistoryByUser(): Promise<UserVisitHistoryResponse> {
    try {
        const { data } = await api.post<UserVisitHistoryResponse>("/v2/visithistory");
        return data;
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to fetch user's visit history"));
    }
}

export async function apiDeleteVisitHistory(id: string): Promise<VisitHistory> {
    try {
        const { data } = await api.patch<VisitHistory>(
            `/v1/visithistories/${id}`,
            { status: "remove" }
        );
        return data;
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to delete visit history"));
    }
}

export async function apiGetUserBookmarks(): Promise<{
    monuments: any[];
    tours: any[];
}> {
    try {
        const { data } = await api.post("/v2/userbookmark");
        return data;
    } catch (err: any) {
        throw new Error(
            parseAxiosError(err, "Failed to fetch user's bookmark list")
        );
    }
}

export async function apiDeleteBookmark(id: string): Promise<Bookmark> {
    try {
        const { data } = await api.patch<Bookmark>(
            `/v1/bookmarks/${id}`,
            { status: "remove" }
        );
        return data;
    } catch (err: any) {
        throw new Error(
            parseAxiosError(err, `Failed to delete bookmark with ID: ${id}`)
        );
    }
}






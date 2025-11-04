// src/lib/services/userNav.service.ts
import api from "@/lib/api";

/* ========= Types ========= */
export type NavProfile = "walking" | "driving" | "cycling";
export type NavStatus = "idle" | "running" | "paused" | "stopped";
export type SyncStatus = "start" | "pause" | "end";

export interface SyncPayload {
    userId: string;
    tourId: string;
    status: SyncStatus;
    location?: [string, string];
}

export interface UserTourSyncResponse {
    success?: boolean;
    // shape may vary based on backend; keep it open:
    [k: string]: any;
}

/* ========= Helpers ========= */
function parseAxiosError(err: any, fallback: string) {
    return err?.response?.data?.message || err?.message || fallback;
}

/* ========= Service API ========= */
export async function apiSyncUserTourStatus(
    payload: SyncPayload
): Promise<UserTourSyncResponse> {
    const body = {
        user: payload.userId,
        tour: payload.tourId,
        status: payload.status,
        updatedtime: Date.now().toString(),
        location: payload.location ?? ["0", "0"],
    };

    try {
        const { data } = await api.post<UserTourSyncResponse>("/v1/usertours", body);
        return data;
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to sync tour status"));
    }
}

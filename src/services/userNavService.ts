// src/lib/services/userNav.service.ts
import api from "@/lib/api";

import type { CloudinaryImage, TourPoint } from "@/lib/types/userTour.types";
import type {
  SyncStatus,
} from "@/lib/types/userNav.types";

export interface SyncPayload {
    userId: string;
    tourId: string;
    status: SyncStatus;
    location?: [string, string];
}

export interface UserTourSyncResponse {
    success?: boolean;
    [k: string]: any;
}

function parseAxiosError(err: any, fallback: string) {
    return err?.response?.data?.message || err?.message || fallback;
}

/* =======================
   SYNC /v1/usertours
======================= */
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

/* =======================
   GET USER TOUR STATUS
   POST /v2/usertourstatus
======================= */
export interface UserTourStatusResponse {
    usertours: {
        _id: string;
        user: string;
        status: string;
        updatedtime: string;
        createdtime: string;
        tour: {
            _id: string;
            title: string;
            content?: { brief?: string; extended?: string };
            duration?: string;
            traveltime?: string;
            link?: string;
            featured?: boolean;
            image?: CloudinaryImage;
        };
    };
}

export async function apiGetUserTourStatus(
    tourId: string
): Promise<UserTourStatusResponse> {
    try {
        const { data } = await api.post<UserTourStatusResponse>(
            "/v2/usertourstatus",
            { tour: tourId }
        );
        return data;
    } catch (err: any) {
        throw new Error(parseAxiosError(err, "Failed to fetch user tour status"));
    }
}

/* =========================================================================
   ⭐ Create Stamp (POST /v1/stamps)
   ========================================================================= */
export interface CreateStampPayload {
    monument: string;
    user: string;
    tourpoint: string;
    status?: string; // default: "active"
    stamptime?: string | number; // timestamp
}

export interface CreateStampResponse {
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

export async function apiCreateStamp(
    payload: CreateStampPayload
): Promise<CreateStampResponse> {
    try {
        const body = {
            monument: payload.monument,
            user: payload.user,
            tourpoint: payload.tourpoint,
            status: payload.status ?? "active",
            stamptime: payload.stamptime ?? Date.now(),
        };

        const { data } = await api.post<CreateStampResponse>("/v1/stamps", body);
        return data;
    } catch (err: any) {
        throw new Error(
            err?.response?.data?.message || err?.message || "Failed to create stamp"
        );
    }
}

/* =========================================================================
   ⭐ Get User Tourpoints (POST /v2/usertourpoint)
   ========================================================================= */
export interface UserTourPointResponse {
    tourpoints: TourPoint[];
}

export async function apiGetUserTourPoints(
    tourId: string,
    usertourId: string
): Promise<UserTourPointResponse> {
    try {
        const body = {
            tour: tourId,
            usertour: usertourId,
        };

        const { data } = await api.post<UserTourPointResponse>(
            "/v2/usertourpoint",
            body
        );

        return data;
    } catch (err: any) {
        throw new Error(
            err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch tourpoints"
        );
    }
}



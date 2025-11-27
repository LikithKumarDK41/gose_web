import type { Tour, Monument } from "@/lib/types/userTour.types";

export type MarkType = "monument" | "tour";

export type HistoryType = "monument" | "tour";

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

export interface MonumentVisitHistory {
    _id: string;
    user: string;
    visitmode: "manual" | "auto";
    historytime: string;
    historytype: "monument";
    status: string;
    monument: Monument;
    historytimes?: string[];
    historytimesObj?: {
        historytime: string;
        byTour: boolean;
    }[];
}

export interface TourVisitHistory {
    _id: string;
    user: string;
    status: string; // start, end, etc.
    createdtime: string;
    updatedtime: string;
    tour: Tour;
}

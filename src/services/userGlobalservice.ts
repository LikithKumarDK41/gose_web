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

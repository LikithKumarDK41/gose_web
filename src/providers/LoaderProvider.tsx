// src/components/system/LoaderProvider.tsx
"use client";
import {
    createContext,
    useContext,
    useRef,
    useState,
    useCallback,
    useEffect,
} from "react";
import { FullScreenLoader } from "../components/system/FullScreenLoader";

type Ctx = { visible: boolean; show: () => void; hide: () => void };
const LoaderCtx = createContext<Ctx | null>(null);

export function useGlobalLoader() {
    const ctx = useContext(LoaderCtx);
    if (!ctx) throw new Error("useGlobalLoader must be used within LoaderProvider");
    return ctx;
}

export default function LoaderProvider({ children }: { children: React.ReactNode }) {
    const [visible, setVisible] = useState(false);
    const raf = useRef<number | null>(null);

    const schedule = (fn: () => void) => {
        if (raf.current) cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(fn);
    };

    // ✅ stable callbacks
    const show = useCallback(() => schedule(() => setVisible(true)), []);
    const hide = useCallback(() => schedule(() => setVisible(false)), []);

    // Cleanup RAF on unmount
    useEffect(() => {
        return () => {
            if (raf.current) cancelAnimationFrame(raf.current);
        };
    }, []);

    const value: Ctx = { visible, show, hide };

    return (
        <LoaderCtx.Provider value={value}>
            {children}
            {visible && <FullScreenLoader />}
        </LoaderCtx.Provider>
    );
}

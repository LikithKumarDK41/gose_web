// src/components/system/LoaderProvider.tsx
"use client";
import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
} from "react";
import { usePathname } from "next/navigation";
import { FullScreenLoader } from "./FullScreenLoader";

type Ctx = { visible: boolean; show: () => void; hide: () => void };
const LoaderCtx = createContext<Ctx | null>(null);

export function useGlobalLoader() {
    const ctx = useContext(LoaderCtx);
    if (!ctx) throw new Error("useGlobalLoader must be used within LoaderProvider");
    return ctx;
}

export default function LoaderProvider({ children }: { children: React.ReactNode }) {
    const [visible, setVisible] = useState(false);
    const pathname = usePathname();
    const raf = useRef<number | null>(null);

    // Utility to safely schedule state
    const schedule = (fn: () => void) => {
        if (raf.current) cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(() => {
            // startTransition keeps it low priority, avoids warnings in strict cases
            startTransition(fn);
        });
    };

    // Hide shortly after the route actually changed (deferred)
    useEffect(() => {
        const t = setTimeout(() => schedule(() => setVisible(false)), 150);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    // Optional: show during browser back/forward (deferred)
    useEffect(() => {
        const onPopState = () => schedule(() => setVisible(true));
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        return () => {
            if (raf.current) {
                cancelAnimationFrame(raf.current);
            }
        };
    }, []);

    const value = useMemo<Ctx>(
        () => ({
            visible,
            show: () => schedule(() => setVisible(true)),
            hide: () => schedule(() => setVisible(false)),
        }),
        [visible]
    );

    return (
        <LoaderCtx.Provider value={value}>
            {children}
            {visible && <FullScreenLoader />}
        </LoaderCtx.Provider>
    );
}

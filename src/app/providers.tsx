"use client";
import { useEffect } from "react";
import { StoreProvider } from "@/lib/store";

export default function Providers({ children }: { children: React.ReactNode }) {
    // useEffect(() => {
    //     if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => { });
    // }, []);
    return <StoreProvider>{children}</StoreProvider>;
}

// src/components/nav/BrandLogo.tsx
"use client";

import Link from "next/link";
import { Navigation } from "lucide-react";

export default function BrandLogo({
    href = "/",
    label = "Tourist",
}: {
    href?: string;
    label?: string;
}) {
    return (
        <Link
            href={href}
            aria-label={label}
            className="group relative inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5"
        >
            {/* soft glow behind */}
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-indigo-500/15 via-sky-500/15 to-emerald-500/15 blur-sm transition-opacity group-hover:opacity-100"
            />

            {/* icon tile */}
            <span className="relative grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-sm ring-1 ring-white/20 transition-transform group-hover:scale-105">
                <Navigation className="h-[15px] w-[15px]" />
                {/* tiny highlight */}
                <span
                    aria-hidden
                    className="pointer-events-none absolute -inset-1 -z-10 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 blur-[6px] transition-opacity group-hover:opacity-60"
                />
            </span>

            {/* gradient brand text */}
            <span className="hidden select-none bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 bg-clip-text text-sm font-extrabold tracking-tight text-transparent sm:inline">
                {label}
            </span>
        </Link>
    );
}

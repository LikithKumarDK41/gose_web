"use client";

import Link from "next/link";
import Image from "next/image";

export default function BrandLogo({
    href = "/",
    label = "Gose City Tours",
}: {
    href?: string;
    label?: string;
}) {
    return (
        <Link
            href={href}
            aria-label={label}
            className="group relative inline-flex items-center rounded-xl"
        >
            {/* 🌟 Unified soft glow behind image + text */}
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 rounded-xl
        bg-gradient-to-r from-sky-400/15 via-cyan-400/15 to-emerald-400/15
        dark:from-sky-400/25 dark:via-cyan-400/25 dark:to-emerald-400/25
        blur-lg transition-all duration-700 opacity-80 group-hover:blur-xl group-hover:opacity-100"
            />

            {/* 🖼️ Image + Text grouped inside one glowing wrapper */}
            <div className="relative flex items-center">
                {/* Logo Image */}
                <Image
                    src="/logos/gose_logo.png"
                    alt={label}
                    width={50}
                    height={50}
                    className="object-contain transition-transform duration-500 group-hover:scale-105"
                    priority
                />

                {/* Logo Text */}
                <div className="flex flex-col leading-tight select-none">
                    <span
                        className="text-[15px] font-bold bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 
                       bg-clip-text text-transparent drop-shadow-[0_0_6px_rgba(56,189,248,0.7)]"
                    >
                        御所市観光ナビ
                    </span>
                    <span
                        className="text-[12px] font-medium text-gray-700 dark:text-gray-300 tracking-wide"
                    >
                        {label}
                    </span>
                </div>
            </div>
        </Link>
    );
}

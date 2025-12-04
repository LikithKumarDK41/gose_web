"use client";

import { useLocale } from "@/providers/LocaleProvider";
import { useGlobalLoader } from "@/providers/LoaderProvider";
import { Button } from "@/components/ui/button";
// import { Globe, Languages, Kanji } from "lucide-react";
import { Languages, Kanban } from "lucide-react";

const SUPPORTED = ["en", "ja"] as const;
type Lang = (typeof SUPPORTED)[number];

export default function LanguageToggle() {
    const { locale, setLocale } = useLocale();
    const { show, hide } = useGlobalLoader();

    const cycle = async () => {
        const currentIndex = SUPPORTED.indexOf(locale as Lang);
        const next = SUPPORTED[(currentIndex + 1) % SUPPORTED.length];

        const MIN_DURATION = 800; // ms
        const start = Date.now();

        try {
            show();
            await setLocale(next); // load translations
        } finally {
            const elapsed = Date.now() - start;
            const remaining = MIN_DURATION - elapsed;
            if (remaining > 0) {
                setTimeout(() => hide(), remaining);
            } else {
                hide();
            }
        }
    };

    const color = locale === "en" ? "text-blue-500" : "text-red-500";
    const icon =
        locale === "en" ? (
            <Languages className="h-5 w-5 text-blue-400" />
        ) : (
            <Kanban className="h-5 w-5 text-red-400" />
        );

    return (
        <button
            onClick={cycle}
            title={`Language: ${locale.toUpperCase()}`}
            className="
        h-9 w-9 flex items-center justify-center
        rounded-full border border-white/20
        bg-black/20 backdrop-blur-md
        hover:bg-white/10 transition
      "
        >
            {icon}
        </button>
    );
}

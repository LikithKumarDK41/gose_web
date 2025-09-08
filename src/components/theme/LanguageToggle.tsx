"use client";

import { useLocale } from "@/providers/LocaleProvider";
import { useGlobalLoader } from "@/providers/LoaderProvider";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

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

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={cycle}
            title={`Language: ${locale.toUpperCase()}`}
        >
            <Globe className={`h-4 w-4 ${color}`} />
            <span className="sr-only">Toggle language</span>
        </Button>
    );
}

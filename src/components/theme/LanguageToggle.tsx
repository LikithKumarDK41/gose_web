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

        const MIN_DURATION = 800; // ms, increased for better visibility
        const start = Date.now();

        try {
            show(); // show loader immediately
            await setLocale(next); // load translations
            document.documentElement.setAttribute("lang", next);
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

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={cycle}
            title={`Language: ${locale.toUpperCase()}`}
        >
            {locale === "en" ? (
                <Globe className="h-4 w-4 text-blue-500" />
            ) : (
                <Globe className="h-4 w-4 text-red-500" />
            )}
            <span className="sr-only">Toggle language</span>
        </Button>
    );
}

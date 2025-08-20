"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const SUPPORTED = ["en", "jp"] as const;
type Lang = (typeof SUPPORTED)[number];

export default function LanguageToggle() {
    const [lang, setLang] = useState<Lang>("en");

    useEffect(() => {
        const saved = (localStorage.getItem("lang") as Lang) || "en";
        setLang(saved);
        document.documentElement.setAttribute("lang", saved);
    }, []);

    const cycle = () => {
        setLang((prev) => {
            const next = prev === "en" ? "jp" : "en";
            localStorage.setItem("lang", next);
            document.documentElement.setAttribute("lang", next);
            return next;
        });
    };

    return (
        <Button variant="outline" size="icon" onClick={cycle} title={`Language: ${lang.toUpperCase()}`}>
            <Globe className="h-4 w-4" />
            <span className="sr-only">Toggle language</span>
        </Button>
    );
}

"use client";

import { useEffect, useState } from "react";
import { apiFetchAbouts } from "@/services/userGlobalservice";
import type { About } from "@/services/userGlobalservice";

export default function AboutGosePage() {
    const [abouts, setAbouts] = useState<About[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("about-gose-location");

    const tabs = [
        { key: "about-gose-location", label: "御所市の位置" },
        { key: "about-gose-history", label: "御所市の歴史" },
        { key: "about-gose-logo", label: "御所市の沿革" },
    ];

    useEffect(() => {
        async function load() {
            try {
                const data = await apiFetchAbouts();
                setAbouts(data);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading)
        return (
            <p className="text-center py-10 text-emerald-500 dark:text-teal-300 animate-pulse">
                読み込み中...
            </p>
        );

    const item = abouts.find((a) => a.name === activeTab);

    return (
        <div className="min-h-screen">
            {/* ==== HERO SECTION ==== */}
            <section className="relative w-full mx-auto bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-2xl shadow-lg mt-4 mb-10">
                <div className="max-w-5xl mx-auto py-16 px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide mb-3 drop-shadow-md">
                        御所市って？
                    </h1>
                    <p className="text-lg md:text-xl font-medium opacity-90">
                        歴史と自然が息づくまち「御所市」— 古代から続く文化と豊かな景観を持つ魅力あふれる土地。
                    </p>
                </div>

                {/* Subtle overlay for glow depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-black/5 to-black/20 rounded-2xl pointer-events-none" />
            </section>

            {/* ==== TAB BUTTONS ==== */}
            <div className="flex justify-center mt-4 px-4">
                <div className="bg-white/70 dark:bg-white/10 rounded-full p-1 flex flex-wrap justify-center gap-1 shadow-lg backdrop-blur border border-emerald-200 dark:border-emerald-700">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`px-5 md:px-7 py-2.5 rounded-full text-sm md:text-base font-medium transition-all duration-300
                ${activeTab === t.key
                                    ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-md"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-emerald-100/60 dark:hover:bg-white/10"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ==== CONTENT AREA ==== */}
            <div className="px-4 md:px-10 lg:px-24 mt-10 pb-16">
                {item ? (
                    <div
                        key={item.name}
                        className="animate-fade-slide rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-lg 
                       p-6 md:p-10 shadow-xl transition-all duration-300"
                    >
                        {/* Image Section */}
                        {item.image?.secure_url && (
                            <img
                                src={item.image.secure_url}
                                alt={item.title}
                                className="rounded-xl w-full h-auto max-h-[420px] object-contain mb-6"
                            />
                        )}

                        {/* Content Section */}
                        <div
                            className="prose prose-sm md:prose-base dark:prose-invert text-slate-800 dark:text-slate-100 
                         max-w-none leading-relaxed tracking-wide"
                            dangerouslySetInnerHTML={{ __html: item.content?.brief || "" }}
                        />
                    </div>
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-300 py-6">
                        データがありません
                    </p>
                )}
            </div>
        </div>
    );
}

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
        return <p className="text-center py-10 text-gray-500 dark:text-white/70">読み込み中...</p>;

    const item = abouts.find((a) => a.name === activeTab);

    return (
        <div className="w-full min-h-screen">
            {/* ==== HERO CARD ==== */}
            <div className="w-full px-4 md:px-24 flex justify-center">
                <div className="
      w-full max-w-[1100px] rounded-[28px] px-8 md:px-16 py-14 text-center shadow-xl
      border backdrop-blur-xl transition-all duration-300
      bg-white/80 border-slate-200
      dark:bg-slate-900/50 dark:border-slate-700
    "
                >

                    {/* Title */}
                    <h1 className="
        text-3xl md:text-4xl font-extrabold mb-3
        bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 
        dark:from-emerald-300 dark:via-teal-300 dark:to-indigo-400
        text-transparent bg-clip-text
      "
                    >
                        御所市って？
                    </h1>

                    {/* Subtitle */}
                    <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                        歴史と自然が息づくまち「御所市」を知ろう — 古代から続く文化と豊かな景観を持つ魅力あふれる土地。
                    </p>

                    {/* Decorative Bottom Fade */}
                    <div className="absolute inset-0 pointer-events-none rounded-[28px] overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-white dark:to-slate-900"></div>
                    </div>
                </div>
            </div>

            {/* ==== SEGMENT BUTTONS ==== */}
            <div className="flex justify-center mt-8 px-4">
                <div className="bg-white/70 dark:bg-white/10 rounded-full p-1 flex gap-1 shadow-lg backdrop-blur border border-gray-200 dark:border-gray-700">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`px-4 md:px-6 py-2 rounded-full text-sm transition-all
                                ${activeTab === t.key
                                    ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-white/10"
                                }
                            `}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ==== CONTENT WITH ANIMATION ==== */}
            <div className="px-4 md:px-32 mt-10">
                {item ? (
                    <div
                        key={item.name}
                        className="animate-fade-slide rounded-2xl bg-white/70 dark:bg-white/10 backdrop-blur border border-gray-200 dark:border-gray-700 p-6 md:p-10 shadow-xl"
                    >
                        {item.image?.secure_url && (
                            <img
                                src={item.image.secure_url}
                                alt={item.title}
                                className="rounded-xl w-full h-auto max-h-[420px] object-contain mb-6 shadow-md"
                            />
                        )}

                        <div
                            className="prose prose-sm md:prose-base dark:prose-invert text-gray-700 dark:text-gray-200 max-w-none leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: item.content?.brief || "" }}
                        />
                    </div>
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-300 py-6">データがありません</p>
                )}
            </div>
        </div>
    );
}

"use client";

import { useLocale } from "@/providers/LocaleProvider";

export default function CityPromotionPage() {
  const { t } = useLocale();

  return (
    <div className="w-full min-h-screen">
      {/* ==== HERO CARD ==== */}
      <div className="w-full px-4 md:px-24 flex justify-center pt-10">
        <div
          className="
            relative w-full max-w-[1100px] rounded-[28px] px-8 md:px-16 py-14 text-center shadow-xl
            border backdrop-blur-xl transition-all duration-300
            bg-white/80 border-slate-200
            dark:bg-slate-900/50 dark:border-slate-700
        "
        >
          <h1
            className="
              text-3xl md:text-4xl font-extrabold mb-3
             text-black dark:text-white
               bg-clip-text
            "
          >
            {t("city_promotion")}
          </h1>

          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            {t("city_promotion_desc")}
          </p>

          <div className="absolute inset-0 pointer-events-none rounded-[28px] overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-white dark:to-slate-900"></div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-32 mt-10 mb-20">
        <div className="animate-fade-slide rounded-2xl bg-white/70 dark:bg-white/10 backdrop-blur border border-gray-200 dark:border-gray-700 p-6 md:p-10 shadow-xl">
          <div className="rounded-xl overflow-hidden shadow-md mb-6 w-full aspect-video">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/KfOe4c8xeOs?si=QWcMXZ2KDfxd2GFu"
              title="Gose City Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>

          {/* Static Description under video */}
          <div className="prose dark:prose-invert text-gray-700 dark:text-gray-200 max-w-none leading-relaxed text-center">
            <p>{t("city_promotion_video_desc")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

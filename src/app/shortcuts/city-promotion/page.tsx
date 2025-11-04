"use client";

import { useLocale } from "@/providers/LocaleProvider";

export default function CityPromotionPage() {
  const { t } = useLocale();

  return (
    <div className="w-full min-h-screen">

       <section className="relative w-full mx-auto bg-gradient-to-r from-purple-800 via-indigo-800 to-blue-700 text-white rounded-2xl shadow-xl mt-4 mb-10">
        <div className="max-w-5xl mx-auto py-16 px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide mb-3 drop-shadow-md">
            {t("city_promotion")}
          </h1>
          <p className="text-lg md:text-xl font-medium opacity-90">
            {t("city_promotion_desc")}
          </p>
        </div>
      </section>

      <div className="px-4 md:px-10 lg:px-24 mt-10 pb-16">
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

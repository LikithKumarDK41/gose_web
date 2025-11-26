"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { apiFetchTours } from "@/services/userTourService";
import type { Tour } from "@/lib/types/userTour.types";
import { useLocale } from "@/providers/LocaleProvider";
import { useGlobalLoader } from "@/providers/LoaderProvider";

export default function ToursPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { show, hide } = useGlobalLoader();

  const [tours, setTours] = useState<Tour[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  /* ------------------------------------------------------------
     📦 Fetch Tours
  ------------------------------------------------------------ */
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        show();
        const data = await apiFetchTours();
        if (mounted) setTours(data);
      } catch (err: any) {
        console.error("Failed to fetch tours:", err);
        if (mounted) setError(err.message || t("errors.failed_to_fetch_tours"));
      } finally {
        if (mounted) hide();
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [show, hide]);

  /* ------------------------------------------------------------
     Error States
  ------------------------------------------------------------ */
  if (error)
    return (
      <div className="text-center text-lg text-red-400 mt-10">{error}</div>
    );

  /* ------------------------------------------------------------
     🖼️ Main UI
  ------------------------------------------------------------ */
  return (
    <div className="min-h-screen">
      {/* 🌸 Hero Section */}
      <section className="relative w-full bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-600 text-white rounded-2xl shadow-lg mt-4 mb-10">
        <div className="max-w-5xl mx-auto py-16 px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide mb-3 drop-shadow-md">
            {t("shortcut.tourist_map")}
          </h1>
          <p className="text-lg md:text-xl font-medium opacity-90">
            {t("shortcut.tourist_map_desc")}
          </p>
        </div>
        {/* Optional gradient overlay glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/10 rounded-2xl pointer-events-none" />
      </section>

      {/* 🗺️ Tour Grid */}
      <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {tours.length > 0 ? (
          tours.map(
            (tour) =>
              tour.routeImage?.secure_url && (
                <article
                  key={tour._id}
                  className="group relative rounded-2xl overflow-hidden bg-white ring-1 ring-violet-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all dark:bg-slate-900 dark:ring-violet-900"
                >
                  {/* Image */}
                  <button
                    type="button"
                    className="block w-full aspect-[16/10] overflow-hidden"
                    onClick={() =>
                      setSelectedImage(tour.routeImage!.secure_url!)
                    }
                    aria-label={`${tour.title} – open fullscreen`}
                  >
                    <img
                      src={tour.routeImage.secure_url}
                      alt={tour.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  </button>

                  {/* Description */}
                  <div className="px-4 py-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                      {tour.description || t("tourist_map.no_description")}
                    </p>
                  </div>

                  {/* Title + CTA */}
                  <div
                    className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3
                               rounded-xl px-3 py-2 bg-white/90 backdrop-blur-md
                               ring-1 ring-violet-100 shadow-sm
                               dark:bg-slate-900/80 dark:ring-violet-900/40"
                  >
                    <h3 className="truncate text-base md:text-lg font-semibold text-violet-700 dark:text-violet-300">
                      {tour.title}
                    </h3>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/tours/detail/?id=${tour._id}`)
                      }
                      className="shrink-0 rounded-full px-4 py-2 text-sm font-medium
                                 border border-violet-600 text-violet-600
                                 hover:bg-violet-600 hover:text-white transition-colors
                                 dark:border-violet-400 dark:text-violet-300
                                 dark:hover:bg-violet-400 dark:hover:text-slate-900
                                 focus:outline-none focus-visible:ring-2
                                 focus-visible:ring-violet-500 dark:focus-visible:ring-offset-slate-900"
                    >
                      {t("tourDetails.viewDetails")}
                    </button>
                  </div>

                  {/* Accent Glow */}
                  <span className="absolute top-2 left-2 size-2 rounded-full bg-violet-400/80 shadow-[0_0_10px_rgba(139,92,246,0.6)]" />
                </article>
              )
          )
        ) : (
          <div className="text-center text-lg text-slate-600 dark:text-slate-300 col-span-full">
            {t("tourist_map.no_maps_available")}
          </div>
        )}
      </div>

      {/* 🔍 Fullscreen Viewer */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-[2px] flex justify-center items-center z-50 p-4">
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 z-50 rounded-full p-2
                       bg-white/90 text-violet-700 hover:bg-white shadow-md
                       dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700
                       transition-all duration-200 focus:outline-none
                       focus-visible:ring-2 focus-visible:ring-violet-500"
            aria-label={t("tourist_map.close_image_viewer")}
          >
            <X className="h-5 w-5" />
          </button>

          <img
            src={selectedImage}
            alt={t("tourist_map.tour_image_alt")}
            className="max-w-full max-h-full object-contain cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
          />
        </div>
      )}
    </div>
  );
}

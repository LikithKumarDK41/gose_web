"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { apiFetchTours } from "@/services/userTourService"; // ✅ import API service
import type { Tour } from "@/services/userTourService"; // ✅ use real type

export default function ToursPage() {
  const router = useRouter();

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  /* ------------------------------------------------------------
     📦 Fetch tours directly via service (no Redux)
  ------------------------------------------------------------ */
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await apiFetchTours();
        if (mounted) setTours(data);
      } catch (err: any) {
        console.error("Failed to fetch tours:", err);
        if (mounted) setError(err.message || "Failed to fetch tours");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  /* ------------------------------------------------------------
     ⚙️ Render States
  ------------------------------------------------------------ */
  if (loading) {
    return (
      <div className="text-center text-lg text-gray-500 mt-10">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-lg text-red-500 mt-10">
        {error}
      </div>
    );
  }

  /* ------------------------------------------------------------
     🖼️ Main UI
  ------------------------------------------------------------ */
  return (
    <div>
      {/* Header */}
      <div className="text-center space-y-2 md:space-y-3 mb-8 md:mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          観光マップ
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          各地図をタップすると拡大・縮小できます。
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {tours.length > 0 ? (
          tours.map(
            (tour) =>
              tour.routeImage?.secure_url && (
                <article
                  key={tour._id}
                  className="
                    group relative rounded-2xl overflow-hidden
                    bg-white ring-1 ring-gray-200 shadow-md
                    hover:shadow-lg hover:-translate-y-0.5 transition-all
                    dark:bg-slate-900 dark:ring-white/10
                  "
                >
                  {/* Image */}
                  <button
                    type="button"
                    className="block w-full aspect-[16/10] overflow-hidden"
                    onClick={() => setSelectedImage(tour.routeImage!.secure_url!)}
                    aria-label={`${tour.title} – open fullscreen`}
                  >
                    <img
                      src={tour.routeImage.secure_url}
                      alt={tour.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                  </button>

                  {/* Description */}
                  <div className="px-4 py-4">
                    {tour.description ? (
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {tour.description}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ルートマップの詳細をご覧ください。
                      </p>
                    )}
                  </div>

                  {/* Title + CTA */}
                  <div
                    className="
                      absolute inset-x-4 bottom-4
                      flex items-center justify-between gap-3
                      rounded-xl px-3 py-2
                      bg-white/90 backdrop-blur-md ring-1 ring-black/5
                      dark:bg-slate-900/80 dark:ring-white/10
                    "
                  >
                    <h3 className="truncate text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                      {tour.title}
                    </h3>

                    <button
                      type="button"
                      onClick={() => router.push(`/tours/detail/?id=${tour._id}`)}
                      className="
                        shrink-0 rounded-full px-4 py-2 text-sm font-medium
                        border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white
                        transition-colors
                        dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-slate-900
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                        focus-visible:ring-gray-900 dark:focus-visible:ring-white
                        dark:focus-visible:ring-offset-slate-900
                      "
                    >
                      View Details
                    </button>
                  </div>

                  {/* Accent */}
                  <span className="absolute top-2 left-2 size-2 rounded-full bg-emerald-400/80 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                </article>
              )
          )
        ) : (
          <div className="text-center text-lg text-gray-600 dark:text-gray-300 col-span-full">
            No Tours Available
          </div>
        )}
      </div>

      {/* Fullscreen Viewer */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-[2px] flex justify-center items-center z-50 p-4">
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="
              absolute top-4 right-4 z-50
              rounded-full p-2
              bg-white/90 text-gray-900
              hover:bg-white shadow-md
              dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700
              transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
              focus-visible:ring-indigo-500 dark:focus-visible:ring-offset-slate-900
            "
            aria-label="Close image viewer"
          >
            <X className="h-5 w-5" />
          </button>

          <img
            src={selectedImage}
            alt="Tour Image"
            className="max-w-full max-h-full object-contain cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
          />
        </div>
      )}
    </div>
  );
}

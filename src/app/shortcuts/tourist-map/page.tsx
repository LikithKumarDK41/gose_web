"use client";

import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/store/hook";
import {
    selectTours,
    selectTouristLoading,
    selectTouristError,
    fetchTours,
} from "@/lib/store/slices/touristSlice";
import { useRouter } from "next/navigation";

type Tour = {
    _id: string;
    title: string;
    description?: string;
    routeImage?: { secure_url?: string };
};

export default function ToursPage() {
    const dispatch = useAppDispatch();
    const router = useRouter();

    const tours = useAppSelector(selectTours) as Tour[];
    const loading = useAppSelector(selectTouristLoading);
    const error = useAppSelector(selectTouristError);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        if (tours.length === 0) dispatch(fetchTours());
    }, [dispatch, tours]);

    if (loading) return <div className="text-center text-lg text-gray-500">Loading...</div>;
    if (error) return <div className="text-center text-lg text-red-500">{error}</div>;

    return (
        <div className="p-6 md:p-12 font-sans">
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
                    tours.map((tour) =>
                        tour.routeImage?.secure_url ? (
                            <article
                                key={tour._id}
                                className="
                  group relative rounded-2xl overflow-hidden
                  bg-white ring-1 ring-gray-200 shadow-md
                  hover:shadow-lg hover:-translate-y-0.5 transition-all
                  dark:bg-slate-900 dark:ring-white/10
                "
                            >
                                {/* Image (edge-to-edge) */}
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

                                {/* Description (optional, simple text below image) */}
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

                                {/* Bottom overlay bar: title + CTA perfectly aligned */}
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

                                {/* Tiny accent */}
                                <span className="absolute top-2 left-2 size-2 rounded-full bg-emerald-400/80 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                            </article>
                        ) : null
                    )
                ) : (
                    <div className="text-center text-lg text-gray-600 dark:text-gray-300 col-span-full">
                        No Tours Available
                    </div>
                )}
            </div>

            {/* Fullscreen viewer */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-[2px] flex justify-center items-center z-50 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <img
                        src={selectedImage}
                        alt="Tour Image"
                        className="max-w-full max-h-full object-contain cursor-zoom-out"
                    />
                </div>
            )}
        </div>
    );
}

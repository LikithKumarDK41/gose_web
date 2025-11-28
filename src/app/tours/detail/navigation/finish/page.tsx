"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import {
  selectNav,
  selectUserTourPoints,
  resetAll as resetNav,
} from "@/lib/store/slices/navSlice";
import { resetAll as resetGeofence } from "@/lib/store/slices/geofenceSlice";
import { clearTourDetail } from "@/lib/store/slices/touristSlice";

import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Share2,
  ArrowLeft,
  MapPin,
  Clock,
  Zap,
} from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";
import type { Tour, TourPoint } from "@/lib/types/userTour.types";
import Image from "next/image";

export default function FinishPage() {
  const params = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useLocale();

  const tourId = params.get("tourId");
  const auth = useAppSelector((s) => s.auth);
  const nav = useAppSelector(selectNav);

  // ⭐ Read stamped tourpoints from Redux
  const reduxTourPoints = useAppSelector(selectUserTourPoints);

  const [isResetting, setIsResetting] = useState(false);

  const usertour = nav.usertour;

  // Handle tour being either object or string ID
  const tour: Tour | null =
    usertour &&
      typeof usertour.tour === "object" &&
      usertour.tour !== null
      ? (usertour.tour as Tour)
      : null;

  // Filter only stamped points (ignore station + lunch)
  const stampedPoints: TourPoint[] = (reduxTourPoints || []).filter(
    (p: TourPoint) =>
      p.pointtype !== "station" &&
      p.pointtype !== "lunch" &&
      p.stamp &&
      typeof p.stamp === "object" &&
      Object.keys(p.stamp).length > 0
  );

  const totalPoints = (reduxTourPoints || []).filter(
    (p: TourPoint) => p.pointtype !== "station" && p.pointtype !== "lunch"
  ).length;

  /* =========================================================
     ⭐ Reset Redux on component unmount (browser back button)
  ========================================================= */
  useEffect(() => {
    const handlePopState = () => {
      console.log("🔙 Browser back button pressed, resetting Redux...");
      resetAllData();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [dispatch]);

  /* =========================================================
     ⭐ Validate user is on finish page properly
  ========================================================= */
  useEffect(() => {
    if (!tourId || !auth.data?.user?._id || !usertour) {
      console.warn("Missing required data for finish screen");
      return;
    }

    if (usertour.status !== "end") {
      console.warn("Tour not ended yet");
    }
  }, [tourId, auth.data, usertour, router]);

  /* =========================================================
     ⭐ Reset all Redux slices
  ========================================================= */
  const resetAllData = () => {
    console.log("🔄 Resetting all Redux slices...");
    dispatch(resetNav());
    dispatch(resetGeofence());
    dispatch(clearTourDetail());
    console.log("✅ All Redux slices reset successfully");
  };

  const handleShare = () => {
    const tourTitle = tour?.title || "Tour";
    const message = `I completed the ${tourTitle} tour with ${stampedPoints.length}/${totalPoints} checkpoints! 🎉`;

    if (navigator.share) {
      navigator.share({
        title: "Tour Completed!",
        text: message,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(message);
      alert("Achievement copied to clipboard!");
    }
  };

  const handleBackToTours = async () => {
    try {
      router.replace("/tours");
      setIsResetting(true);
      resetAllData();
    } catch (err) {
      console.error("Error resetting Redux slices:", err);
      router.replace("/tours");
    }
  };

  if (!usertour || !tour) {
    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4" />
          <p className="text-gray-300 mb-4">{t("loading")}...</p>
          <Button
            onClick={() => {
              dispatch(resetNav());
              dispatch(resetGeofence());
              dispatch(clearTourDetail());
              router.replace("/tours");
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {t("back_to_tours")}
          </Button>
        </div>
      </div>
    );
  }

  const progressPercent = (stampedPoints.length / totalPoints) * 100;
  const tourImage = tour?.image?.secure_url;

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero Section - Scrollable */}
        <div className="relative bg-gradient-to-b from-slate-900 via-black to-black">
          {/* Background Image with Overlay */}
          {tourImage ? (
            <div className="absolute inset-0">
              <Image
                src={tourImage}
                alt={tour.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black">
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black" />
            </div>
          )}

          {/* Content */}
          <div className="relative h-full flex flex-col justify-between p-6 md:p-6 text-white">
            {/* Top Section */}
            <div className="pt-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-5xl md:text-6xl font-black drop-shadow-2xl mb-3">
                    🎉
                  </h1>
                  <h2 className="text-3xl md:text-5xl font-black drop-shadow-lg mb-2">
                    {t("tour_completed")}!
                  </h2>
                  <p className="text-xl md:text-2xl font-bold text-emerald-300 drop-shadow">
                    {tour.title}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <div className="inline-block bg-emerald-500/20 backdrop-blur-md rounded-full p-4 drop-shadow-2xl border-2 border-emerald-400">
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
                  </div>
                </div>
              </div>

              {/* Celebration Message */}
              <div className="mt-8 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 backdrop-blur-md rounded-2xl p-6 border border-emerald-400/30">
                <p className="text-center text-lg md:text-xl text-white font-semibold">
                  <span className="text-emerald-300">✨ {t("congratulations")}!</span>
                  <br />
                  <span className="text-gray-200">
                    {t("you_collected")} <span className="text-emerald-400 font-black">{stampedPoints.length}</span> {t("out_of")}{" "}
                    <span className="text-cyan-400 font-black">{totalPoints}</span> {t("checkpoints")}
                  </span>
                </p>
              </div>
            </div>

            {/* Bottom Section with Stats */}
            <div className="pt-8">
              {/* Tour Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {/* Duration */}
                <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:border-emerald-400/50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                  </div>
                  <p className="text-xs font-medium text-gray-400 mb-1">
                    {t("duration")}
                  </p>
                  <p className="text-2xl font-black text-white">
                    {tour.duration}
                  </p>
                </div>

                {/* Travel Time */}
                <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:border-emerald-400/50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-xs font-medium text-gray-400 mb-1">
                    {t("travel_time")}
                  </p>
                  <p className="text-2xl font-black text-white">
                    {tour.traveltime}
                  </p>
                </div>

                {/* Checkpoints */}
                <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:border-emerald-400/50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-xs font-medium text-gray-400 mb-1">
                    {t("checkpoints")}
                  </p>
                  <p className="text-2xl font-black text-white">
                    {stampedPoints.length}
                  </p>
                </div>
              </div>

              {/* Decorative divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-black px-6 pb-6 space-y-6">
          {/* Tour Description */}
          {tour.content?.brief && (
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-l-4 border-blue-500 rounded-lg p-6 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-blue-300 mb-3 flex items-center gap-2">
                📖 {t("tour_description")}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {tour.content.brief.replace(/<[^>]+>/g, "")}
              </p>
            </div>
          )}

          {/* Completed Points */}
          <div>
            <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              {t("completed_points")}
            </h2>

            {stampedPoints.length > 0 ? (
              <div className="space-y-3">
                {stampedPoints.map((p: TourPoint, idx: number) => (
                  <div
                    key={p._id}
                    className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-emerald-500/20 hover:border-emerald-400 hover:bg-emerald-500/10 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/30 group-hover:bg-emerald-500 transition-colors">
                          <span className="text-xs font-black text-emerald-300 group-hover:text-white">
                            {idx + 1}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {p.monument?.title ||
                            p.monument?.name ||
                            p.name ||
                            "Unknown Point"}
                        </p>
                        {p.monument?.region?.title && (
                          <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                            <MapPin className="w-4 h-4 text-cyan-400" />
                            {p.monument.region.title}
                          </p>
                        )}
                        {p.stamp?.stamptime && (
                          <p className="text-xs text-gray-500 mt-1">
                            ⏱️ {new Date(
                              Number(p.stamp.stamptime)
                            ).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                {t("no_points_completed")}
              </p>
            )}
          </div>

          {/* User Info */}
          {auth.data?.user && (
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                  {((auth.data.user as any).name ||
                    (auth.data.user as any).email)?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500">
                    {t("completed_by")}
                  </p>
                  <p className="font-bold text-white truncate">
                    {(auth.data.user as any).name ||
                      (auth.data.user as any).email}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0 text-cyan-400" />
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Sticky at bottom */}
      <div className="flex-shrink-0 bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-4 px-6 md:px-8 space-y-3 border-t border-white/5">
        {/* Share Button */}
        <Button
          onClick={handleShare}
          className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-emerald-500/50 text-lg py-6 font-black border border-emerald-400/50"
        >
          <Share2 className="mr-2 h-5 w-5" />
          {t("share_achievement")}
        </Button>

        {/* Back Button */}
        <Button
          onClick={handleBackToTours}
          disabled={isResetting}
          className="w-full rounded-lg border-2 border-gray-600 hover:border-emerald-400 bg-white/5 hover:bg-white/10 text-white text-lg py-6 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="mr-2 h-5 w-5 flex-shrink-0" />
          <span>{isResetting ? t("loading") : t("back_to_tours")}</span>
        </Button>
      </div>
    </div>
  );
}
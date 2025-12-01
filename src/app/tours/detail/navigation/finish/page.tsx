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
  Share2,
  ArrowLeft,
  MapPin,
  Clock,
  Zap,
} from "lucide-react";

import { useLocale } from "@/providers/LocaleProvider";
import type { Tour, TourPoint } from "@/lib/types/userTour.types";
import Image from "next/image";
import MapboxTourMapFinish from "@/components/map/MapboxTourMapFinish";

export default function FinishPage() {
  const params = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useLocale();

  const tourId = params.get("tourId");
  const auth = useAppSelector((s) => s.auth);
  const nav = useAppSelector(selectNav);

  // 🔵 Use this ONLY for stamping icons
  const reduxUserTourPoints = useAppSelector(selectUserTourPoints);

  // 🔵 Full tour object including tourpoints + routeJson
  const detailTour = useAppSelector((s) => s.tourist.detail);

  const [isResetting, setIsResetting] = useState(false);

  const usertour = nav.usertour;

  /* ========================================================
      ⭐ MERGE TOUR DATA — finalTour used by Mapbox
  ======================================================== */

  let finalTour: Tour | null = null;

  if (detailTour && detailTour?._id === tourId) {
    finalTour = {
      ...detailTour,
      tourpoints: detailTour.tourpoints ?? []
    };
  }

  /* ========================================================
      ⭐ Stamped & Total Points (use ONLY reduxUserTourPoints)
  ======================================================== */

  const stampedPoints = reduxUserTourPoints.filter(
    (p: TourPoint) =>
      p.pointtype !== "station" &&
      p.pointtype !== "lunch" &&
      p.stamp &&
      typeof p.stamp === "object" &&
      Object.keys(p.stamp).length > 0
  );

  const totalPoints = reduxUserTourPoints.filter(
    (p: TourPoint) => p.pointtype !== "station" && p.pointtype !== "lunch"
  ).length;

  /* ========================================================
      ⭐ Browser Back — Reset Redux
  ======================================================== */
  useEffect(() => {
    const handler = () => resetAllData();
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const resetAllData = () => {
    dispatch(resetNav());
    dispatch(resetGeofence());
    dispatch(clearTourDetail());
  };

  /* ========================================================
      ⭐ Validate finish
  ======================================================== */
  useEffect(() => {
    if (!tourId || !auth.data?.user?._id || !usertour) return;
    if (usertour.status !== "end") console.warn("Tour not ended yet");
  }, [tourId, auth.data, usertour]);

  /* ========================================================
      ⭐ Share Achievement
  ======================================================== */
  const handleShare = () => {
    const title = finalTour?.title || "Tour";
    const message = `I completed the ${title} tour with ${stampedPoints.length}/${totalPoints} checkpoints! 🎉`;

    if (navigator.share) {
      navigator.share({ title: "Tour Completed!", text: message });
    } else {
      navigator.clipboard.writeText(message);
      alert("Copied to clipboard!");
    }
  };

  /* ========================================================
      ⭐ Back to Tours
  ======================================================== */
  const handleBackToTours = () => {
    setIsResetting(true);
    resetAllData();
    router.replace("/tours");
  };

  /* ========================================================
      ⭐ Loader Screen (if no tour loaded yet)
  ======================================================== */
  if (!finalTour) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-emerald-400 mx-auto mb-4" />
          <p className="text-gray-300">{t("loading")}...</p>
        </div>
      </div>
    );
  }

  /* ========================================================
      ⭐ UI START
  ======================================================== */

  const tourImage = finalTour.image?.secure_url;

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col">

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">

        {/* HERO */}
        <div className="relative bg-gradient-to-b from-slate-900 via-black to-black">
          {tourImage ? (
            <div className="absolute inset-0">
              <Image
                src={tourImage}
                alt={finalTour.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gray-800"></div>
          )}

          <div className="relative p-6 text-white">
            <h1 className="text-5xl font-black mb-2">🎉</h1>
            <h2 className="text-3xl font-black">{t("tour_completed")}!</h2>
            <p className="text-lg text-emerald-300">{finalTour.title}</p>

            <div className="mt-6 bg-emerald-500/20 p-4 rounded-xl text-center border border-emerald-400/30">
              <span className="text-emerald-300 font-bold">
                ✨ {t("congratulations")}!
              </span>
              <br />
              <span className="text-gray-200">
                {t("you_collected")}{" "}
                <b className="text-emerald-400">{stampedPoints.length}</b>{" "}
                {t("out_of")}{" "}
                <b className="text-cyan-400">{totalPoints}</b>{" "}
                {t("checkpoints")}
              </span>
            </div>
          </div>
        </div>

        {/* MAP SECTION */}
        <div className="bg-black px-6 pb-6">

          <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-3">
            <MapPin className="w-6 h-6 text-cyan-400" />
            {t("tour_map")}
          </h2>

          <div className="rounded-2xl border border-white/10 overflow-hidden shadow-lg">

            {/* 🔵 Map now shows full detailTour.tourpoints AND stamping overlays from Redux */}
            <MapboxTourMapFinish
              tour={finalTour}
              stampedPoints={reduxUserTourPoints}
              usertour={usertour}
              height={360}
              profile="walking"
            />
          </div>
        </div>

      </div>

      {/* FOOTER BUTTONS */}
      <div className="p-6 space-y-3 bg-gradient-to-t from-black to-transparent">

        <Button
          onClick={handleShare}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg py-5 rounded-xl font-bold"
        >
          <Share2 className="mr-2" /> {t("share_achievement")}
        </Button>

        <Button
          onClick={handleBackToTours}
          disabled={isResetting}
          className="w-full border-2 border-gray-600 hover:border-emerald-400 text-white text-lg py-5 rounded-xl"
        >
          <ArrowLeft className="mr-2" /> {t("back_to_tours")}
        </Button>
      </div>
    </div>
  );
}

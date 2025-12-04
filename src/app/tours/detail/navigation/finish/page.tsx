"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import {
  selectNav,
  selectUserTourPoints,
  resetAll as resetNav,
  setStatus,
} from "@/lib/store/slices/navSlice";
import { resetAll as resetGeofence } from "@/lib/store/slices/geofenceSlice";
import { clearTourDetail } from "@/lib/store/slices/touristSlice";
import { useLocale } from "@/providers/LocaleProvider";

import { Button } from "@/components/ui/button";
import MapboxTourMapFinish from "@/components/map/MapboxTourMapFinish";
import type { Tour, TourPoint } from "@/lib/types/userTour.types";

export default function FinishPage() {
  const params = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useLocale();

  const tourId = params.get("tourId");
  const auth = useAppSelector((s) => s.auth);
  const nav = useAppSelector(selectNav);

  const reduxUserTourPoints = useAppSelector(selectUserTourPoints);
  const detailTour = useAppSelector((s) => s.tourist.detail);

  const [isResetting, setIsResetting] = useState(false);

  const usertour = nav.usertour;

  /* ---------- MERGE TOUR DATA ---------- */
  let finalTour: Tour | null = null;

  if (detailTour && detailTour?._id === tourId) {
    finalTour = {
      ...detailTour,
      tourpoints: detailTour.tourpoints ?? [],
    };
  }

  /* ---------- STAMPED / TOTAL POINTS ---------- */
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

  /* ---------- RESET ON BROWSER BACK ---------- */
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

  /* ---------- VALIDATE TOUR END ---------- */
  useEffect(() => {
    if (!tourId || !auth.data?.user?._id || !usertour) return;
    if (usertour.status !== "end") console.warn("Tour not ended yet");
  }, [tourId, auth.data, usertour]);

  /* ---------- SHARE ACHIEVEMENT ---------- */
const handleShare = async () => {
  try {

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true
    });

    const track = stream.getVideoTracks()[0];
    const imageCapture = new (window as any).ImageCapture(track);

    const bitmap: ImageBitmap = await imageCapture.grabFrame();

    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context is null");

    ctx.drawImage(bitmap, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((file) => {
        if (file) resolve(file);
        else reject("Failed to create Blob");
      }, "image/png");
    });

    // STOP screen capture
    stream.getTracks().forEach((t) => t.stop());

    // Convert screenshot to image URL
    const imgURL = URL.createObjectURL(blob);

    // Open screenshot in new window
    const win = window.open("");
    win!.document.write(`
      <html>
        <body style="margin:0;background:#000;display:flex;justify-content:center;align-items:center;height:100vh;">
          <img src="${imgURL}" style="max-width:100%;max-height:100%;" />
        </body>
      </html>
    `);

  } catch (err) {
    console.error("SCREENSHOT ERROR:", err);
    alert("Unable to capture screenshot.");
  }
};


  /* ---------- BACK TO TOURS ---------- */
  const handleBackToTours = () => {
    setIsResetting(true);
    dispatch(setStatus("idle"));
    resetAllData();
    router.replace("/tours");
  };

  /* ---------- LOADER WHILE LOADING ---------- */
  if (!finalTour) {
    return (
      <div className="fixed inset-0 z-[100] bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-emerald-500 mx-auto mb-4" />
        </div>
      </div>
    );
  }

  /* ---------- UI START ---------- */
  const tourImage = finalTour.image?.secure_url;

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-black overflow-hidden flex flex-col">

      {/* Scrollable */}
      <div className="flex-1 overflow-y-auto">

        {/* HERO */}
        <div className="relative bg-gradient-to-b from-gray-100 via-white to-white dark:from-slate-900 dark:via-black dark:to-black">
          {tourImage ? (
            <div className="absolute inset-0">
              <Image
                src={tourImage}
                alt={finalTour.title}
                fill
                className="object-cover opacity-80 dark:opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/70 to-white dark:from-black/60 dark:via-black/70 dark:to-black" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800"></div>
          )}

          <div className="relative p-6 text-black dark:text-white">
            <h1 className="text-5xl font-black mb-2">🎉</h1>
            <h2 className="text-3xl font-black">{t("tour_completed")}!</h2>
            <p className="text-lg text-emerald-700 dark:text-emerald-300">
              {finalTour.title}
            </p>

            <div className="mt-6 p-4 rounded-xl text-center border
              bg-emerald-100 text-emerald-700 border-emerald-300
              dark:bg-emerald-500/20 dark:border-emerald-400/30 dark:text-emerald-300">
              <span className="font-bold">✨ {t("congratulations")}!</span>
              <br />
              <span className="text-black dark:text-gray-200">
                {t("you_collected")}{" "}
                <b className="text-emerald-700 dark:text-emerald-400">
                  {stampedPoints.length}
                </b>{" "}
                {t("out_of")}{" "}
                <b className="text-cyan-700 dark:text-cyan-400">
                  {totalPoints}
                </b>{" "}
                {t("checkpoints")}
              </span>
            </div>
          </div>
        </div>

        {/* MAP SECTION */}
        <div className="px-6 pb-6 bg-white dark:bg-black">

          {/* TOUR DETAILS */}
          <div className="mb-6 p-5 rounded-2xl shadow-lg border
            bg-white border-gray-300 
            dark:bg-black dark:border-white/10">
            <h2 className="text-3xl font-extrabold text-black dark:text-white mb-2">
              {finalTour.title}
            </h2>

            {finalTour.content?.brief && (
              <p
                className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3"
                dangerouslySetInnerHTML={{ __html: finalTour.content.brief }}
              />
            )}

            {finalTour.content?.extended && (
              <div
                className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: finalTour.content.extended }}
              />
            )}
          </div>

          {/* MAP */}
          <div className="rounded-2xl overflow-hidden border shadow-lg 
            border-gray-300 dark:border-white/10">
            <MapboxTourMapFinish
              tour={finalTour}
              stampedPoints={reduxUserTourPoints}
              height={360}
              profile="walking"
            />
          </div>
        </div>

      </div>

      {/* FOOTER BUTTONS */}
      <div className="p-6 space-y-3 bg-gradient-to-t from-gray-100 to-transparent dark:from-black dark:to-transparent">

        {/* <Button
          onClick={handleShare}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg py-5 rounded-xl font-bold"
        >
          <Share2 className="mr-2" /> {t("share_achievement")}
        </Button> */}

        <Button
          onClick={handleBackToTours}
          disabled={isResetting}
          className="cursor-pointer w-full py-5 rounded-xl text-lg
            border-2 bg-gray-100 text-black border-gray-400 hover:bg-gray-200
            dark:bg-white/10 dark:text-white dark:border-gray-600 dark:hover:bg-white/20"
        >
          <ArrowLeft className="mr-2" /> {t("back_to_tours")}
        </Button>

      </div>
    </div>
  );
}

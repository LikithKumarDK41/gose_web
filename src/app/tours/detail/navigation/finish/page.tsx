"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/store/hook";
import {
  apiGetUserTourPoints,
} from "@/services/userNavService";
import { selectNav } from "@/lib/store/slices/navSlice";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Share2, ArrowLeft } from "lucide-react";

export default function FinishPage() {
  const params = useSearchParams();
  const router = useRouter();

  const tourId = params.get("tourId");
  const auth = useAppSelector((s) => s.auth);
  const nav = useAppSelector(selectNav);

  const [points, setPoints] = useState<any[]>([]);
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(true);

  /* =========================================================
     ⭐ Load Stamped Points from Redux usertour
  ========================================================= */
  useEffect(() => {
    async function load() {
      if (!tourId || !auth.data?.user?._id || !nav.usertour) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1️⃣ Get usertourId from Redux
        const usertourId = nav.usertour._id;

        // 2️⃣ Set background image from tour (if available)
        // Note: You may need to fetch this from another source or Redux state
        setImage("");

        // 3️⃣ Get stamped tourpoints
        if (usertourId) {
          const tp = await apiGetUserTourPoints(tourId, usertourId);

          const stamped = (tp.tourpoints || []).filter(
            (p: any) =>
              p.stamp &&
              typeof p.stamp === "object" &&
              Object.keys(p.stamp).length > 0
          );

          setPoints(stamped);
        }
      } catch (err) {
        console.error("Finish screen load error", err);
        setPoints([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tourId, auth.data, nav.usertour]);

  /* =========================================================
     ⭐ UI Screen
  ========================================================= */
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Dimmed Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${image})`,
          filter: "brightness(0.35)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center text-white p-6 max-w-xl mx-auto">
        {/* Big Icon */}
        <CheckCircle2 className="w-20 h-20 mx-auto text-green-400 mb-4" />

        <h1 className="text-4xl font-bold mb-3">Tour Completed!</h1>
        <p className="text-lg opacity-90 mb-8">
          Congratulations! You have completed all the tour points.
        </p>

        {/* Actions */}
        <div className="space-y-4">
          {/* Share button */}
          <Button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: "I completed the tour!",
                  text: "Check out my achievement!",
                  url: window.location.href,
                });
              } else {
                alert("Sharing not supported on this device");
              }
            }}
            className="w-full rounded-full bg-white text-black hover:bg-gray-100"
          >
            <Share2 className="mr-2 h-5 w-5" />
            Share Achievement
          </Button>

          {/* Back button */}
          <Button
            onClick={() => router.replace("/tours")}
            variant="outline"
            className="w-full rounded-full border-white text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Tours
          </Button>
        </div>

        {/* Completed tourpoints */}
        <div className="mt-10 text-left bg-white/20 rounded-xl p-4 backdrop-blur">
          <h2 className="text-xl font-semibold mb-2">Completed Points</h2>

          {loading ? (
            <p className="text-sm opacity-75">Loading points...</p>
          ) : points.length > 0 ? (
            <ul className="space-y-2">
              {points.map((p: any) => (
                <li key={p._id} className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-300 h-5 w-5" />{" "}
                  {p.monument?.title || p.name || "Unknown Point"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm opacity-75">No points completed</p>
          )}
        </div>
      </div>
    </div>
  );
}
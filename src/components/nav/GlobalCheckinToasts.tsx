"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useAppSelector, useAppDispatch } from "@/lib/store/hook";
import {
  selectGeofenceQueue,
  confirm,
  clearQueue,
} from "@/lib/store/slices/geofenceSlice";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { QueueItem } from "@/lib/store/slices/geofenceSlice";

export default function GlobalCheckinToasts() {
  const dispatch = useAppDispatch();
  const queue = useAppSelector(selectGeofenceQueue) as QueueItem[];

  useEffect(() => {
    if (queue.length === 0) return;

    for (const item of queue) {
      // ✅ render via portal so it's outside Sonner layout & always viewport-centered
      toast.custom(
        (t) =>
          createPortal(
            <div
              className="
                fixed inset-0 z-[9999999]
                flex items-center justify-center
                bg-black/60 dark:bg-black/80 backdrop-blur-sm
              "
            >
              <div
                className="
                  relative w-[90%] max-w-md p-6 rounded-2xl shadow-2xl
                  bg-white text-gray-900
                  dark:bg-slate-900 dark:text-gray-100
                  border border-gray-200 dark:border-slate-700
                  animate-[fadeIn_0.25s_ease-out]
                "
              >
                <h3 className="font-semibold text-lg mb-3 break-words">
                  📍 You’re near: {item.name}
                </h3>

                {item.blurb ? (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {item.blurb}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    You’ve reached a check-in location.
                  </p>
                )}

                <div className="text-xs text-gray-600 dark:text-gray-400 mb-4 space-y-1 text-left">
                  <p>
                    <strong>Latitude:</strong> {item.lat.toFixed(6)}
                  </p>
                  <p>
                    <strong>Longitude:</strong> {item.lng.toFixed(6)}
                  </p>
                  <p>
                    <strong>Radius:</strong> {item.radius} m
                  </p>
                </div>

                <div className="flex justify-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toast.dismiss(t.id)}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    Close
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      console.log("✅ Check-in success");
                      console.log("📘 Tour/Place Details:", item);

                      dispatch(confirm(String(item.id)));
                      toast.dismiss(t.id);
                      toast.success(`✅ Checked in at ${item.name}`, {
                        description: "Your visit has been recorded.",
                        duration: 4000,
                      });
                    }}
                    className="
                      bg-emerald-600 hover:bg-emerald-700
                      dark:bg-emerald-500 dark:hover:bg-emerald-400
                      text-white font-medium
                    "
                  >
                    Check In
                  </Button>
                </div>
              </div>
            </div>,
            document.body // ✅ attach directly to <body>
          ),
        {
          id: `checkin-${item.id}`,
          duration: Infinity, // stays until closed
        }
      );
    }

    dispatch(clearQueue());
  }, [queue, dispatch]);

  return null;
}

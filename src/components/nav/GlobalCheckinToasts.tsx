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

/**
 * 🧹 Basic HTML Sanitizer — strips script/style tags & event handlers
 */
function sanitizeHTML(input: string): string {
  if (!input) return "";
  let safe = input;
  // remove scripts/styles/comments
  safe = safe
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  // remove on* handlers (like onclick)
  safe = safe.replace(/on\w+="[^"]*"/gi, "");
  // allow basic tags only
  return safe;
}

export default function GlobalCheckinToasts() {
  const dispatch = useAppDispatch();
  const queue = useAppSelector(selectGeofenceQueue) as QueueItem[];

  useEffect(() => {
    if (queue.length === 0) return;

    for (const item of queue) {
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

                {/* ✅ Render HTML safely if item.blurb exists */}
                {item.blurb ? (
                  <div
                    className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed prose dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHTML(item.blurb),
                    }}
                  />
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    You’ve reached a check-in location.
                  </p>
                )}

                {/* Coordinates Info */}
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

                {/* Action Buttons */}
                <div className="flex justify-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toast.dismiss(t)}
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
                      toast.dismiss(t);
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
            document.body
          ),
        {
          id: `checkin-${item.id}`,
          duration: Infinity,
        }
      );
    }

    dispatch(clearQueue());
  }, [queue, dispatch]);

  return null;
}

"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useAppSelector, useAppDispatch } from "@/lib/store/hook";
import {
  selectGeofenceQueue,
  confirm,
  clearQueue,
} from "@/lib/store/slices/geofenceSlice";
import { selectNav } from "@/lib/store/slices/navSlice";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  apiCreateVisitHistory,
  apiGetVisitHistoryById,
} from "@/services/myListService";
import type { QueueItem } from "@/lib/store/slices/geofenceSlice";
import type { VisitHistoryPayload, VisitHistory } from "@/services/myListService";

/* ------------------------------------------------------------
   🧹 Safe HTML Sanitizer
------------------------------------------------------------ */
function sanitizeHTML(input: string): string {
  if (!input) return "";
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/on\w+="[^"]*"/gi, "");
}

/* ------------------------------------------------------------
   🌍 Global Check-in Toasts
------------------------------------------------------------ */
export default function GlobalCheckinToasts() {
  const dispatch = useAppDispatch();

  // Redux sources
  const queue = useAppSelector(selectGeofenceQueue) as QueueItem[];
  const auth = useAppSelector((s) => s.auth.data);
  const nav = useAppSelector(selectNav); // has activeTourId, status, etc.

  useEffect(() => {
    if (!queue.length) return;

    for (const item of queue) {
      toast.custom(
        (t) =>
          createPortal(
            <div
              className="fixed inset-0 z-[9999999] flex items-center justify-center
                         bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            >
              <div
                className="relative w-[90%] max-w-md p-6 rounded-2xl shadow-2xl
                           bg-white dark:bg-slate-900
                           text-gray-900 dark:text-gray-100
                           border border-gray-200 dark:border-slate-700
                           animate-[fadeIn_0.25s_ease-out]"
              >
                <h3 className="font-semibold text-lg mb-3 break-words">
                  📍 You’re near: {item.name}
                </h3>

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

                <div className="text-xs text-gray-600 dark:text-gray-400 mb-4 space-y-1 text-left">
                  <p>
                    <strong>Latitude:</strong> {item.lat?.toFixed(6) ?? "—"}
                  </p>
                  <p>
                    <strong>Longitude:</strong> {item.lng?.toFixed(6) ?? "—"}
                  </p>
                  <p>
                    <strong>Radius:</strong> {item.radius ?? "—"} m
                  </p>
                </div>

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
                    onClick={async () => {
                      try {
                        /* ------------------------------------------------
                           1️⃣ Validate user
                        ------------------------------------------------ */
                        const userId =
                          auth?.user?._id ||
                          auth?.user?.id ||
                          auth?.user?.uuid ||
                          null;

                        if (!userId) {
                          toast.error("Please sign in to check-in");
                          toast.dismiss(t);
                          return;
                        }

                        /* ------------------------------------------------
                           2️⃣ Determine correct history type
                        ------------------------------------------------ */
                        const hasActiveTour = Boolean(nav?.activeTourId);

                        /* ------------------------------------------------
                           3️⃣ Construct payload (timestamp + manual)
                        ------------------------------------------------ */
                        const payload: VisitHistoryPayload = {
                          user: userId,
                          historytype: "monument",
                          monument: String(item.monumentId),
                          status: "active",
                          visitmode: "manual", // ✅ always manual
                          historytime: Date.now().toString(), // ✅ numeric timestamp string
                        };

                        console.log("📦 Sending visit history:", payload);

                        /* ------------------------------------------------
                           4️⃣ Create Visit History
                        ------------------------------------------------ */
                        const created = await apiCreateVisitHistory(payload);
                        console.log("✅ Created visit history:", created);

                        /* ------------------------------------------------
                           5️⃣ Fetch that history again
                        ------------------------------------------------ */
                        if (created?._id) {
                          try {
                            const fetched: VisitHistory =
                              await apiGetVisitHistoryById(created._id);
                            console.log("📥 Fetched created history:", fetched);
                          } catch (fetchErr: any) {
                            console.warn("⚠️ Could not fetch visit history:", fetchErr);
                          }
                        }

                        /* ------------------------------------------------
                           6️⃣ Update State + Success Toast
                        ------------------------------------------------ */
                        dispatch(confirm(String(item.id)));
                        toast.dismiss(t);
                        toast.success(`✅ Checked in at ${item.name}`, {
                          description: hasActiveTour
                            ? "Your tour progress has been updated."
                            : "Your visit has been recorded.",
                          duration: 4000,
                        });
                      } catch (err: any) {
                        console.error("❌ Check-in failed:", err);
                        toast.error("Failed to record visit history", {
                          description:
                            err?.message || "Please try again later.",
                        });
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700
                               dark:bg-emerald-500 dark:hover:bg-emerald-400
                               text-white font-medium"
                  >
                    Check In
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          ),
        { id: `checkin-${item.id}`, duration: Infinity }
      );
    }

    // ✅ Clear queue after all toasts created
    dispatch(clearQueue());
  }, [queue, dispatch, auth, nav]);

  return null;
}

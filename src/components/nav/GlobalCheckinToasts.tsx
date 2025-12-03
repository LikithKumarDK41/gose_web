"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useAppSelector, useAppDispatch } from "@/lib/store/hook";
import {
  selectGeofenceQueue,
  confirm,
  clearQueue,
} from "@/lib/store/slices/geofenceSlice";
import {
  selectNav,
  fetchUserTourPoints, // ✅ NEW: import thunk
} from "@/lib/store/slices/navSlice";
import { selectTourDetail } from "@/lib/store/slices/touristSlice";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import {
  apiCreateVisitHistory,
  apiGetVisitHistoryById,
} from "@/services/myListService";

import { apiCreateStamp } from "@/services/userNavService";

import type { QueueItem } from "@/lib/types/userTour.types";
import type { VisitHistoryPayload } from "@/services/myListService";
import { useLocale } from "@/providers/LocaleProvider";

/* ----------------------------------------------
   🧹 Sanitize HTML
---------------------------------------------- */
function sanitizeHTML(input: string): string {
  if (!input) return "";
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/on\w+="[^"]*"/gi, "");
}

/* ----------------------------------------------
   🌍 Global Geofence Toast Handler
---------------------------------------------- */
export default function GlobalCheckinToasts() {
  const dispatch = useAppDispatch();
  const { t: translate } = useLocale();

  const queue = useAppSelector(selectGeofenceQueue) as QueueItem[];
  const auth = useAppSelector((s) => s.auth.data);
  const nav = useAppSelector(selectNav);
  const tourDetail = useAppSelector(selectTourDetail);

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
                           border border-gray-200 dark:border-slate-700"
              >
                {/* Title */}
                <h3 className="font-semibold text-lg mb-3 break-words">
                  📍 You’re near: {item.name}
                </h3>

                {/* Description */}
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

                {/* Coordinates */}
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-4 space-y-1 text-left">
                  <p>
                    <strong>Latitude:</strong>{" "}
                    {item.lat?.toFixed(6) ?? "—"}
                  </p>
                  <p>
                    <strong>Longitude:</strong>{" "}
                    {item.lng?.toFixed(6) ?? "—"}
                  </p>
                  <p>
                    <strong>Radius:</strong> {item.radius ?? "—"} m
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex justify-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toast.dismiss(t)}
                  >
                    Close
                  </Button>

                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
                          toast.error(translate("please_signin_to_checkin"));
                          toast.dismiss(t);
                          return;
                        }

                        /* ------------------------------------------------
                           2️⃣ Build Visit History Payload
                        ------------------------------------------------ */
                        const visitPayload: VisitHistoryPayload = {
                          user: userId,
                          historytype: "monument",
                          monument: String(item.monumentId),
                          status: "active",
                          visitmode: "manual",
                          historytime: Date.now().toString(),
                        };

                        /* ------------------------------------------------
                           3️⃣ Create Visit History
                        ------------------------------------------------ */
                        await apiCreateVisitHistory(visitPayload);

                        /* ------------------------------------------------
                           4️⃣ Create STAMP
                               Uses monumentId + tourpointId
                        ------------------------------------------------ */
                        if (item.monumentId && item.tourpointId) {
                          await apiCreateStamp({
                            monument: String(item.monumentId),
                            tourpoint: String(item.tourpointId),
                            user: String(userId),
                            status: "active",
                            stamptime: Date.now(),
                          });
                        }

                        /* ------------------------------------------------
                           5️⃣ 🔄 Refresh user tourpoints
                               (so stamp status updates in Redux)
                        ------------------------------------------------ */
                        try {
                          const usertourId = nav.usertour?._id;
                          const tourId = tourDetail?._id;

                          if (usertourId && tourId) {
                            await dispatch(
                              fetchUserTourPoints({ tourId, usertourId })
                            ).unwrap();
                            console.log(
                              "✅ usertourPoints refreshed after stamp"
                            );
                          } else {
                            console.warn(
                              "⚠️ Cannot refresh usertourPoints: missing usertourId or tourId",
                              { usertourId, tourId }
                            );
                          }
                        } catch (refreshErr) {
                          console.error(
                            "❌ Failed to refresh user tourpoints after stamp:",
                            refreshErr
                          );
                          // don't block success toast if refresh fails
                        }

                        /* ------------------------------------------------
                           6️⃣ Remove queue item + Toast Success
                        ------------------------------------------------ */
                        dispatch(confirm(String(item.id)));
                        toast.dismiss(t);

                        toast.success(`${translate('checked_in_at')} ${item.name}`, {
                          description: nav.activeTourId
                            ? `${translate('visit_progress_update')}`
                            : `${translate('visit_progress_success')}`,
                          duration: 5000,
                        });
                      } catch (err: any) {
                        console.error("❌ Check-in error:", err);
                        toast.error(translate("failed_to_complete_checkin"), {
                          description:
                            err?.message || translate("please_try_again"),
                        });
                      }
                    }}
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

    // Clear queue after creating toasts
    dispatch(clearQueue());
  }, [queue, dispatch, auth, nav, tourDetail]);

  return null;
}

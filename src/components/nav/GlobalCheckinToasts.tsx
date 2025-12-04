"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useAppSelector, useAppDispatch } from "@/lib/store/hook";
import { store } from "@/lib/store";

import {
  selectGeofenceQueue,
  confirm,
  markShown,
  selectGeofenceShown,
} from "@/lib/store/slices/geofenceSlice";

import { selectNav, fetchUserTourPoints } from "@/lib/store/slices/navSlice";

import { selectTourDetail } from "@/lib/store/slices/touristSlice";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import { apiCreateVisitHistory } from "@/services/myListService";
import { apiCreateStamp } from "@/services/userNavService";
import { useLocale } from "@/providers/LocaleProvider";

/* --------------------
    Sanitize HTML
-------------------- */
function sanitizeHTML(input: string): string {
  if (!input) return "";
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/on\w+="[^"]*"/gi, "");
}

/* ----------------------------------------------
   GLOBAL CHECK-IN POPUP
---------------------------------------------- */
export default function GlobalCheckinToasts() {
  const dispatch = useAppDispatch();
  const { t: translate } = useLocale();

  const queue = useAppSelector(selectGeofenceQueue);
  const shown = useAppSelector(selectGeofenceShown) || [];

  const nav = useAppSelector(selectNav);
  const tourDetail = useAppSelector(selectTourDetail);
  const auth = useAppSelector((s) => s.auth.data);

  const popupLock = useRef(false);

  /* -------------------------------------------------------
     EFFECT → Opens popup whenever queue has new item
  -------------------------------------------------------- */
  useEffect(() => {
    if (popupLock.current) return;
    if (!queue.length) return;

    const item = queue[0];
    const successText = translate("checked_in_at");
    const failedCheckInText = translate("failed_to_complete_checkin");
    const pleaseTryAgainText = translate("please_try_again");
    const pleaseSignInText = translate("please_signin_to_checkin");
    const nearText = translate("you_are_near");
    const reachedText = translate("reached_check_in_location");
    const latText = translate("lat");
    const longText = translate("long");
    const radiusText = translate("radius");
    const closeText = translate("close");
    const checkInText = translate("check_in");

    if (shown.includes(item.id)) {
      dispatch(confirm(item.id));
      return;
    }

    popupLock.current = true;

    toast.custom(
      (t) =>
        createPortal(
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm">
            <div className="relative w-[90%] max-w-md p-6 rounded-2xl shadow-2xl bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-slate-700">
              {/* Title */}
              <h3 className="font-semibold text-lg mb-3 break-words">
                {nearText}: {item.name}
              </h3>

              {/* Description */}
              {item.blurb ? (
                <div
                  className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed prose dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(item.blurb) }}
                />
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {reachedText}
                </p>
              )}

              {/* Coordinates */}
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-4 space-y-1 text-left">
                <p>
                  <strong>{latText}:</strong> {item.lat?.toFixed(6) ?? "—"}
                </p>
                <p>
                  <strong>{longText}:</strong> {item.lng?.toFixed(6) ?? "—"}
                </p>
                <p>
                  <strong>{radiusText}:</strong> {item.radius ?? "—"} m
                </p>
              </div>

              {/* Buttons */}
              <div className="flex justify-center gap-3">
                {/* Close */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    toast.dismiss(t);
                    dispatch(confirm(item.id));
                    dispatch(markShown(item.id));
                    popupLock.current = false;
                  }}
                >
                  {closeText}
                </Button>

                {/* CHECK-IN BUTTON */}
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={async () => {
                    try {
                      /* --------------------------------
                         1️⃣ Validate user
                      -------------------------------- */
                      const userId =
                        auth?.user?._id ||
                        auth?.user?.id ||
                        auth?.user?.uuid ||
                        null;

                      if (!userId) {
                        toast.error(pleaseSignInText);
                        toast.dismiss(t);
                        return;
                      }

                      /* --------------------------------
                         2️⃣ Create Visit History
                      -------------------------------- */
                      await apiCreateVisitHistory({
                        user: userId,
                        historytype: "monument",
                        monument: String(item.monumentId),
                        status: "active",
                        visitmode: "manual",
                        historytime: Date.now().toString(),
                      });

                      /* --------------------------------
                         3️⃣ Create Stamp
                      -------------------------------- */
                      if (item.monumentId && item.tourpointId) {
                        await apiCreateStamp({
                          monument: String(item.monumentId),
                          tourpoint: String(item.tourpointId),
                          user: String(userId),
                          status: "active",
                          stamptime: Date.now(),
                        });
                      }

                      /* --------------------------------
                         4️⃣ Refresh usertourPoints (FIXED)
                      -------------------------------- */
                      try {
                        await new Promise((res) => setTimeout(res, 50)); // 🔥 Give Redux time to update

                        // Always fetch the latest IDs from store
                        const state = store.getState();
                        const freshNav = state.nav;
                        const freshTour = state.tourist.detail;

                        const usertourId =
                          freshNav.usertour?._id || nav.usertour?._id;

                        const tourId = freshTour?._id || tourDetail?._id;

                        if (usertourId && tourId) {
                          await dispatch(
                            fetchUserTourPoints({ tourId, usertourId })
                          ).unwrap();
                        }
                      } catch (err) {
                        console.error("Error refreshing tourpoints:", err);
                      }

                      /* --------------------------------
                         5️⃣ Complete
                      -------------------------------- */
                      dispatch(confirm(item.id));
                      dispatch(markShown(item.id));

                      toast.dismiss(t);
                      toast.success(
                        `${successText} ${item.name}`
                      );
                    } catch (err: any) {
                      console.error("Check-in error:", err);

                      toast.error(failedCheckInText, {
                        description:
                          err?.message || pleaseTryAgainText,
                      });
                    }

                    popupLock.current = false;
                  }}
                >
                  {checkInText}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        ),
      { id: `checkin-${item.id}`, duration: Infinity }
    );
  }, [queue, shown]); // 👈 cleaned deps (no stale refs)

  return null;
}

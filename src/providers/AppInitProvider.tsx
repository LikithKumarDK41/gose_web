"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";

import {
  setUserLocation,
  updateUserLocation,
  markLocationFetched,
  setLocationDenied,
  selectLocationFetched,
  selectLocationDenied,
} from "@/lib/store/slices/globalSlice";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPinOff } from "lucide-react";

export default function AppInitProvider() {
  const dispatch = useAppDispatch();
  const locationFetched = useAppSelector(selectLocationFetched);
  const locationDenied = useAppSelector(selectLocationDenied);

  const [mounted, setMounted] = useState(false);
  const [showDeniedPopup, setShowDeniedPopup] = useState(false);

  /* --------------------------------------------------------
     STEP 1 → Fix hydration issues
  -------------------------------------------------------- */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* --------------------------------------------------------
     STEP 2 → Request permission only first time
  -------------------------------------------------------- */
  useEffect(() => {
    if (!mounted) return;
    if (locationFetched) return;

    if (!navigator.geolocation) {
      dispatch(markLocationFetched());
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Save first-time location
        dispatch(
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          })
        );
        dispatch(markLocationFetched());
      },
      () => {
        dispatch(setLocationDenied());
        dispatch(markLocationFetched());
        setShowDeniedPopup(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [mounted, locationFetched, dispatch]);

  /* --------------------------------------------------------
     STEP 3 → Continuous location watch (AFTER permission)
  -------------------------------------------------------- */
  useEffect(() => {
    if (!mounted) return;
    if (locationDenied) return; // cannot track

    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        dispatch(
          updateUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          })
        );
      },
      (err) => {
        console.warn("GPS Live Tracking Error:", err);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [mounted, locationDenied, dispatch]);

  /* --------------------------------------------------------
     UI - Location Denied Popup
  -------------------------------------------------------- */
  return (
    <>
      {mounted && (
        <Dialog open={showDeniedPopup}>
          <DialogContent
            className="
              w-[90%] max-w-md rounded-2xl shadow-xl 
              bg-white/95 dark:bg-zinc-900/80
              backdrop-blur-xl border border-black/10 dark:border-white/10
              p-6 animate-in fade-in-0 zoom-in-90
            "
          >
            <DialogHeader className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <MapPinOff className="h-8 w-8 text-red-600" />
              </div>

              <DialogTitle className="mt-4 text-lg font-semibold">
                Location Permission Needed
              </DialogTitle>

              <DialogDescription className="mt-2 text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed">
                To show nearby points and improve navigation accuracy,
                please enable location access in your browser settings.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-5">
              <Button
                variant="outline"
                className="w-full rounded-full"
                onClick={() => setShowDeniedPopup(false)}
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

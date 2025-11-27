"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/providers/LocaleProvider";
import { MapPin, X, ArrowLeft, Info } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import { createPortal } from "react-dom";
import { apiFetchPlaces } from "@/services/userGlobalservice";
import type { PlaceItem } from "@/lib/types/userGlobal.types";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

/* =========================
   Helper Functions
========================== */
function stripHTML(html?: string): string {
  return html ? html.replace(/<[^>]+>/g, "").trim() : "";
}

function escapeText(s?: string) {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sanitizeRichHtml(input?: string) {
  if (!input) return "";
  const wrapper = document.createElement("div");
  wrapper.innerHTML = input;
  wrapper.querySelectorAll("script, style, iframe, object, embed").forEach((n) => n.remove());
  return wrapper.innerHTML;
}

function tidyParagraphs(html: string) {
  return html.replace(/<p>\s*<\/p>/g, "").replace(/(\s*<br>\s*){3,}/g, "<br><br>");
}

/* =========================
   Main Modal
========================== */
export default function PlaceDetailModal({
  open,
  onClose,
  loading,
  details,
  customStyle,
}: {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  details: any;
  customStyle?: string;
}) {
  const { t } = useLocale();
  const [showMap, setShowMap] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const safeText = (v: any) =>
    !v ? "" : typeof v === "string" ? v : v.title || v.name || "";

  useEffect(() => {
    if (details && contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [details]);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          showCloseButton={false}
          className="z-[20000] w-screen h-screen bg-background p-0 !max-w-full overflow-hidden"
        >
          {/* === Header === */}
          <DialogHeader className="flex items-center justify-center border-b bg-background py-4 px-8 relative">
            <DialogTitle className="text-xl font-semibold truncate text-center">
              {safeText(details?.title || details?.name)}
            </DialogTitle>
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-6 w-6" />
            </button>
          </DialogHeader>

          {/* === Body === */}
          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto px-8 py-6 space-y-10"
          >
            {loading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                {t("common.loading")}
              </div>
            ) : (
              details && (
                <>
                  {/* Image */}
                  {details.image?.secure_url && (
                    <div className="relative h-[420px] w-full overflow-hidden rounded-xl shadow-md ring-1 ring-border">
                      <Image
                        src={details.image.secure_url}
                        alt={safeText(details.title)}
                        fill
                        className="object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  )}

                  {/* Title + Category */}
                  <section>
                    <h2 className="text-2xl font-bold tracking-tight">
                      {safeText(details.title || details.name)}
                    </h2>
                    {details.category?.title && (
                      <p className="mt-1 text-sm flex items-center gap-2 text-muted-foreground">
                        {details.category.title}
                        <Badge
                          className={`${customStyle ||
                            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                            }`}
                        >
                          {details.category.name || ""}
                        </Badge>
                      </p>
                    )}
                  </section>

                  {/* Content */}
                  {(details.content?.brief || details.content?.extended) && (
                    <section className="prose max-w-none text-sm text-muted-foreground dark:prose-invert space-y-3">
                      {details.content?.brief && (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: sanitizeRichHtml(details.content.brief),
                          }}
                        />
                      )}
                      {details.content?.extended && (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: sanitizeRichHtml(details.content.extended),
                          }}
                        />
                      )}
                    </section>
                  )}

                  {/* Address */}
                  {details.content &&
                    stripHTML(details.content.extended)?.match(/\d{2,}-\d+/) && (
                      <section>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-gray-500" />{" "}
                          {t("shortcut.tourist_attraction_details.address")}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {stripHTML(details.content.extended)}
                        </p>
                      </section>
                    )}

                  {/* Image Credit */}
                  {details.imagecredit && (
                    <section>
                      <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
                        <Info className="h-4 w-4 text-gray-500" />{" "}
                        {t("shortcut.tourist_attraction_details.image_credit")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {stripHTML(details.imagecredit)}
                      </p>
                    </section>
                  )}
                </>
              )
            )}
          </div>

          {/* === Footer === */}
          <div className="border-t bg-background p-6">
            <Button
              size="lg"
              onClick={() => setShowMap(true)}
              className={`cursor-pointer w-full rounded-full flex items-center justify-center gap-2 ${customStyle ||
                "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                }`}
            >
              <MapPin className="h-5 w-5" />
              {t("view_on_map")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* === Map Overlay === */}
      {showMap && <FullscreenMap details={details} onClose={() => setShowMap(false)} />}
    </>
  );
}

/* =========================
   Fullscreen Map Component
========================== */
export function FullscreenMap({
  details,
  onClose,
}: {
  details: any;
  onClose: () => void;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);
  const { locale } = useLocale();

  // ✅ Create custom category icon marker with styled popup (from TourMap)
  const createCategoryMarker = (map: mapboxgl.Map, place: PlaceItem, iconUrl: string, color: string) => {
    if (!Array.isArray(place.location) || place.location.length !== 2) return null;

    const [lng, lat] = place.location;
    const el = document.createElement("div");
    el.style.width = "44px";
    el.style.height = "44px";
    el.style.borderRadius = "50%";
    el.style.background = "white";
    el.style.border = `3px solid ${color}`;
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";

    const img = document.createElement("img");
    img.src = iconUrl;
    img.alt = place.title;
    img.style.width = "26px";
    img.style.height = "26px";
    img.style.objectFit = "contain";
    el.appendChild(img);

    /* Popup Layout (TourMap reference) */
    const briefHtml = tidyParagraphs(
      sanitizeRichHtml(
        (place.content as any)?.brief ??
        ""
      )
    );

    const image = place.image?.secure_url
      ? `<img src="${place.image.secure_url}" alt="" class="tour-popup__img" />`
      : "";

    const html = `
      <div class="tour-popup__card">
        ${image ? `<div class="tour-popup__media">${image}</div>` : ""}
        <div class="tour-popup__body">
          <div class="tour-popup__title">${escapeText(place.title)}</div>
          <div class="tour-popup__brief">${briefHtml}</div>
        </div>
      </div>
    `;

    const popup = new mapboxgl.Popup({
      offset: 22,
      className: "tour-popup",
      closeButton: true,
      closeOnMove: false,
      maxWidth: "320px",
    }).setHTML(html);

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map);

    return marker;
  };

  /* -------------------- Initialize Map -------------------- */
  useEffect(() => {
    if (!details?.location || details.location.length !== 2) return;
    const [lng, lat] = details.location;

    const map = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: 15,
    });

    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    const iconUrl = details.category?.image?.secure_url || "";
    const color = "#d97706";
    const marker = createCategoryMarker(map, details, iconUrl, color);
    if (marker) setMarkers([marker]);

    setTimeout(() => map.resize(), 300);
    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [details]);

  /* -------------------- Handle Category Click -------------------- */
  async function handleCategoryClick() {
    if (!mapRef.current || !details?.category?._id) return;
    try {
      setLoadingCategory(true);

      const allPlaces = await apiFetchPlaces();
      const sameCategory = allPlaces.filter(
        (p: PlaceItem) =>
          p.category?._id === details.category._id &&
          Array.isArray(p.location) &&
          p.location.length === 2
      );

      markers.forEach((m) => m.remove());
      const map = mapRef.current!;
      const newMarkers: mapboxgl.Marker[] = [];
      const bounds = new mapboxgl.LngLatBounds();
      const iconUrl = details.category?.image?.secure_url || "";
      const color = "#d97706";

      sameCategory.forEach((place: PlaceItem) => {
        const marker = createCategoryMarker(map, place, iconUrl, color);
        if (marker && Array.isArray(place.location)) {
          bounds.extend([place.location[0], place.location[1]]);
          newMarkers.push(marker);
        }
      });

      setMarkers(newMarkers);
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 100 });

      setLoadingCategory(false);
    } catch (err) {
      console.error("Failed to load same-category places:", err);
      setLoadingCategory(false);
    }
  }

  /* -------------------- Render -------------------- */
  return createPortal(
    <div
      className="
        fixed inset-0 z-[25000] 
        bg-background/60 backdrop-blur-sm
        flex items-center justify-center
        pointer-events-auto
      "
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="relative w-[90vw] h-[80vh] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

        {/* === Top Bar === */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-[2] bg-gradient-to-b from-background/80 to-transparent">
          {/* Back */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-background/80 backdrop-blur-md hover:bg-background/60 border border-border"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Category Icon + Title */}
          <div className="flex items-center gap-3 pr-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCategoryClick();
              }}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-background/80 hover:bg-background/60 border border-border backdrop-blur-md"
              title="Show all in this category"
              disabled={loadingCategory}
            >
              {details.category?.image?.secure_url ? (
                <img
                  src={details.category.image.secure_url}
                  alt={details.category.title}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <MapPin className="w-6 h-6 text-muted-foreground" />
              )}
            </button>

            <div className="flex flex-col text-right pointer-events-none">
              <h2 className="text-base font-semibold">
                {details.category?.title}
              </h2>
              {loadingCategory && (
                <p className="text-xs text-muted-foreground animate-pulse">
                  Loading…
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

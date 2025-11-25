"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ImageIcon,
  Landmark,
  MapPin,
  Store,
  Route,
  Layers,
  Star,
  Globe,
  Info,
  X,
  CalendarDays,
  BookmarkCheck,
  Bookmark,
} from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";
import { useRef, useEffect, useState } from "react";
import {
  apiFetchEventsByMonument,
  EventItem,
  apiFetchBookmarkByRef,
  apiRemoveBookmark,
  apiCreateBookmark,
} from "@/services/userGlobalservice";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
interface MonumentDetailModalProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  details: any;
  onOpenAnother: (id: string) => void;
  customStyle?: string;
}

/* ------------------------------------------------------------------ */
export default function MonumentDetailModal({
  open,
  onClose,
  loading,
  details,
  onOpenAnother,
  customStyle,
}: MonumentDetailModalProps) {
  const { t } = useLocale();
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<EventItem[]>([]);

  const userData =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("auth_user") || "null")
      : null;

  const userId = userData?.user?._id || null;
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);

  useEffect(() => {
    if (details?._id) {
      (async () => {
        try {
          const data = await apiFetchEventsByMonument(details._id);

          setEvents(data);
        } catch (err) {
          console.error("Failed to load events:", err);
        }
      })();
    }
  }, [details]);

  // Scroll to top whenever new monument details are loaded
  useEffect(() => {
    if (details && contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [details]);

  const safeText = (v: any): string => {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (Array.isArray(v))
      return v
        .map((x) => x?.title || x?.name || "")
        .filter(Boolean)
        .join(", ");
    if (typeof v === "object") return v.title || v.name || v._id || "";
    return String(v);
  };

  const stripHTML = (html?: string): string =>
    html ? html.replace(/<[^>]+>/g, "").trim() : "";

  const plainAddress = stripHTML(details?.access);
  const plainCredit = stripHTML(details?.imagecredit);
  interface BookmarkItem {
    _id: string;
    marktype: string;
    status: string;
    monument?: { _id: string };
    tour?: { _id: string };
  }

  useEffect(() => {
    if (!details?._id || !userId) return;

    let stop = false;

    (async () => {
      try {
        const res = (await apiFetchBookmarkByRef()) as any;
        if (stop) return;

        let bookmark: BookmarkItem | null = null;

        if (Array.isArray(res?.bookmarks?.results)) {
          bookmark = res.bookmarks.results.find(
            (b: BookmarkItem) =>
              b.marktype === "monument" &&
              b.monument?._id === details._id &&
              b.status === "active"
          ) || null;
        } else if (res?.monument?._id === details._id) {
          bookmark = res as BookmarkItem;
        }

        const bmId =
          bookmark?._id ||
          (bookmark as any)?.data?._id ||
          (bookmark as any)?.bookmark?._id ||
          null;

        setIsBookmarked(!!bmId);
        setBookmarkId(bmId);
      } catch (e) {
        console.error("Bookmark check failed:", e);
        if (!stop) {
          setIsBookmarked(false);
          setBookmarkId(null);
        }
      }
    })();

    return () => {
      stop = true;
    };
  }, [details?._id, userId]);

  const handleBookmarkToggle = async () => {
    if (!userId || !details?._id) {
      toast.error("Please log in to bookmark.");
      return;
    }

    const marktype = details?.type === "tour" ? "tour" : "monument";

    try {
      if (isBookmarked) {
        if (!bookmarkId) {
          console.warn("❌ No bookmark ID to remove");
          return;
        }

        console.log("🔴 Removing bookmark:", bookmarkId);
        await apiRemoveBookmark(bookmarkId);

        setIsBookmarked(false);
        setBookmarkId(null);
        toast.info(t("bookmark_removed"));
        return;
      }

      // ADD bookmark
      const payload = {
        user: userId,
        marktype,
        [marktype]: details._id,
        status: "active",
      };

      const created: any = await apiCreateBookmark(payload);

      const newId =
        created?._id || created?.data?._id || created?.bookmark?._id || null;

      console.log("🟢 Bookmark created id:", newId);

      setIsBookmarked(true);
      setBookmarkId(newId);
      toast.success(t("bookmark_added"));
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
      toast.error("Failed to update bookmark");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="z-50 w-screen h-screen bg-background p-0 !max-w-full overflow-hidden"
      >
        {/* ---------------- Header ---------------- */}
        <DialogHeader className="flex items-center border-b bg-background py-4 px-8 relative">
          {/* Title centered */}
          <DialogTitle className="text-xl font-semibold truncate mx-auto transition-opacity duration-300">
            {safeText(details?.title || details?.name || "Details")}
          </DialogTitle>

          {/* Close button at right */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-6 top-1/2 -translate-y-1/2 
               text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 
               transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 p-2"
          >
            <X className="h-6 w-6" strokeWidth={2} />
          </button>
        </DialogHeader>

        {/* ---------------- Content ---------------- */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-8 py-6 space-y-10 transition-opacity duration-300"
        >
          {loading ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : (
            details && (
              <>
                {/* 🖼 Main Image */}
                {details.image?.secure_url && (
                  <div className="relative h-[420px] w-full overflow-hidden rounded-xl shadow-md ring-1 ring-border">
                    <Image
                      src={details.image.secure_url}
                      alt={safeText(details.title)}
                      fill
                      className="object-cover transition-transform hover:scale-105"
                    />
                    {/* 🔖 Bookmark Button */}
                    <button
                      onClick={handleBookmarkToggle}
                      className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
                      aria-label="Toggle bookmark"
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="h-6 w-6 text-yellow-400" />
                      ) : (
                        <Bookmark className="h-6 w-6 text-white" />
                      )}
                    </button>
                  </div>
                )}

                {!details.image?.secure_url && (
                  <button
                    onClick={handleBookmarkToggle}
                    className="absolute top-20 right-6 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
                    aria-label="Toggle bookmark"
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="h-6 w-6 text-yellow-400" />
                    ) : (
                      <Bookmark className="h-6 w-6 text-white" />
                    )}
                  </button>
                )}

                {/* 🏛 Title + Region */}
                <section>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {safeText(details.title || details.name)}
                  </h2>
                  {details.region &&
                    (details.region.title || details.region.name) && (
                      <p className="mt-1 text-sm flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        {safeText(details.region.title || details.region.name)}
                      </p>
                    )}
                </section>

                {/* 📖 Content */}
                {(details.content?.brief || details.content?.extended) && (
                  <section className="prose max-w-none text-sm leading-relaxed text-muted-foreground space-y-3 dark:prose-invert">
                    {details.content?.brief && (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: details.content.brief,
                        }}
                      />
                    )}
                    {details.content?.extended && (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: details.content.extended,
                        }}
                      />
                    )}
                  </section>
                )}

                {/* 🏷 Meta */}
                <section className="flex flex-wrap gap-2">
                  {safeText(details.era) && (
                    <Badge
                      className={`${customStyle ||
                        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                        }`}
                    >
                      {t("shortcut.tourist_attraction_details.era")}:{" "}
                      {details.era}
                    </Badge>
                  )}
                  {safeText(details.year) && (
                    <Badge
                      className={`${customStyle ||
                        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                        }`}
                    >
                      {t("shortcut.tourist_attraction_details.year")}:{" "}
                      {details.year}
                    </Badge>
                  )}
                  {safeText(details.size) && (
                    <Badge
                      className={`${customStyle ||
                        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                        }`}
                    >
                      {t("shortcut.tourist_attraction_details.size")}:{" "}
                      {details.size}
                    </Badge>
                  )}
                  {safeText(details.mtype) && (
                    <Badge
                      className={`${customStyle ||
                        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                        }`}
                    >
                      {t("shortcut.tourist_attraction_details.type")}:{" "}
                      {details.mtype}
                    </Badge>
                  )}
                  {details.featured && (
                    <Badge
                      className={`${customStyle ||
                        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                        }`}
                    >
                      {t("shortcut.tourist_attraction_details.featured")}
                    </Badge>
                  )}
                  {details.rare && (
                    <Badge
                      className={`${customStyle ||
                        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                        }`}
                    >
                      {t("shortcut.tourist_attraction_details.rare")}
                    </Badge>
                  )}
                  {details.popularity && (
                    <Badge
                      className={`${customStyle ||
                        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                        }`}
                    >
                      {t("shortcut.tourist_attraction_details.popularity")}:{" "}
                      {details.popularity}
                    </Badge>
                  )}
                  {details.priority && (
                    <Badge
                      className={`${customStyle ||
                        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                        }`}
                    >
                      {t("shortcut.tourist_attraction_details.priority")}:{" "}
                      {details.priority}
                    </Badge>
                  )}
                  {details.georadius && (
                    <Badge
                      className={`${customStyle ||
                        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                        }`}
                    >
                      {t("shortcut.tourist_attraction_details.radius")}:{" "}
                      {details.georadius}m
                    </Badge>
                  )}
                </section>

                {/* 🏠 Address */}
                {plainAddress && (
                  <section>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
                      <Layers className="h-4 w-4 text-gray-500" />{" "}
                      {t("shortcut.tourist_attraction_details.address")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {plainAddress}
                    </p>
                  </section>
                )}

                {/* 🌍 Region Info */}
                {details.region && (
                  <section>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-gray-500" />{" "}
                      {t("shortcut.tourist_attraction_details.region_info")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {stripHTML(details.region.content?.brief)}{" "}
                      {stripHTML(details.region.content?.extended)}
                    </p>
                  </section>
                )}

                {/* 📷 Image Credit */}
                {plainCredit && (
                  <section>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
                      <Info className="h-4 w-4 text-gray-500" />{" "}
                      {t("shortcut.tourist_attraction_details.image_credit")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {plainCredit}
                    </p>
                  </section>
                )}

                {/* 🏷 Theme / Subtheme */}
                {(details.theme?.length || details.subtheme?.length) && (
                  <section>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-gray-500" />{" "}
                      {t("shortcut.tourist_attraction_details.classification")}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {details.theme?.map((th: any, i: number) => (
                        <Badge
                          key={th._id || `theme-${i}`}
                          className={`${customStyle ||
                            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                            }`}
                        >
                          {safeText(th.title || th.name)}
                        </Badge>
                      ))}
                      {details.subtheme?.map((sth: any, i: number) => (
                        <Badge
                          key={sth._id || `subtheme-${i}`}
                          className={`${customStyle ||
                            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                            }`}
                        >
                          {safeText(sth.title || sth.name)}
                        </Badge>
                      ))}
                    </div>
                  </section>
                )}

                {/* 🖼 Gallery */}
                {!!details.gallery?.length && (
                  <section>
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-lg text-foreground">
                      <ImageIcon className="h-5 w-5 text-gray-500" />{" "}
                      {t("shortcut.tourist_attraction_details.gallery")}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {details.gallery.map(
                        (img: any, i: number) =>
                          img.secure_url && (
                            <div
                              key={img.secure_url || `gallery-${i}`}
                              className="relative h-40 overflow-hidden rounded-md shadow-sm"
                            >
                              <Image
                                src={img.secure_url}
                                alt=""
                                fill
                                className="object-cover hover:scale-105 transition-transform"
                              />
                            </div>
                          )
                      )}
                    </div>
                  </section>
                )}

                {/* 🏛 Nearby Monuments */}
                {!!details.nearbymonuments?.length && (
                  <section>
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-lg text-foreground">
                      <Landmark className="h-5 w-5 text-gray-500" />{" "}
                      {t(
                        "shortcut.tourist_attraction_details.nearby_monuments"
                      )}
                    </h3>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {details.nearbymonuments.map((m: any) => (
                        <div
                          key={m._id}
                          className="overflow-hidden rounded-xl border bg-card flex flex-col h-full shadow-sm hover:shadow-md transition"
                        >
                          {m.image?.secure_url ? (
                            <div className="relative h-40">
                              <Image
                                src={m.image.secure_url}
                                alt={safeText(m.title)}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="grid h-40 place-items-center bg-muted">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}

                          <div className="flex flex-col justify-between h-full p-4">
                            <h4 className="text-sm font-semibold text-foreground">
                              {safeText(m.title)}
                            </h4>

                            {m.content?.brief && (
                              <p className="text-xs text-muted-foreground">
                                {stripHTML(m.content.brief)}
                              </p>
                            )}

                            <Button
                              size="sm"
                              className={`cursor-pointer w-full rounded-full ${customStyle ||
                                "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700"
                                }`}
                              onClick={() => onOpenAnother(m._id)}
                            >
                              {t("tourDetails.viewDetails")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 🧭 Related Tours */}
                {!!details.relatedtours?.length && (
                  <section>
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-lg text-foreground">
                      <Route className="h-5 w-5 text-gray-500" />{" "}
                      {t("shortcut.tourist_attraction_details.related_tours")}
                    </h3>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {details.relatedtours.map((tour: any) => (
                        <div
                          key={tour._id}
                          className="overflow-hidden rounded-xl border bg-card flex flex-col h-full shadow-sm hover:shadow-md transition"
                        >
                          {tour.image?.secure_url ? (
                            <div className="relative h-40">
                              <Image
                                src={tour.image.secure_url}
                                alt={safeText(tour.title)}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="grid h-40 place-items-center bg-muted">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}

                          <div className="flex flex-col justify-between h-full p-4">
                            <h4 className="text-sm font-semibold text-foreground">
                              {safeText(tour.title)}
                            </h4>

                            {tour.content?.brief && (
                              <p className="text-xs text-muted-foreground">
                                {stripHTML(tour.content.brief)}
                              </p>
                            )}

                            <Button
                              size="sm"
                              className={`cursor-pointer w-full rounded-full ${customStyle ||
                                "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 "
                                }`}
                              onClick={() =>
                                router.push(`/tours/detail/?id=${tour._id}`)
                              }
                            >
                              {t("shortcut.tourist_attraction_details.go_tour")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 🏬 Nearby Services */}
                {!!details.nearbyservices?.length && (
                  <section>
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-lg text-foreground">
                      <Store className="h-5 w-5 text-gray-500" />{" "}
                      {t("shortcut.tourist_attraction_details.nearby_services")}
                    </h3>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {details.nearbyservices.map((srv: any) => (
                        <div
                          key={srv._id || srv.name}
                          className="p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition flex flex-col gap-2"
                        >
                          {srv.image?.secure_url && (
                            <div className="relative h-32 w-full overflow-hidden rounded-md">
                              <Image
                                src={srv.image.secure_url}
                                alt={srv.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <h4 className="font-medium text-sm text-foreground">
                            {safeText(srv.name)}
                          </h4>
                          {srv.category && (
                            <p className="text-xs text-muted-foreground">
                              {t(
                                "shortcut.tourist_attraction_details.category"
                              )}
                              : {safeText(srv.category.name)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                {/* 📅 Events linked to this Monument */}
                {!!events.length && (
                  <section>
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-lg text-foreground">
                      <CalendarDays className="h-5 w-5 text-gray-500" />
                      {t("event_header")}
                    </h3>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {events.map((ev, i) => (
                        <div
                          key={ev._id || `event-${i}`}
                          className="overflow-hidden rounded-xl border bg-card flex flex-col h-full shadow-sm hover:shadow-md transition"
                        >
                          {/* 🖼 Image */}
                          {ev.image?.secure_url ? (
                            <div className="relative h-40">
                              <Image
                                src={ev.image.secure_url}
                                alt={ev.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="grid h-40 place-items-center bg-muted">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}

                          {/* 📄 Event Info */}
                          <div className="flex flex-col justify-between h-full p-4 space-y-2">
                            <h4 className="text-sm font-semibold text-foreground">
                              {ev.title}
                            </h4>

                            {/* {ev.displaydate && (
              <p className="text-xs text-muted-foreground">
                <CalendarDays className="inline h-3 w-3 mr-1 text-gray-500" />
                {ev.displaydate}
              </p>
            )} */}

                            {ev.description && (
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {ev.description || ""}
                              </p>
                            )}

                            <Button
                              size="sm"
                              className={`cursor-pointer w-full rounded-full mt-2 ${customStyle ||
                                " bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 "
                                }`}
                              onClick={() => {
                                router.push(`/shortcuts/events/?id=${ev._id}`);
                              }}
                            >
                              {t("tourDetails.viewDetails")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )
          )}
        </div>

        {/* ---------------- Footer ---------------- */}
        <div className="border-t bg-background p-6">
          <Button
            size="lg"
            className={`cursor-pointer w-full rounded-full flex items-center justify-center gap-2 ${customStyle ||
              "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700"
              }`}
          >
            <MapPin className="h-5 w-5" />
            {t("tourDetails.checkIn")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

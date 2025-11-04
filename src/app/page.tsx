"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAppSelector, useAppDispatch } from "@/lib/store/hook";
import { fetchTours, selectTours } from "@/lib/store/slices/touristSlice";
import {
  fetchShortcuts,
  selectShortcuts,
  selectGlobalLoading,
  setActiveTheme,
} from "@/lib/store/slices/globalSlice";
import {
  selectNav,
  setActiveTour,
  stopTour,
} from "@/lib/store/slices/navSlice";
import { resetAll as resetGeofence } from "@/lib/store/slices/geofenceSlice";
import { useLocale } from "@/providers/LocaleProvider";
import { useGlobalLoader } from "@/providers/LoaderProvider";
import { useRouter } from "next/navigation";

export default function ToursDashboardPage() {
  const { t } = useLocale();
  const dispatch = useAppDispatch();
  const { show, hide } = useGlobalLoader();

  const tours = useAppSelector(selectTours);
  const nav = useAppSelector(selectNav);
  const shortcuts = useAppSelector(selectShortcuts);
  const globalLoading = useAppSelector(selectGlobalLoading);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        show();
        await Promise.all([dispatch(fetchTours()), dispatch(fetchShortcuts())]);
      } finally {
        if (mounted) hide();
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, [dispatch, show, hide]);

  const hasTours = (tours?.length ?? 0) > 0;

  // ✅ Priority placement
  function placeByPriority(list: any[]) {
    const ordered: any[] = [];
    const nullZero: any[] = [];
    const leftovers: any[] = [];

    list.forEach((s) => {
      const p = s.priority ?? 0;
      if (p === 0) {
        nullZero.push(s);
      } else if (Number.isInteger(p) && p > 0) {
        ordered[p] = s;
      } else {
        leftovers.push(s);
      }
    });

    return nullZero.concat(ordered.filter(Boolean)).concat(leftovers);
  }

  const sectionOne = placeByPriority(
    shortcuts.filter((s) => {
      const p = s.priority ?? 0;
      return p >= 0 && p <= 3;
    })
  );

  const sectionTwo = placeByPriority(
    shortcuts.filter((s) => {
      const p = s.priority ?? 0;
      return p >= 4 && p <= 9;
    })
  );

  return (
    <div className="space-y-12">
      {/* ===== Shortcuts by Priority ===== */}
      <div className="space-y-10">
        {globalLoading ? (
          <div className="text-center text-sm text-muted-foreground">
            {t("loading_shortcuts")}
          </div>
        ) : (
          <>
            {sectionOne.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center justify-center space-x-4">
                  <span className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent dark:via-indigo-500" />
                  <h2 className="bg-gradient-to-r from-indigo-500 to-sky-500 dark:from-indigo-300 dark:to-sky-400 bg-clip-text text-transparent text-2xl font-extrabold tracking-wide">
                    {t("main_categories")}
                  </h2>
                  <span className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent dark:via-indigo-500" />
                </div>
                <ShortcutGrid shortcuts={sectionOne} />
              </section>
            )}

            {sectionTwo.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center justify-center space-x-4">
                  <span className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent dark:via-pink-500" />
                  <h2 className="bg-gradient-to-r from-pink-500 to-fuchsia-500 dark:from-pink-300 dark:to-fuchsia-400 bg-clip-text text-transparent text-2xl font-extrabold tracking-wide">
                    {t("more_options")}
                  </h2>
                  <span className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent dark:via-pink-500" />
                </div>
                <ShortcutGrid shortcuts={sectionTwo} />
              </section>
            )}
          </>
        )}
      </div>

      {/* ===== Tours grid (Updated Design) ===== */}
      {hasTours && (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {tours.slice(0, 6).map((tour) => (
            <div
              key={tour._id}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/40 shadow-md hover:shadow-xl transition-all border"
            >
              {/* Image Section */}
              <div className="relative h-48 w-full overflow-hidden">
                {tour.image?.secure_url ? (
                  <img
                    src={tour.image.secure_url}
                    alt={tour.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h3 className="line-clamp-1 text-base font-semibold text-sky-700 dark:text-cyan-300">
                    {tour.title}
                  </h3>
                  {tour.content?.brief && (
                    <p
                      className="text-xs text-muted-foreground mt-1 line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: (tour.content.brief ?? "")
                          .replace(/<[^>]+>/g, "")
                          .replace(/&nbsp;|&#160;/gi, " ")
                          .trim(),
                      }}
                    />
                  )}
                </div>

                <Button
                  onClick={() =>
                    (window.location.href = `/tours/detail?id=${tour._id}`)
                  }
                  className="cursor-pointer mt-3 h-9 rounded-lg bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 text-white hover:opacity-90 transition-all"
                >
                  {t("actions.details")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tours.length > 6 && (
        <div className="mt-6 flex justify-center">
          <Button asChild className="rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 text-white hover:opacity-90">
            <Link href="/tours">{t("actions.show_more")}</Link>
          </Button>
        </div>
      )}

      {!hasTours && (
        <div className="rounded-xl border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {t("no_tours_available")}
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------- 🔘 Confirmation Popup Wrapper ---------- */
function ConfirmPopupButton({
  label,
  href,
  variant,
  icon,
  gradient,
  tourId,
}: {
  label: string;
  href: string;
  variant?: "secondary" | "outline" | "default";
  icon?: React.ReactNode;
  gradient?: string;
  tourId: string;
}) {
  const nav = useAppSelector(selectNav);
  const tourist = useAppSelector((state) => state.tourist);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    const currentDetailId = tourist?.detail?._id;

    if (nav.status === "idle" || !nav.activeTourId) {
      e.preventDefault();
      router.push(href);
      return;
    }

    if (nav.activeTourId === tourId || currentDetailId === tourId) {
      e.preventDefault();
      router.push(href);
      return;
    }

    e.preventDefault();
    setOpen(true);
  };

  const handleConfirm = async () => {
    dispatch(resetGeofence());
    dispatch(stopTour());
    dispatch(setActiveTour(null));
    localStorage.removeItem("navState");

    setOpen(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          className={
            gradient ||
            "bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 text-white hover:opacity-90"
          }
          onClick={handleClick}
        >
          {icon}
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>
            A different tour is currently active. Do you want to stop it and
            continue?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Yes, Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Reusable Shortcuts Grid ---------- */
function ShortcutGrid({ shortcuts }: { shortcuts: any[] }) {
  const gradients = [
    "from-indigo-400 to-sky-400",
    "from-emerald-400 to-teal-400",
    "from-pink-400 to-rose-400",
    "from-amber-400 to-orange-400",
    "from-fuchsia-400 to-violet-400",
    "from-cyan-400 to-blue-400",
  ];

  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleShortcutClick = (shortcut: any) => {
    try {
      if (shortcut.link && shortcut.link.trim().startsWith("{")) {
        const parsedLink = JSON.parse(shortcut.link);
        if (parsedLink.theme) {
          dispatch(setActiveTheme(parsedLink.theme));
        }
      }

      const priority = shortcut.priority ?? null;

      switch (priority) {
        case null:
          router.push("/shortcuts/tourist-map");
          break;
        case 2:
          router.push("/shortcuts/tourist-attractions");
          break;
        case 3:
          router.push("/shortcuts/about");
          break;
        case 4:
          router.push("/shortcuts/events");
          break;
        case 5:
          router.push("/shortcuts/gourmet-products");
          break;
        case 6:
          router.push("/shortcuts/facility");
          break;
        case 7:
          router.push("/shortcuts/mt-kongo-and-katsuragi");
          break;
        case 8:
          router.push("/shortcuts/city-promotion");
          break;
        case 9:
          router.push("/shortcuts/meetings");
          break;
        default:
          router.push("/shortcuts/others");
          break;
      }
    } catch (err) {
      console.error("❌ Error parsing shortcut link:", err);
    }
  };

  return (
    <div className="flex flex-wrap justify-center gap-8">
      {shortcuts.map((item, idx) => {
        const gradient = gradients[idx % gradients.length];

        return (
          <div
            key={item._id}
            className="flex flex-col items-center text-center cursor-pointer"
            onClick={() => handleShortcutClick(item)}
          >
            <div
              className={`h-20 w-20 rounded-full flex items-center justify-center 
                          bg-gradient-to-br ${gradient} text-white shadow-md
                          hover:scale-105 transition-transform`}
            >
              {item.icon?.secure_url ? (
                <img
                  src={item.icon.secure_url}
                  alt={item.title}
                  className="h-12 w-12 object-contain"
                />
              ) : (
                <ImageIcon className="h-8 w-8" />
              )}
            </div>
            <span className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              {item.title}
            </span>
          </div>
        );
      })}
    </div>
  );
}

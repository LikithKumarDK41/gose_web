"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/lib/store";
import { apiFetchEvents } from "@/services/userGlobalservice";
import type { EventItem } from "@/services/userGlobalservice";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MonumentDetailModal from "@/components/tour/MonumentDetailModal";
import { fetchMonumentDetails } from "@/lib/store/slices/touristSlice";
import { useGlobalLoader } from "@/providers/LoaderProvider";

/* ------------------------------------------------------------
   🌅 Events Page (Sunrise Rose–Amber–Lime Theme)
------------------------------------------------------------ */
export default function EventsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { show, hide } = useGlobalLoader();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [open, setOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeMonument, setActiveMonument] = useState<any | null>(null);

  /* -------------------- Fetch Events -------------------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        show();
        const data = await apiFetchEvents();
        if (alive) setEvents(data);
      } catch (err) {
        console.error("Failed to fetch events", err);
      } finally {
        if (alive) hide();
      }
    })();
    return () => {
      alive = false;
    };
  }, [show, hide]);

  /* -------------------- Group Events -------------------- */
  const groupedEvents = useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    for (const e of events) {
      const month = (e.eventmonth || "その他").trim();
      if (!map[month]) map[month] = [];
      map[month].push(e);
    }
    const sortedKeys = Object.keys(map).sort((a, b) => {
      const na = Number(a),
        nb = Number(b);
      if (isNaN(na) || isNaN(nb)) return a.localeCompare(b);
      return na - nb;
    });
    return { map, sortedKeys };
  }, [events]);

  /* -------------------- Modal Handling -------------------- */
  async function handleOpenMonument(event: EventItem) {
    const monumentId = event.monument?._id;
    if (!monumentId) {
      console.warn("No monument linked to this event");
      return;
    }

    setModalLoading(true);
    setOpen(true);
    show();

    try {
      const thunk = dispatch(fetchMonumentDetails(monumentId));
      const data = await thunk.unwrap();
      setActiveMonument(data);
    } catch (err) {
      console.error("Failed to fetch monument:", err);
    } finally {
      setModalLoading(false);
      hide();
    }
  }

  const details = activeMonument;

  /* -------------------- Layout -------------------- */
  return (
    <div>
      {/* Hero Section */}
      <section className="relative w-full mx-auto bg-gradient-to-r from-rose-400 via-amber-400 to-lime-400 text-white rounded-3xl shadow-xl mt-4 mb-10">
        <div className="max-w-5xl mx-auto py-16 px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide mb-3 drop-shadow-md">
            イベント・行祭事
          </h1>
          <p className="text-lg md:text-xl font-medium opacity-90">
            御所市の季節行事を見つけよう
          </p>
        </div>
      </section>

      {/* Tabs Section */}
      {events.length > 0 ? (
        <section className="mt-8">
          <Tabs
            defaultValue={groupedEvents.sortedKeys[0]}
            className="w-full"
          >
            {/* Scrollable Tabs */}
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-amber-400 scrollbar-track-transparent pb-2">
              <TabsList className="flex min-w-max justify-center gap-2 bg-white/40 dark:bg-white/10 rounded-2xl p-2 mx-auto backdrop-blur">
                {groupedEvents.sortedKeys.map((monthKey) => (
                  <TabsTrigger
                    key={monthKey}
                    value={monthKey}
                    className="px-5 py-2 text-sm font-medium rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-400 data-[state=active]:via-amber-400 data-[state=active]:to-lime-400 data-[state=active]:text-white whitespace-nowrap transition"
                  >
                    {monthKey}月
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Events Grid */}
            {groupedEvents.sortedKeys.map((monthKey) => (
              <TabsContent
                key={monthKey}
                value={monthKey}
                className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fadeIn"
              >
                {groupedEvents.map[monthKey].map((ev) => (
                  <EventCard
                    key={ev._id}
                    ev={ev}
                    onOpen={() => handleOpenMonument(ev)}
                  />
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </section>
      ) : (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          イベント情報が見つかりません。
        </div>
      )}

      {/* Monument Detail Modal */}
      {details && (
        <MonumentDetailModal
          open={open}
          onClose={() => setOpen(false)}
          loading={modalLoading}
          details={details}
          onOpenAnother={(id) =>
            handleOpenMonument({ monument: { _id: id } } as any)
          }
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------
   🎴 Event Card
------------------------------------------------------------ */
function EventCard({ ev, onOpen }: { ev: EventItem; onOpen: () => void }) {
  return (
    <Card className="overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/50 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all py-0">
      <div className="relative">
        {ev.image?.secure_url ? (
          <img
            src={ev.image.secure_url}
            alt={ev.title}
            className="w-full h-40 object-cover"
          />
        ) : (
          <div className="w-full h-40 bg-gray-200 dark:bg-gray-800 grid place-items-center">
            <span className="text-gray-400 text-xs">No Image</span>
          </div>
        )}
        <div className="absolute top-2 left-2 bg-gradient-to-r from-rose-400 via-amber-400 to-lime-400 text-white text-[11px] font-bold py-0.5 px-2 rounded-md shadow-sm">
          {ev.displaydate || "日付未定"}
        </div>
      </div>

      <div className="p-3 flex flex-col justify-between h-full">
        <div className="space-y-1">
          <h3 className="font-semibold text-[15px] text-amber-700 dark:text-amber-300 line-clamp-2">
            {ev.title}
          </h3>

          {ev.monument?.title && (
            <p className="text-[13px] text-rose-600 dark:text-rose-400 font-medium">
              {ev.monument.title}
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full h-8 text-[13px] text-white bg-gradient-to-r from-rose-400 via-amber-400 to-lime-400 hover:opacity-90 transition flex justify-center items-center gap-1"
          onClick={onOpen}
        >
          詳細を見る
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Button>
      </div>
    </Card>
  );
}

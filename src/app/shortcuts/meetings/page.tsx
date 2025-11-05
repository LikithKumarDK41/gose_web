"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/providers/LocaleProvider";

export default function MeetingsPage() {
  const { t } = useLocale();

  const menuItems = [
    {
      label: t("meetings.special_products"),
      icon: "/icons/bottle.png",
      link: "https://www.city.gose.nara.jp/kankou/0000001527.html",
    },
    {
      label: t("meetings.photo_contest"),
      icon: "/icons/camera_sight_seeing.png",
      link: "https://www.city.gose.nara.jp/kankou/0000001582.html",
    },
    {
      label: t("meetings.bus_katsuragi"),
      icon: "/icons/bus.png",
      link: "/shortcuts/meetings/bus",
    },
    {
      label: t("meetings.gosen_character"),
      icon: "/icons/doll.png",
      link: "/shortcuts/meetings/gose-character",
    },
  ];

  return (
    <div className="space-y-10">
      <section className="relative w-full mx-auto bg-transparent text-black dark:text-white rounded-2xl shadow-xl mt-4 mb-10">
        <div className="max-w-5xl mx-auto py-16 px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide mb-3 drop-shadow-md">
            {t("meetings.title")}
          </h1>
          <p className="text-lg md:text-xl font-medium opacity-90">
            {t("shortcut.tourist_attraction_desc")}
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-5">
        {menuItems.map((item, idx) => (
          <Link key={idx} href={item.link}>
            <div
              className="flex items-center h-16 rounded-xl shadow-md overflow-hidden
                            bg-gradient-to-r from-green-600 via-yellow-500 to-orange-500
                            hover:scale-[1.02] transition transform duration-200"
            >
              <div className="w-20 flex justify-center items-top">
                <Image
                  src={item.icon}
                  width={60}
                  height={60}
                  alt={item.label}
                  className="object-contain"
                />
              </div>

              <div className="flex-1 text-right pr-5 text-white font-semibold text-lg">
                {item.label}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

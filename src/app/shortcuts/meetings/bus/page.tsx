"use client";

import Link from "next/link";
import { FileText, ExternalLink } from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";

type Item = {
  label: string;
  href: string;
  kind: "pdf" | "web";
};

function LinkRow({ item }: { item: Item }) {
  const isPdf = item.kind === "pdf";
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 text-sky-700 hover:text-sky-900 underline underline-offset-2 p-2 rounded-md focus:outline-none"
    >
      {isPdf ? (
        <FileText className="size-5 shrink-0" />
      ) : (
        <ExternalLink className="size-5 shrink-0" />
      )}
      <span className="leading-snug">{item.label}</span>
    </Link>
  );
}

export default function TimetablePage() {
  const { t } = useLocale();

  // TODO: replace hrefs with your real URLs
  const communityBusItems: Item[] = [
    {
      label: t("bus.community_timetable"), // コミュニティバス時刻表
      href: "/docs/himawari_timing.pdf",
      kind: "pdf",
    },
    {
      label: t("bus.sunflower_about"), // コミュニティバスひまわり号について（ルート図）
      href: "/docs/himawari_map.pdf",
      kind: "pdf",
    },
  ];

  const ropewayItems: Item[] = [
    {
      label: t("bus.kinetsu_bus_ropeway"), // 近鉄電車・奈良交通バス・葛城索道線連絡時刻表
      href: "https://www.kintetsu.co.jp/railway/Dia/katsuragi/connect01.html",
      kind: "web",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Page Title */}
      <h1 className="text-2xl font-bold text-center mt-4 mb-6 text-orange-600">
        {t("bus.title")}
      </h1>

      {/* Section: Community Bus (Himawari) */}
      <div className="mb-8">
        <div
          className="rounded-xl shadow-sm text-white font-semibold px-4 py-3 mb-4
                        bg-gradient-to-r from-green-700 via-yellow-500 to-orange-500"
        >
          {t("bus.himawari_header") /* 御所市コミュニティバス「ひまわり号」 */}
        </div>

        <div className="flex flex-col gap-4 pl-1">
          {communityBusItems.map((item, i) => (
            <LinkRow key={i} item={item} />
          ))}
        </div>
      </div>

      {/* Section: Mt. Katsuragi Ropeway */}
      <div>
        <div
          className="rounded-xl shadow-sm text-white font-semibold px-4 py-3 mb-4
                        bg-gradient-to-r from-green-700 via-yellow-500 to-orange-500"
        >
          {t("bus.katsuragi_ropeway_header") /* 葛城山ロープウェイ */}
        </div>

        <div className="flex flex-col gap-4 pl-1">
          {ropewayItems.map((item, i) => (
            <LinkRow key={i} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

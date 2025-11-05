"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/providers/LocaleProvider";

export default function GosenChanPage() {
  const { t } = useLocale();

  return (
    <div className="space-y-10">
      {/* TITLE */}
      <h1 className="text-2xl font-bold text-center mt-4 mb-6 text-orange-600">
        {t("gosen.title")}
      </h1>

      {/* MAIN DESCRIPTION */}
      <p className="text-base leading-relaxed mb-4">
        {t("gosen.description_1")}
      </p>

      <p className="text-base leading-relaxed mb-6">
        {t("gosen.description_2")}
      </p>
      <p className="text-base leading-relaxed mb-6">
        {t("gosen.description_3")}
      </p>
      <p className="text-base leading-relaxed mb-6">
        {t("gosen.description_4")}
      </p>

      {/* IMAGE */}
      <div className="flex justify-center mb-8">
        <Image
          src="/gosenchan_kihon.webp"
          alt="Gosen-chan"
          width={350}
          height={350}
          className="rounded-xl"
        />
      </div>

      <p className="text-base leading-relaxed mb-6">
        {t("gosen.gosechan_logo_top_desc")}
      </p>

      <Image
        alt="Gosenchan logo"
        width={350}
        height={350}
        src="/logos/gosenchan_logo.webp"
      />
      <p className="text-base leading-relaxed mb-6">
        {t("gosen.gosechan_logo_bottom_desc")}
      </p>

      {/* GOODS SECTION */}
      <div
        className="rounded-xl shadow-sm text-white font-semibold px-4 py-3 mb-4
                        bg-gradient-to-r from-green-700 via-yellow-500 to-orange-500"
      >
        {t("gosen.goods_title")}
      </div>

      {/* GOODS IMAGE */}
      <div className="flex justify-center mb-8">
        <Image
          src="/gosenchan_doll.webp"
          alt="Gosen-chan Doll"
          width={350}
          height={350}
          className="rounded-xl"
        />
      </div>

      <p className="mb-2">{t("gosen.goods_desc")}</p>

      <Link
        href="https://www.city.gose.nara.jp/kankou/0000003094.html"
        className="text-sky-700 hover:text-sky-900 underline underline-offset-2 font-medium block mb-6"
      >
        {t("gosen.goods_link")}
      </Link>

      {/* LINE STAMP SECTION */}
      <div
        className="rounded-xl shadow-sm text-white font-semibold px-4 py-3 mb-4
                        bg-gradient-to-r from-green-700 via-yellow-500 to-orange-500"
      >
        {t("gosen.line_title")}
      </div>

      <p className="mb-1">{t("gosen.line_desc")}</p>

      <Link
        href="https://store.line.me/stickershop/product/1257995/en?ref=gnsh_stickerDetail"
        className="text-sky-700 hover:text-sky-900 underline underline-offset-2 font-medium"
      >
        {t("gosen.line_link")}
      </Link>

      <p className="mt-2 mb-10">{t("gosen.line_footer")}</p>
    </div>
  );
}

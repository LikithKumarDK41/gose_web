"use client";

import React from "react";
import { useLocale } from "@/providers/LocaleProvider";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  const { t } = useLocale();

  return (
    <div className="mt-8">
      {/* ===== HERO SECTION ===== */}
      <section className="relative w-full mx-auto bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 text-white rounded-2xl shadow-xl mt-4 mb-10">
        <div className="max-w-5xl mx-auto py-16 px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide mb-3 drop-shadow-md">
            {t("privacy.title")}
          </h1>
          <p className="text-lg md:text-xl font-medium opacity-90">
            {t("privacy.updated")}: 2025/01/01
          </p>
        </div>
      </section>

      <div className="sm:px-6">
        {/* Sections */}
        <div className="bg-white dark:bg-slate-900/40 p-8 rounded-2xl shadow-md">
          <PolicySection
            title={t("privacy.general.title")}
            desc={t("privacy.general.desc")}
          />
          <PolicySection
            title={t("privacy.jurisdiction.title")}
            desc={t("privacy.jurisdiction.desc")}
          />
          <PolicySection
            title={t("privacy.account.title")}
            desc={t("privacy.account.desc")}
          />
          <PolicySection
            title={t("privacy.features.title")}
            desc={t("privacy.features.desc")}
          />
          <PolicySection
            title={t("privacy.analytics.title")}
            desc={t("privacy.analytics.desc")}
          />
          <PolicySection
            title={t("privacy.usage.title")}
            desc={t("privacy.usage.desc")}
          />
          <PolicySection
            title={t("privacy.security.title")}
            desc={t("privacy.security.desc")}
          />
          <PolicySection
            title={t("privacy.location.title")}
            desc={t("privacy.location.desc")}
          />
          <PolicySection
            title={t("privacy.contact.title")}
            desc={t("privacy.contact.desc")}
          />
        </div>
      </div>
    </div>
  );
}

/* ✅ Reusable Section Component */
function PolicySection({ title, desc }: { title: string; desc: string }) {
  return (
    <section className="mb-6">
      <h2 className="text-2xl font-bold text-sky-700 dark:text-cyan-300 mb-3 border-b pb-2">
        {title}
      </h2>
      <p className="leading-relaxed whitespace-pre-line text-muted-foreground">
        {desc}
      </p>
    </section>
  );
}

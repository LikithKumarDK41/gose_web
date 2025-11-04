"use client";

import React from "react";
import { useLocale } from "@/providers/LocaleProvider";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  const { t } = useLocale();

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Link>

        {/* Title */}
        <h1 className="text-4xl font-bold mb-2">
          {t("privacy.title")}
        </h1>

        <p className="text-sm mb-8">
          {t("privacy.updated")}: 2025/01/01
        </p>

        {/* Sections */}
        <PolicySection title={t("privacy.general.title")} desc={t("privacy.general.desc")} />
        <PolicySection title={t("privacy.jurisdiction.title")} desc={t("privacy.jurisdiction.desc")} />
        <PolicySection title={t("privacy.account.title")} desc={t("privacy.account.desc")} />
        <PolicySection title={t("privacy.features.title")} desc={t("privacy.features.desc")} />
        <PolicySection title={t("privacy.analytics.title")} desc={t("privacy.analytics.desc")} />
        <PolicySection title={t("privacy.usage.title")} desc={t("privacy.usage.desc")} />
        <PolicySection title={t("privacy.security.title")} desc={t("privacy.security.desc")} />
        <PolicySection title={t("privacy.location.title")} desc={t("privacy.location.desc")} />
        <PolicySection title={t("privacy.contact.title")} desc={t("privacy.contact.desc")} />

        {/* Footer */}
        <div className="mt-10 pt-6 text-sm text-center">
          © {new Date().getFullYear()} 御所市観光ナビ — {t("privacy.rights")}
        </div>
      </div>
    </main>
  );
}

/* ✅ Reusable Section Component */
function PolicySection({ title, desc }: { title: string; desc: string }) {
  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold pl-2 mb-2">
        {title}
      </h2>
      <p className="leading-relaxed whitespace-pre-line">
        {desc}
      </p>
    </section>
  );
}

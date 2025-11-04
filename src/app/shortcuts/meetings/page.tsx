"use client";

import { useLocale } from "@/providers/LocaleProvider";

export default function MeetingsPage() {
  const { t } = useLocale();
  return <div>{t("meetings.title")}</div>;
}
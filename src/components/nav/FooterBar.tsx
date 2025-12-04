'use client';

import Link from 'next/link';
import { Github, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useLocale } from '@/providers/LocaleProvider';
import Image from 'next/image';

export default function FooterBar() {
  const { t } = useLocale();

  return (
    <footer className="relative border-t border-border bg-background/80 backdrop-blur">
      {/* Top gradient line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500" />

      <div className="mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* ✅ Brand Logo (same as header) */}
          <Link
            href="/"
            aria-label="Gose City Tours"
            className="group relative inline-flex items-center gap-2 rounded-xl"
          >
            {/* 🌟 Unified soft glow behind image + text */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 rounded-xl
              bg-gradient-to-r from-sky-400/15 via-cyan-400/15 to-emerald-400/15
              dark:from-sky-400/25 dark:via-cyan-400/25 dark:to-emerald-400/25
              blur-lg transition-all duration-700 opacity-80 group-hover:blur-xl group-hover:opacity-100"
            />

            {/* 🖼️ Logo + Text group */}
            <div className="relative flex items-center">
              <Image
                src="/logos/gose_logo.png"
                alt="Gose City Tours"
                width={45}
                height={45}
                className="object-contain transition-transform duration-500 group-hover:scale-105"
                priority
              />

              <div className="flex flex-col leading-tight select-none">
                <span className="text-[15px] font-bold bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-clip-text text-transparent drop-shadow-[0_0_6px_rgba(56,189,248,0.7)]">
                  御所市観光ナビ
                </span>
                <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300 tracking-wide">
                  Gose City Tours
                </span>
              </div>
            </div>
          </Link>

          {/* 🌐 Social Links */}
          {/* <div className="flex items-center gap-4">
            <SocialLink href="https://github.com" icon={<Github className="h-5 w-5" />} label={t('footer.social.github')} />
            <SocialLink href="https://twitter.com" icon={<Twitter className="h-5 w-5" />} label={t('footer.social.twitter')} />
            <SocialLink href="https://instagram.com" icon={<Instagram className="h-5 w-5" />} label={t('footer.social.instagram')} />
            <SocialLink href="https://linkedin.com" icon={<Linkedin className="h-5 w-5" />} label={t('footer.social.linkedin')} />
          </div> */}
        </div>

        {/* Copyright */}
        <div className="mt-6 flex flex-wrap items-center justify-between border-t pt-4 text-xs text-muted-foreground">
          <div>{t('footer.copyright', { year: new Date().getFullYear() })}</div>
          <Link
            href="/privacy-policy"
            className="hover:text-foreground transition"
          >
            {t('privacyPolicy')}
          </Link>
        </div>
      </div>
    </footer>
  );
}

/* =========================================================
   🔗 Reusable Social Link Component
========================================================= */
function SocialLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition"
    >
      {icon}
    </Link>
  );
}

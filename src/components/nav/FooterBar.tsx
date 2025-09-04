// src/components/nav/FooterBar.tsx
'use client';

import Link from 'next/link';
import { Compass, Github, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function FooterBar() {
  return (
    <footer className="relative border-t border-border bg-background/80 backdrop-blur">
      {/* top accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />

      <div className="mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* brand */}
          <div className="text-center sm:text-left">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow">
                <Compass className="h-5 w-5" />
              </span>
              <span className="text-base font-semibold tracking-tight">
                Tourist
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Guides • Maps • Live
                </span>
              </span>
            </Link>

            <p className="mt-2 max-w-md text-xs text-muted-foreground">
              Explore curated routes, navigate in real-time, and keep your own library of places.
            </p>
          </div>

          {/* social links */}
          <div className="flex items-center gap-4">
            <SocialLink href="https://github.com" icon={<Github className="h-5 w-5" />} label="GitHub" />
            <SocialLink href="https://twitter.com" icon={<Twitter className="h-5 w-5" />} label="Twitter" />
            <SocialLink href="https://instagram.com" icon={<Instagram className="h-5 w-5" />} label="Instagram" />
            <SocialLink href="https://linkedin.com" icon={<Linkedin className="h-5 w-5" />} label="LinkedIn" />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} Tourist. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}

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

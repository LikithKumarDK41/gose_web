// src/components/nav/FooterBar.tsx
'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Compass, Map, SatelliteDish, BookMarked, Github } from 'lucide-react';

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

          {/* nav */}
          <nav className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <FooterLink href="/tours" label="Tours" icon={<Compass className="h-4 w-4" />} />
            <FooterLink href="/map" label="Map" icon={<Map className="h-4 w-4" />} />
            <FooterLink href="/tracking" label="Live" icon={<SatelliteDish className="h-4 w-4" />} />
            <FooterLink href="/library" label="Library" icon={<BookMarked className="h-4 w-4" />} />
          </nav>

          {/* tech chips */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary" className="bg-muted">Next.js</Badge>
            <Badge variant="secondary" className="bg-muted">MapLibre</Badge>
            <Badge variant="secondary" className="bg-muted">turf.js</Badge>
            <Badge className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-200">
              PWA
            </Badge>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} Tourist. All rights reserved.</div>
          <div className="flex items-center gap-3">
            <Link
              href="https://github.com/"
              target="_blank"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <span className="text-muted-foreground group-hover:text-foreground">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

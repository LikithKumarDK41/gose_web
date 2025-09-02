// src/app/guide/page.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HardHat, Sparkles } from 'lucide-react';

export default function GuidePage() {
  return (
    <div className="relative overflow-hidden rounded-2xl border shadow-sm">
      {/* background blobs (light/dark friendly) */}
      <div className="pointer-events-none absolute -top-24 -right-12 h-96 w-96 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-400 to-fuchsia-400 opacity-60 blur-3xl dark:opacity-40" />
      <div className="pointer-events-none absolute -bottom-28 -left-16 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 opacity-60 blur-3xl dark:opacity-40" />

      {/* soft veil for light mode contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/50 to-white/10 dark:from-transparent dark:via-transparent" />

      {/* dotted texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_1px)] [background-size:12px_12px] dark:opacity-[0.08]" />

      {/* centered content */}
      <div className="relative grid min-h-[70vh] place-items-center px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white shadow ring-1 ring-white/10 backdrop-blur dark:bg-black/60">
            <HardHat className="h-3.5 w-3.5" />
            In development
          </div>

          <h1 className="animated-gradient-text mx-auto mt-2 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-6xl">
            This page is under active development
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-700/85 dark:text-white/90">
            We’re crafting a guided experience here. Check back soon for tips, walkthroughs,
            and curated routes.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button asChild variant="secondary" className="rounded-full">
              <Link href="/">Back to Home</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/tours">
                <Sparkles className="mr-1 h-4 w-4" />
                Explore Tours
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* tiny CSS block (no styled-jsx, avoids parser errors) */}
      <style
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `
.animated-gradient-text{
  background: linear-gradient(90deg,#6366f1,#06b6d4,#10b981,#a855f7,#6366f1);
  background-size:300% 100%;
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
  animation:guideGradientShift 12s ease infinite;
  text-shadow:0 1px 0 rgba(0,0,0,0.03);
}
@keyframes guideGradientShift{
  0%{background-position:0% 50%}
  50%{background-position:100% 50%}
  100%{background-position:0% 50%}
}
          `,
        }}
      />
    </div>
  );
}

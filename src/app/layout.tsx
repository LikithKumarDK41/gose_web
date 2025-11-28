// src/app/layout.tsx
import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import StoreProvider from "@/providers/StoreProvider";
import AppShell from "@/components/layout/AppShell";
import LoaderProvider from "@/providers/LoaderProvider";
import GeoWatcher from "@/components/geo/GeoWatcher";
import GlobalCheckinToasts from "@/components/nav/GlobalCheckinToasts";
import { LocaleProvider } from "@/providers/LocaleProvider";
import AuthGuard from "@/components/system/AuthGuard";
import AppToaster from "@/components/system/AppToaster";

import AppInitProvider from "@/providers/AppInitProvider";

export const metadata: Metadata = { title: "Tourist" };
export const viewport: Viewport = { themeColor: "#0b0f14" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        {/* theme bootstrap script (unchanged) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  window.__theme = {
                    get: function () { return localStorage.getItem('theme-mode') || 'system'; },
                    set: function (mode) {
                      localStorage.setItem('theme-mode', mode);
                      if (mode === 'dark') document.documentElement.classList.add('dark');
                      else document.documentElement.classList.remove('dark');
                    },
                  };
                  const current = window.__theme.get();
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (current === 'dark' || (current === 'system' && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />

        <StoreProvider>
          <LoaderProvider>
            <LocaleProvider>
              {/* <AppInitProvider /> */}

              <AppShell>
                <AuthGuard>{children}</AuthGuard>
              </AppShell>

              <GeoWatcher />
              <GlobalCheckinToasts />
            </LocaleProvider>
          </LoaderProvider>
        </StoreProvider>

        {/* Toaster */}
        <AppToaster />
      </body>
    </html>
  );
}

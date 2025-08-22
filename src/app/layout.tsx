import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import Providers from "@/app/providers";
import AppShell from "@/components/layout/AppShell";
import LoaderProvider from "@/components/system/LoaderProvider";
import TourNavProvider from "@/providers/TourNavProvider";
import GeofenceProvider from "@/providers/GeofenceProvider";
import GlobalCheckinToasts from "@/components/nav/GlobalCheckinToasts"; // <-- NEW

export const metadata: Metadata = { title: "Tourist" };
export const viewport: Viewport = { themeColor: "#0b0f14" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <Providers>
          <LoaderProvider>
            <TourNavProvider>
              <GeofenceProvider>
                <AppShell>{children}</AppShell>
                <GlobalCheckinToasts />  {/* global top-center toast */}
              </GeofenceProvider>
            </TourNavProvider>
          </LoaderProvider>
        </Providers>
      </body>
    </html>
  );
}

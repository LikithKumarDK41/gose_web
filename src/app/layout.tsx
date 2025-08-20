// src/app/layout.tsx
import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import Providers from "@/app/providers"; // your Redux/etc
import AppShell from "@/components/layout/AppShell";
import LoaderProvider from "@/components/system/LoaderProvider";

export const metadata: Metadata = { title: "Tourist" };
export const viewport: Viewport = { themeColor: "#0b0f14" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <Providers>
          <LoaderProvider>
            <AppShell>{children}</AppShell>
          </LoaderProvider>
        </Providers>
      </body>
    </html>
  );
}

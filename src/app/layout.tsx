import '@/app/globals.css';
import type { Metadata, Viewport } from 'next';
import StoreProvider from '@/providers/StoreProvider';
import AppShell from '@/components/layout/AppShell';
import LoaderProvider from '@/providers/LoaderProvider';
import GeoWatcher from '@/components/geo/GeoWatcher';
import GlobalCheckinToasts from '@/components/nav/GlobalCheckinToasts';

export const metadata: Metadata = { title: 'Tourist' };
export const viewport: Viewport = { themeColor: '#0b0f14' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <StoreProvider>
          <LoaderProvider>
            <AppShell>
              {children}
            </AppShell>
            <GeoWatcher />
            <GlobalCheckinToasts />
          </LoaderProvider>
        </StoreProvider>
      </body>
    </html>
  );
}

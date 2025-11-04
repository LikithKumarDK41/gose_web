'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { TooltipProvider } from '@/components/ui/tooltip';
import HeaderBar from '@/components/nav/HeaderBar';
import Sidebar from '@/components/nav/Sidebar';
import MobileSidebar from '@/components/nav/MobileSidebar';
import FooterBar from '@/components/nav/FooterBar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // ✅ list of routes where header/footer should be hidden
  const authRoutes = ['/signin', '/register', '/forgot-password', '/public/gallery'];
  const isAuthPage = authRoutes.some((route) => pathname.startsWith(route));

  return (
    <TooltipProvider delayDuration={150}>
      <div className="relative z-10 flex min-h-dvh flex-col">
        {!isAuthPage && (
          <div className="shrink-0">
            <HeaderBar onOpenSidebar={() => setMobileOpen(true)} />
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

          <div className="flex min-w-0 flex-1 flex-col">
            <main className={isAuthPage ? 'flex-1' : 'flex-1 px-4 py-6'}>
              {children}
            </main>
            {!isAuthPage && (
              <div className="shrink-0">
                <FooterBar />
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

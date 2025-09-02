// src/components/layout/AppShell.tsx
'use client';
import { useState } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import HeaderBar from '@/components/nav/HeaderBar';
import Sidebar from '@/components/nav/Sidebar';
import MobileSidebar from '@/components/nav/MobileSidebar';
import FooterBar from '@/components/nav/FooterBar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={150}>
      {/* ⬇️ Was: h-dvh overflow-hidden — this made only <main> scroll */}
      <div className="flex min-h-dvh flex-col">
        <div className="shrink-0">
          <HeaderBar onOpenSidebar={() => setMobileOpen(true)} />
        </div>

        <div className="flex min-h-0 flex-1">
          {/* <div className="hidden lg:block">
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
          </div> */}
          <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

          <div className="flex min-w-0 flex-1 flex-col">
            {/* ⬇️ Removed overflow-y-auto so page scrolls normally */}
            <main className="flex-1 px-4 py-6">{children}</main>
            <div className="shrink-0">
              <FooterBar />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

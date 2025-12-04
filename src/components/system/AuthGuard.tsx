// src/components/system/AuthGuard.tsx
'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/lib/store/hook';
import { FullScreenLoader } from './FullScreenLoader';

const PUBLIC_PATHS = new Set<string>([
  '/signin',         // auth page
]);

function isPublicRoute(pathname: string) {
  // treat /signin and nested (e.g., /signin/reset) as public
  if (pathname === '/signin' || pathname.startsWith('/signin/')) return true;
  return PUBLIC_PATHS.has(pathname);
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  // redux auth state
  const authData = useAppSelector((s) => s.auth.data);

  // wait until client hydrates before deciding
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);

  // optional: debounce one tick so thunks can commit before we check
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(t);
  }, [hydrated]);

  // compute the "next" URL (path + query)
  const nextUrl = React.useMemo(() => {
    const qs = search?.toString();
    return qs ? `${pathname}?${qs}` : pathname || '/';
  }, [pathname, search]);

  React.useEffect(() => {
    if (!ready) return;

    // allow public routes without checks
    if (isPublicRoute(pathname)) return;

    // if not authenticated, redirect to signin with ?next=
    if (!authData?.user) {
      router.replace(`/signin?next=${encodeURIComponent(nextUrl)}`);
    }
    // else: do nothing, render children
  }, [ready, pathname, nextUrl, authData?.user, router]);

  // While not hydrated/ready or while deciding unauth -> redirect, show loader
  if (!ready) return <FullScreenLoader />;

  // If route is public, always render children
  if (isPublicRoute(pathname)) return <>{children}</>;

  // Private route: render only when we have a user
  if (!authData?.user) return <FullScreenLoader />;

  return <>{children}</>;
}

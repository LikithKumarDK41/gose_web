// src/components/system/AuthGuard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FullScreenLoader } from './FullScreenLoader';
import { useAppSelector } from '@/lib/store/hook';

const PUBLIC_PATHS = ['/signin']; // only signin is public

function normalizePath(path: string) {
  if (path === '/') return '/';
  return path.replace(/\/+$/, '');
}

function isPublic(pathname: string) {
  const normalized = normalizePath(pathname);
  return PUBLIC_PATHS.includes(normalizePath(normalized));
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<'checking' | 'allowed'>('checking');

  // ✅ Use Redux-auth value
  const authData = useAppSelector((s) => s.auth.data);

  useEffect(() => {
    setStatus('checking');

    if (isPublic(pathname)) {
      setStatus('allowed');
      return;
    }

    if (authData?.user) {
      setStatus('allowed');
    } else {
      const next = encodeURIComponent(pathname || '/');
      router.replace(`/signin?next=${next}`);
    }
  }, [pathname, router, authData]);

  if (status === 'checking') return <FullScreenLoader />;

  return <>{children}</>;
}

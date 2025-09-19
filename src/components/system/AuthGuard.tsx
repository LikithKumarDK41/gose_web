// src/components/system/AuthGuard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FullScreenLoader } from './FullScreenLoader';

const PUBLIC_PATHS = [
  '/', 
  '/tours', 
  '/mylist', 
  '/tours/detail', 
  '/tours/detail/navigation', 
  '/guide',
];

function normalizePath(path: string) {
  if (path === '/') return '/';
  return path.replace(/\/+$/, ''); // remove trailing slashes
}

function isPublic(pathname: string) {
  const normalized = normalizePath(pathname);
  return PUBLIC_PATHS.includes(normalizePath(normalized));
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<'checking' | 'allowed'>('checking');

  useEffect(() => {
    // Always start in "checking" so nothing protected renders first
    setStatus('checking');

    if (isPublic(pathname)) {
      setStatus('allowed');
      return;
    }

    // Client-side token check (for localStorage workflows)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (token) {
        setStatus('allowed');
      } else {
        // Use replace so there's no history entry to a protected page
        router.replace('/');
      }
    } catch {
      router.replace('/');
    }
  }, [pathname, router]);

  // While checking, show nothing or your loader (both avoid showing protected UI)
  if (status === 'checking') {
    return <FullScreenLoader />; // or `return null`
  }

  return <>{children}</>;
}

'use client';

import { Toaster } from 'sonner';

export default function AppToaster() {
    return (
        <Toaster
            position="top-right"
            richColors
            closeButton
            theme="system"        // respects your dark class from RootLayout
            toastOptions={{       // optional sensible defaults
                duration: 3500,
            }}
        />
    );
}

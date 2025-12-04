// src/lib/store/StoreProvider.tsx
"use client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/lib/store";
import React from "react";

/**
 * StoreProvider wraps the application with Redux + Redux Persist.
 * It ensures persisted slices (nav, geofence, etc.) are restored before rendering.
 */
export default function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <div className="flex h-screen items-center justify-center text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
              Loading saved state…
            </div>
          </div>
        }
        persistor={persistor}
      >
        {children}
      </PersistGate>
    </Provider>
  );
}

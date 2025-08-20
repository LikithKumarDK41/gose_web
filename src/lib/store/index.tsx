"use client";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import plan from "@/lib/store/slices/planSlice";
import positions from "@/lib/store/slices/positionSlice";

export const store = configureStore({ reducer: { plan, positions } });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

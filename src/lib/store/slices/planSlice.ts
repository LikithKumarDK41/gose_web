"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Mode = "car" | "walk" | "bus";
export type Stop = {
    id: string; order: number; time: string; title: string; subtitle: string;
    lat: number; lng: number; image?: string; radius?: number; checkedInAt?: number | null;
};
export type Leg = { fromId: string; toId: string; mode: Mode; minutes: number; };

type PlanState = {
    name: string; stops: Stop[]; legs: Leg[]; activeStopId?: string; started: boolean;
};

const initialState: PlanState = { name: "Demo Trip", stops: [], legs: [], started: false };

const slice = createSlice({
    name: "plan", initialState,
    reducers: {
        setPlan(state, a: PayloadAction<PlanState>) { return a.payload; },
        setActiveStop(s, a: PayloadAction<string | undefined>) { s.activeStopId = a.payload; },
        toggleCheckIn(s, a: PayloadAction<string>) {
            const st = s.stops.find(x => x.id === a.payload); if (!st) return;
            st.checkedInAt = st.checkedInAt ? null : Date.now();
        },
        markCheckedIn(s, a: PayloadAction<string>) { const st = s.stops.find(x => x.id === a.payload); if (st) st.checkedInAt = Date.now(); },
        setStarted(s, a: PayloadAction<boolean>) { s.started = a.payload; }
    }
});
export const { setPlan, setActiveStop, toggleCheckIn, markCheckedIn, setStarted } = slice.actions;
export default slice.reducer;

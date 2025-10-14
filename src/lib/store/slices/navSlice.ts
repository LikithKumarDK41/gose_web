import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '..';

type Status = 'idle' | 'running' | 'paused';

export type NavStats = { distance: number; duration: number } | null;

type NavState = {
    status: Status;
    profile: 'walking' | 'driving' | 'cycling';
    shouldFollow: boolean;               // camera follows user
    customOrigin: [number, number] | null; // [lng, lat] for custom start
    stats: NavStats;
};

const initial: NavState = {
    status: 'idle',
    profile: 'walking',
    shouldFollow: false,
    customOrigin: null,
    stats: null,
};

const navSlice = createSlice({
    name: 'nav',
    initialState: initial,
    reducers: {
        /** 🟢 Start navigation */
        start(state) {
            state.status = 'running';
            state.shouldFollow = true;
            state.stats = null;
        },
        /** ⏸ Pause navigation */
        pause(state) {
            state.status = 'paused';
            state.shouldFollow = false;
        },
        /** ▶️ Resume navigation */
        resume(state) {
            state.status = 'running';
            state.shouldFollow = true;
        },
        /** 🔴 Stop navigation completely */
        stop(state) {
            state.status = 'idle';
            state.shouldFollow = false;
            state.stats = null;
            state.customOrigin = null;
        },
        /** 🚶‍♂️ Set walking/driving/cycling */
        setProfile(state, action: PayloadAction<NavState['profile']>) {
            state.profile = action.payload;
        },
        /** 📍 Set custom start point */
        setCustomOrigin(state, action: PayloadAction<[number, number] | null>) {
            state.customOrigin = action.payload;
        },
        /** 📊 Update live distance/duration stats */
        setStats(state, action: PayloadAction<NavStats>) {
            state.stats = action.payload;
        },
        /** ♻️ Reset everything */
        reset(state) {
            Object.assign(state, initial);
        },
    },
});

export const {
    start,
    pause,
    resume,
    stop,
    setProfile,
    setCustomOrigin,
    setStats,
    reset,
} = navSlice.actions;

export default navSlice.reducer;

/* -------------------- Selectors -------------------- */
export const selectNav = (s: RootState) => s.nav;
export const selectNavStatus = (s: RootState) => s.nav.status;
export const selectNavProfile = (s: RootState) => s.nav.profile;
export const selectNavStats = (s: RootState) => s.nav.stats;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '..';

type Status = 'idle' | 'running' | 'paused';

export type NavStats = { distance: number; duration: number } | null;

type NavState = {
    status: Status;
    profile: 'walking' | 'driving' | 'cycling';
    shouldFollow: boolean;               // persisted across screens
    customOrigin: [number, number] | null; // [lng, lat]
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
        start(state) { state.status = 'running'; state.shouldFollow = true; },
        pause(state) { state.status = 'paused'; state.shouldFollow = false; },
        resume(state) { state.status = 'running'; state.shouldFollow = true; },
        setProfile(state, action: PayloadAction<NavState['profile']>) { state.profile = action.payload; },
        setCustomOrigin(state, action: PayloadAction<[number, number] | null>) { state.customOrigin = action.payload; },
        setStats(state, action: PayloadAction<NavStats>) { state.stats = action.payload; },
        reset(state) { Object.assign(state, initial); },
    },
});

export const { start, pause, resume, setProfile, setCustomOrigin, setStats, reset } = navSlice.actions;
export default navSlice.reducer;

// Selectors
export const selectNav = (s: RootState) => s.nav;

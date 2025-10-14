// src/lib/store/slices/navSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/lib/store';

export type TravelProfile = 'walking' | 'driving' | 'cycling';
export type NavStatus = 'idle' | 'running' | 'paused';

type NavState = {
  status: NavStatus;
  profile: TravelProfile;
  activeTourId?: string | null;
};

const initialState: NavState = {
  status: 'idle',
  profile: 'walking',
  activeTourId: null,
};

const navSlice = createSlice({
  name: 'nav',
  initialState,
  reducers: {
    setActiveTour(state, action: PayloadAction<string | null | undefined>) {
      state.activeTourId = action.payload || null;
    },
    setProfile(state, action: PayloadAction<TravelProfile>) {
      state.profile = action.payload;
    },
    start(state) {
      state.status = 'running';
    },
    pause(state) {
      if (state.status === 'running') state.status = 'paused';
    },
    resume(state) {
      if (state.status === 'paused') state.status = 'running';
    },
    stop(state) {
      state.status = 'idle';
      state.activeTourId = null;
    },
  },
});

export const { setActiveTour, setProfile, start, pause, resume, stop } = navSlice.actions;

export const selectNav = (s: RootState) => s.nav as NavState;

export default navSlice.reducer;

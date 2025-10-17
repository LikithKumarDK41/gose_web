import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../index";

export interface NavState {
  activeTourId: string | null;
  status: "idle" | "running" | "paused" | "stopped";
  profile: "walking" | "driving" | "cycling";
}

const initialState: NavState = {
  activeTourId: null,
  status: "idle",
  profile: "walking",
};

const navSlice = createSlice({
  name: "nav",
  initialState,
  reducers: {
    setActiveTour(state, action: PayloadAction<string | null>) {
      state.activeTourId = action.payload;
    },
    setProfile(state, action: PayloadAction<"walking" | "driving" | "cycling">) {
      state.profile = action.payload;
    },
    startTour(state, action: PayloadAction<string | undefined>) {
      state.status = "running";
      if (action.payload) state.activeTourId = action.payload;
    },
    pauseTour(state) {
      state.status = "paused";
    },
    resumeTour(state) {
      if (state.activeTourId) state.status = "running";
    },
    stopTour(state) {
      state.status = "idle";
      state.activeTourId = null;
    },
  },
});

export const {
  setActiveTour,
  setProfile,
  startTour,
  pauseTour,
  resumeTour,
  stopTour,
} = navSlice.actions;

export const selectNav = (s: RootState) => s.nav;
export default navSlice.reducer;

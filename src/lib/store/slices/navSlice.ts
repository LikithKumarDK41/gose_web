// src/lib/store/slices/navSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../index";
import {
  apiSyncUserTourStatus,
  SyncPayload,
} from "@/services/userNavService";

import type {
  NavStatus,
  NavProfile,
  NavState,
} from "@/lib/types/userNav.types";

const initialState: NavState = {
  activeTourId: null,
  status: "idle",
  profile: "walking",
  syncing: false,
  error: null,
};

export const syncUserTourStatus = createAsyncThunk<
  any,
  SyncPayload,
  { rejectValue: string }
>("nav/syncUserTourStatus", async (payload, { rejectWithValue }) => {
  try {
    const data = await apiSyncUserTourStatus(payload);
    return data;
  } catch (err: any) {
    return rejectWithValue(err.message || "Failed to sync tour status");
  }
});

const navSlice = createSlice({
  name: "nav",
  initialState,
  reducers: {
    setActiveTour(state, action: PayloadAction<string | null>) {
      state.activeTourId = action.payload;
    },
    setProfile(state, action: PayloadAction<NavProfile>) {
      state.profile = action.payload;
    },
    setStatus(state, action: PayloadAction<NavStatus>) {
      state.status = action.payload;
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
    resetAll(state) {
      state.activeTourId = null;
      state.status = "idle";
      state.profile = "walking";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncUserTourStatus.pending, (state) => {
        state.syncing = true;
        state.error = null;
      })
      .addCase(syncUserTourStatus.fulfilled, (state) => {
        state.syncing = false;
      })
      .addCase(syncUserTourStatus.rejected, (state, { payload }) => {
        state.syncing = false;
        state.error = payload || "Sync failed";
      });
  },
});

export const {
  setActiveTour,
  setProfile,
  setStatus,
  startTour,
  pauseTour,
  resumeTour,
  stopTour,
  resetAll,
} = navSlice.actions;

export const selectNav = (s: RootState) => s.nav;
export default navSlice.reducer;

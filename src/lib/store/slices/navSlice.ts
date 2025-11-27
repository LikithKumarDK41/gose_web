import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../index";
import {
  apiSyncUserTourStatus,
  SyncPayload,
  UserTourSyncResponse,
} from "@/services/userNavService";

import type {
  NavStatus,
  NavProfile,
  NavState,
  UserTour,
} from "@/lib/types/userNav.types";

const initialState: NavState = {
  activeTourId: null,
  status: "idle",
  profile: "walking",
  syncing: false,
  error: null,
  usertour: null,
};

export const syncUserTourStatus = createAsyncThunk<
  UserTour | null,
  SyncPayload,
  { rejectValue: string }
>("nav/syncUserTourStatus", async (payload, { rejectWithValue }) => {
  try {
    const data = await apiSyncUserTourStatus(payload);
    // Extract the usertour object from the response
    return (data as any)?.usertour || null;
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
    navStart(state, action: PayloadAction<string | undefined>) {
      state.status = "running";
      if (action.payload) state.activeTourId = action.payload;
    },
    navPause(state) {
      state.status = "paused";
    },
    navResume(state) {
      if (state.activeTourId) state.status = "running";
    },
    navStop(state) {
      state.status = "idle";
      state.activeTourId = null;
      state.usertour = null;
    },
    resetAll(state) {
      state.activeTourId = null;
      state.status = "idle";
      state.profile = "walking";
      state.error = null;
      state.usertour = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncUserTourStatus.pending, (state) => {
        state.syncing = true;
        state.error = null;
      })
      .addCase(syncUserTourStatus.fulfilled, (state, action) => {
        state.syncing = false;
        state.usertour = action.payload; // Store the extracted usertour object
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
  navStart,
  navPause,
  navResume,
  navStop,
  resetAll,
} = navSlice.actions;

export const selectNav = (s: RootState) => s.nav;
export default navSlice.reducer;
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../index";
import {
  apiSyncUserTourStatus,
  apiGetUserTourPoints,
  SyncPayload,
  UserTourSyncResponse,
  UserTourPointResponse,
} from "@/services/userNavService";

import type {
  NavStatus,
  NavProfile,
  NavState,
  UserTour,
} from "@/lib/types/userNav.types";

import type { TourPoint } from "@/lib/types/userTour.types";

const initialState: NavState = {
  activeTourId: null,
  status: "idle",
  profile: "walking",
  syncing: false,
  error: null,
  usertour: null,
  usertourPoints: [],
  usertourPointsFor: null,
};

export const syncUserTourStatus = createAsyncThunk<
  UserTour | null,
  SyncPayload,
  { rejectValue: string }
>("nav/syncUserTourStatus", async (payload, { rejectWithValue }) => {
  try {
    const data = await apiSyncUserTourStatus(payload);
    const usertour = (data as any)?.usertour || null;
    return usertour;
  } catch (err: any) {
    console.error("❌ syncUserTourStatus error:", err);
    return rejectWithValue(err.message || "Failed to sync tour status");
  }
});

/**
 * ⭐ Fetch & cache user tourpoints (POST /v2/usertourpoint)
 * Returns: { tourpoints: TourPoint[]; usertourId: string }
 * Stores in Redux: nav.usertourPoints & nav.usertourPointsFor
 */
export const fetchUserTourPoints = createAsyncThunk<
  { tourpoints: TourPoint[]; usertourId: string },
  { tourId: string; usertourId: string },
  { rejectValue: string }
>("nav/fetchUserTourPoints", async (payload, { rejectWithValue }) => {
  try {
    const response: UserTourPointResponse = await apiGetUserTourPoints(
      payload.tourId,
      payload.usertourId
    );

    const tourpoints = response?.tourpoints || [];

    return {
      tourpoints: Array.isArray(tourpoints) ? tourpoints : [],
      usertourId: payload.usertourId,
    };
  } catch (err: any) {
    console.error("❌ fetchUserTourPoints error:", err);
    return rejectWithValue(err?.message || "Failed to fetch user tourpoints");
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
      state.usertourPoints = [];
      state.usertourPointsFor = null;
    },
    /* ⭐ Alias for navStop - used in ConfirmPopupButton */
    stopTour(state) {
      state.status = "idle";
      state.activeTourId = null;
      state.usertour = null;
      state.usertourPoints = [];
      state.usertourPointsFor = null;
    },
    resetAll(state) {
      state.activeTourId = null;
      state.status = "idle";
      state.profile = "walking";
      state.syncing = false;
      state.error = null;
      state.usertour = null;
      state.usertourPoints = [];
      state.usertourPointsFor = null;
    },
    clearUserTourPoints(state) {
      state.usertourPoints = [];
      state.usertourPointsFor = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // syncUserTourStatus lifecycle
      .addCase(syncUserTourStatus.pending, (state) => {
        state.syncing = true;
        state.error = null;
      })
      .addCase(syncUserTourStatus.fulfilled, (state, action) => {
        state.syncing = false;
        state.usertour = action.payload;
      })
      .addCase(syncUserTourStatus.rejected, (state, { payload }) => {
        state.syncing = false;
        state.error = payload || "Sync failed";
        console.error("❌ syncUserTourStatus rejected:", payload);
      })

      // fetchUserTourPoints lifecycle
      .addCase(fetchUserTourPoints.pending, (state) => {
        state.syncing = true;
        state.error = null;
      })
      .addCase(fetchUserTourPoints.fulfilled, (state, { payload }) => {
        state.syncing = false;
        state.usertourPoints = payload.tourpoints;
        state.usertourPointsFor = payload.usertourId;
      })
      .addCase(fetchUserTourPoints.rejected, (state, { payload }) => {
        state.syncing = false;
        state.error = payload || "Failed to fetch user tourpoints";
        console.error("❌ fetchUserTourPoints rejected:", payload);
        state.usertourPoints = [];
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
  stopTour,
  resetAll,
  clearUserTourPoints,
} = navSlice.actions;

export const selectNav = (s: RootState) => s.nav;
export const selectUserTourPoints = (s: RootState) => s.nav.usertourPoints;
export const selectUserTourPointsFor = (s: RootState) => s.nav.usertourPointsFor;

export default navSlice.reducer;
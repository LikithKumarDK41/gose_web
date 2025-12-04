// src/lib/store/slices/globalSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../index";

import { apiFetchShortcuts } from "@/services/userGlobalservice";
import type { Shortcut } from "@/lib/types/userGlobal.types";
import type { GlobalState } from "@/lib/types/userGlobal.types";

const initialState: GlobalState = {
  shortcuts: [],
  loading: false,
  error: null,
  activeThemeId: null,

  userLocation: null,
  locationFetched: false,
  locationDenied: false,
};

export const fetchShortcuts = createAsyncThunk<
  Shortcut[],
  void,
  { rejectValue: string }
>("global/fetchShortcuts", async (_, { rejectWithValue }) => {
  try {
    const list = await apiFetchShortcuts();
    return list;
  } catch (err: any) {
    return rejectWithValue(err.message || "Failed to load shortcuts");
  }
});

const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setActiveTheme(state, action: PayloadAction<string | null>) {
      state.activeThemeId = action.payload;
    },

    clearActiveTheme(state) {
      state.activeThemeId = null;
    },

    // Save user location first time
    setUserLocation(state, action: PayloadAction<{ lat: number; lng: number }>) {
      state.userLocation = action.payload;
      state.locationFetched = true;
    },

    // Live updates after permission is granted
    updateUserLocation(state, action: PayloadAction<{ lat: number; lng: number }>) {
      state.userLocation = action.payload;
    },

    markLocationFetched(state) {
      state.locationFetched = true;
    },

    setLocationDenied(state) {
      state.locationDenied = true;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchShortcuts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShortcuts.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.shortcuts = payload;
      })
      .addCase(fetchShortcuts.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = (payload as string) || "Failed to load shortcuts";
      });
  },
});

export const {
  setActiveTheme,
  clearActiveTheme,
  setUserLocation,
  updateUserLocation,
  markLocationFetched,
  setLocationDenied,
} = globalSlice.actions;

export const selectShortcuts = (state: RootState) => state.global.shortcuts;
export const selectGlobalLoading = (state: RootState) => state.global.loading;
export const selectGlobalError = (state: RootState) => state.global.error;
export const selectActiveThemeId = (state: RootState) =>
  state.global.activeThemeId;

export const selectUserLocation = (state: RootState) =>
  state.global.userLocation;

export const selectLocationFetched = (state: RootState) =>
  state.global.locationFetched;

export const selectLocationDenied = (state: RootState) =>
  state.global.locationDenied;

export default globalSlice.reducer;

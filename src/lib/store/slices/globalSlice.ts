// src/lib/store/slices/globalSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../index";
import {
  apiFetchShortcuts,
  type Shortcut, // re-use service types
} from "@/services/userGlobalservice";

/* ------------------------------------------------------------
   🧱 State Definition
------------------------------------------------------------ */
interface GlobalState {
  shortcuts: Shortcut[];
  loading: boolean;
  error: string | null;
  activeThemeId: string | null; // ✅ added field
}

/* ------------------------------------------------------------
   🌱 Initial State
------------------------------------------------------------ */
const initialState: GlobalState = {
  shortcuts: [],
  loading: false,
  error: null,
  activeThemeId: null,
};

/* ------------------------------------------------------------
   ⚡ Async Thunk (Fetch Shortcuts)
------------------------------------------------------------ */
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

/* ------------------------------------------------------------
   🧩 Slice
------------------------------------------------------------ */
const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    // ✅ store theme ID globally when shortcut clicked
    setActiveTheme(state, action: PayloadAction<string | null>) {
      state.activeThemeId = action.payload;
    },
    clearActiveTheme(state) {
      state.activeThemeId = null;
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

/* ------------------------------------------------------------
   📤 Actions
------------------------------------------------------------ */
export const { setActiveTheme, clearActiveTheme } = globalSlice.actions;

/* ------------------------------------------------------------
   🔍 Selectors
------------------------------------------------------------ */
export const selectShortcuts = (state: RootState) => state.global.shortcuts;
export const selectGlobalLoading = (state: RootState) => state.global.loading;
export const selectGlobalError = (state: RootState) => state.global.error;
export const selectActiveThemeId = (state: RootState) =>
  state.global.activeThemeId;

/* ------------------------------------------------------------
   🚀 Export Reducer
------------------------------------------------------------ */
export default globalSlice.reducer;

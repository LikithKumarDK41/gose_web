// src/lib/store/slices/globalSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../index";
import {
  apiFetchShortcuts,
  type Shortcut, // re-use service types
} from "@/services/userGlobalservice";

/* === State === */
interface GlobalState {
  shortcuts: Shortcut[];
  loading: boolean;
  error: string | null;
}

const initialState: GlobalState = {
  shortcuts: [],
  loading: false,
  error: null,
};

/* === Thunks (delegating to service) === */
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

/* === Slice === */
const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchShortcuts.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    builder.addCase(fetchShortcuts.fulfilled, (s, { payload }) => {
      s.loading = false;
      s.shortcuts = payload;
    });
    builder.addCase(fetchShortcuts.rejected, (s, { payload }) => {
      s.loading = false;
      s.error = (payload as string) || "Failed to load shortcuts";
    });
  },
});

/* === Selectors === */
export const selectShortcuts = (state: RootState) => state.global.shortcuts;
export const selectGlobalLoading = (state: RootState) => state.global.loading;
export const selectGlobalError = (state: RootState) => state.global.error;

export default globalSlice.reducer;

// src/lib/store/slices/globalSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/lib/api";
import { RootState } from "../index";

/* === Types === */
export interface Shortcut {
  _id: string;
  title: string;
  icon?: {
    secure_url?: string;
    url?: string;
  };
  link?: string;
  pdffile?: {
    url?: string;
    mimetype?: string;
    filename?: string;
    size?: number;
  };
  screentype?: string;
  content?: {
    brief?: string;
    extended?: string;
  };
  priority?: number;
  primarymenu?: boolean;
  authrequired?: boolean;
}

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

/* === Thunks === */
export const fetchShortcuts = createAsyncThunk<
  Shortcut[],
  void,
  { rejectValue: string }
>("global/fetchShortcuts", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get<{ shortcuts: { results: Shortcut[] } }>(
      "/v1/shortcuts"
    );
    return data.shortcuts.results;
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || "Failed to load shortcuts");
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
      s.error = payload || "Failed to load shortcuts";
    });
  },
});

/* === Selectors === */
export const selectShortcuts = (state: RootState) => state.global.shortcuts;
export const selectGlobalLoading = (state: RootState) => state.global.loading;
export const selectGlobalError = (state: RootState) => state.global.error;

export default globalSlice.reducer;

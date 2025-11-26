// src/lib/store/slices/touristSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../index";

import {
  apiFetchTourById,
  apiFetchTourPoints,
  apiFetchMonumentDetails,
  // types
  type TourPoint,
  type Monument,
  type Tour,
} from "@/services/userTourService";

/* -------------------- Redux State -------------------- */
interface TouristState {
  detail: Tour | null;
  monumentDetail: Monument | null;
  loading: boolean;
  error: string | null;
}

const initialState: TouristState = {
  detail: null,
  monumentDetail: null,
  loading: false,
  error: null,
};

/* -------------------- Async Thunks (Single-Tour Only) -------------------- */

// Fetch only one tour
export const fetchTourById = createAsyncThunk<
  Tour,
  string,
  { rejectValue: string }
>("tourist/fetchTourById", async (id, { rejectWithValue }) => {
  try {
    return await apiFetchTourById(id);
  } catch (err: any) {
    return rejectWithValue(err.message ?? "Failed to load tour");
  }
});

// Fetch tour points only for the current tour
export const fetchTourPoints = createAsyncThunk<
  TourPoint[],
  string,
  { rejectValue: string }
>("tourist/fetchTourPoints", async (tourId, { rejectWithValue }) => {
  try {
    return await apiFetchTourPoints(tourId);
  } catch (err: any) {
    return rejectWithValue(err.message ?? "Failed to load tourpoints");
  }
});

// Fetch monument details
export const fetchMonumentDetails = createAsyncThunk<
  Monument,
  string,
  { rejectValue: string }
>("tourist/fetchMonumentDetails", async (monument, { rejectWithValue }) => {
  try {
    return await apiFetchMonumentDetails(monument);
  } catch (err: any) {
    return rejectWithValue(err.message ?? "Failed to load monument details");
  }
});

/* -------------------- Slice -------------------- */

const touristSlice = createSlice({
  name: "tourist",
  initialState,
  reducers: {
    clearTourDetail(state) {
      state.detail = null;
    },
    clearMonumentDetail(state) {
      state.monumentDetail = null;
    },
  },

  extraReducers: (builder) => {
    builder
      /* Fetch ONE tour */
      .addCase(fetchTourById.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchTourById.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.detail = payload;
      })
      .addCase(fetchTourById.rejected, (s, { payload }) => {
        s.loading = false;
        s.error = payload || "Failed to load tour";
      })

      /* Tour Points → attach only to current detail */
      .addCase(fetchTourPoints.fulfilled, (s, { payload }) => {
        if (s.detail) s.detail.tourpoints = payload;
      })
      .addCase(fetchTourPoints.rejected, (s, { payload }) => {
        s.error = payload ?? s.error;
      })

      /* Monument Details */
      .addCase(fetchMonumentDetails.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchMonumentDetails.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.monumentDetail = payload;
      })
      .addCase(fetchMonumentDetails.rejected, (s, { payload }) => {
        s.loading = false;
        s.error = payload || "Failed to load monument details";
      });
  },
});

export const { clearTourDetail, clearMonumentDetail } = touristSlice.actions;

/* -------------------- Selectors -------------------- */
export const selectTourDetail = (s: RootState) => s.tourist.detail;
export const selectTouristLoading = (s: RootState) => s.tourist.loading;
export const selectTouristError = (s: RootState) => s.tourist.error;
export const selectMonumentDetail = (s: RootState) => s.tourist.monumentDetail;

export default touristSlice.reducer;

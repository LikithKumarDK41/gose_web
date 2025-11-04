// src/lib/store/slices/touristSlice.ts
import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../index";
import {
  apiFetchTours,
  apiFetchTourById,
  apiFetchTourPoints,
  apiFetchMonumentDetails,
  // types
  type TravelMode,
  type CloudinaryImage,
  type CloudinaryIcon,
  type RelatedTour,
  type Region,
  type Theme,
  type Monument,
  type TravelType,
  type TourPoint,
  type Tour,
} from "@/services/userTourService";

/* -------------------- Redux State -------------------- */
interface TouristState {
  list: Tour[];
  detail: Tour | null;
  monumentDetail: Monument | null;
  loading: boolean;
  error: string | null;
}

const initialState: TouristState = {
  list: [],
  detail: null,
  monumentDetail: null,
  loading: false,
  error: null,
};

/* -------------------- Async Thunks (delegating to service) -------------------- */
export const fetchTours = createAsyncThunk<Tour[], void, { rejectValue: string }>(
  "tourist/fetchTours",
  async (_, { rejectWithValue }) => {
    try {
      return await apiFetchTours();
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to load tours");
    }
  }
);

export const fetchTourById = createAsyncThunk<Tour, string, { rejectValue: string }>(
  "tourist/fetchTourById",
  async (id, { rejectWithValue }) => {
    try {
      return await apiFetchTourById(id);
    } catch (err: any) {
      return rejectWithValue(err.message ?? "Failed to load tour");
    }
  }
);

export const fetchTourPoints = createAsyncThunk<
  { tourId: string; points: TourPoint[] },
  string,
  { rejectValue: string }
>("tourist/fetchTourPoints", async (tourId, { rejectWithValue }) => {
  try {
    const points = await apiFetchTourPoints(tourId);
    return { tourId, points };
  } catch (err: any) {
    return rejectWithValue(err.message ?? "Failed to load tourpoints");
  }
});

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
      .addCase(fetchTours.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchTours.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.list = payload;
      })
      .addCase(fetchTours.rejected, (s, { payload }) => {
        s.loading = false;
        s.error = (payload as string) || "Failed to load tours";
      })

      .addCase(fetchTourById.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchTourById.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.detail = payload;
        const i = s.list.findIndex((t) => t._id === payload._id);
        if (i === -1) s.list.push(payload);
        else s.list[i] = payload;
      })
      .addCase(fetchTourById.rejected, (s, { payload }) => {
        s.loading = false;
        s.error = (payload as string) || "Failed to load tour";
      })

      .addCase(fetchTourPoints.fulfilled, (s, { payload }) => {
        const { tourId, points } = payload;
        if (s.detail && s.detail._id === tourId) s.detail.tourpoints = points;
        const i = s.list.findIndex((t) => t._id === tourId);
        if (i !== -1) s.list[i].tourpoints = points;
      })
      .addCase(fetchTourPoints.rejected, (s, { payload }) => {
        s.error = (payload as string) ?? s.error;
      })

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
        s.error = (payload as string) || "Failed to load monument details";
      });
  },
});

export const { clearTourDetail, clearMonumentDetail } = touristSlice.actions;

/* -------------------- Selectors -------------------- */
export const selectTours = (s: RootState) => s.tourist.list;
export const selectTourDetail = (s: RootState) => s.tourist.detail;
export const selectMonumentDetail = (s: RootState) => s.tourist.monumentDetail;
export const selectTouristLoading = (s: RootState) => s.tourist.loading;
export const selectTouristError = (s: RootState) => s.tourist.error;

export const selectTourById =
  (id: string) => (s: RootState) =>
    s.tourist.list.find((t) => t._id === id) ||
    (s.tourist.detail?._id === id ? s.tourist.detail : undefined);

export const makeSelectTourPreferringDetail = () =>
  createSelector(
    [
      (s: RootState) => s.tourist.detail,
      (s: RootState) => s.tourist.list,
      (_: RootState, id: string) => id,
    ],
    (detail, list, id) =>
      detail?._id === id ? detail : list.find((t) => t._id === id) ?? null
  );

export default touristSlice.reducer;

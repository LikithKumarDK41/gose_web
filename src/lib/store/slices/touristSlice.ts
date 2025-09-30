// src/lib/store/slices/touristSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/lib/api";
import { RootState } from "../index";
import { createSelector } from "@reduxjs/toolkit";

/* === Types === */
export interface Tour {
  _id: string;
  title: string;
  description?: string;
  duration?: string;
  traveltime?: string;
  link?: string;
  tour: object;
  content?: {
    brief?: string;
    extended?: string;
  };
  monuments?: string[];
  image?: {
    secure_url?: string;
    url?: string;
  };
  routeImage?: {
    secure_url?: string;
    url?: string;
  };
  places?: { id: string }[];
  featured?: boolean;
}

interface TouristState {
  list: Tour[];
  detail: Tour | null;
  loading: boolean;
  error: string | null;
}

const initialState: TouristState = {
  list: [],
  detail: null,
  loading: false,
  error: null,
};

/* === Thunks === */
export const fetchTours = createAsyncThunk<
  Tour[],
  void,
  { rejectValue: string }
>("tourist/fetchTours", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.post<{ tours: { results: Tour[] } }>(
      "/v2/tours"
    );
    return data.tours.results;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || "Failed to load tours"
    );
  }
});

export const fetchTourById = createAsyncThunk<
  Tour, // success payload
  string, // arg (id)
  { rejectValue: string } // rejected payload
>("tourist/fetchTourById", async (id, { rejectWithValue, signal }) => {
  try {
    // Make sure this is typed so `data.tour` is `Tour`
    const { data } = await api.get<{ tour: Tour }>(`/v1/tours/${id}`, {
      signal,
    });
    return data.tour; // <- returns Tour
  } catch (err: any) {
    // Type rejectWithValue so the union is known
    return rejectWithValue(
      err?.response?.data?.message ?? "Failed to load tour"
    );
  }
});

/* === Slice === */
const touristSlice = createSlice({
  name: "tourist",
  initialState,
  reducers: {
    clearTourDetail(state) {
      state.detail = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchTours.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    builder.addCase(fetchTours.fulfilled, (s, { payload }) => {
      s.loading = false;
      s.list = payload;
    });
    builder.addCase(fetchTours.rejected, (s, { payload }) => {
      s.loading = false;
      s.error = payload || "Failed to load tours";
    });

    builder.addCase(fetchTourById.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    builder.addCase(fetchTourById.fulfilled, (s, { payload }) => {
      s.loading = false;
      s.detail = payload;
      const i = s.list.findIndex((t) => t._id === payload._id);
      if (i === -1) s.list.push(payload);
      else s.list[i] = payload;
    });
    builder.addCase(fetchTourById.rejected, (s, { payload }) => {
      s.loading = false;
      s.error = payload || "Failed to load tour";
    });
  },
});

export const { clearTourDetail } = touristSlice.actions;

/* === Selectors === */
export const selectTours = (state: RootState) => state.tourist.list;
export const selectTourDetail = (state: RootState) => state.tourist.detail;
export const selectTouristLoading = (state: RootState) => state.tourist.loading;
export const selectTouristError = (state: RootState) => state.tourist.error;
export const selectTourById = (id: string) => (state: RootState) =>
  state.tourist.list.find((t) => t._id === id) ||
  (state.tourist.detail?._id === id ? state.tourist.detail : undefined);
// If you also keep a `detail`, you can prefer it:
export const makeSelectTourPreferringDetail = () =>
  createSelector(
    [
      (state: RootState) => state.tourist.detail,
      (state: RootState) => state.tourist.list,
      (_: RootState, id: string) => id,
    ],
    (detail, list, id) =>
      detail?._id === id ? detail : list.find((t) => t._id === id) ?? null
  );

export default touristSlice.reducer;

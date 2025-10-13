// src/lib/store/slices/touristSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/lib/api";
import { RootState } from "../index";
import { createSelector } from "@reduxjs/toolkit";
import { Monument } from "@/components/tour/TimelineRight";

/* === Types === */
export interface TourPoint {
  _id: string;
  name?: string;
  waypointtype?: "start" | "place" | "end";
  traveltype?: { name?: string };
 monument?: Partial<Monument>;
}

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
  tourpoints?: TourPoint[];
}

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
  Tour,
  string,
  { rejectValue: string }
>("tourist/fetchTourById", async (id, { rejectWithValue, signal }) => {
  try {
    const locale =
      typeof window !== "undefined"
        ? localStorage.getItem("site_locale") || "ja"
        : "ja";

    const { data } = await api.get<{ tour: Tour }>(
      `/v1/tours/${id}?lang=${locale}`, // add locale to URL
      {
        signal,
        headers: {
          "Accept-Language": locale, // server will localize
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      }
    );

    return data.tour;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message ?? "Failed to load tour"
    );
  }
});

export const fetchTourPoints = createAsyncThunk<
  { tourId: string; points: TourPoint[] },
  string,
  { rejectValue: string }
>("tourist/fetchTourPoints", async (tourId, { rejectWithValue }) => {
  try {
    const { data } = await api.get<{ tourpoints: { results: TourPoint[] } }>(
      `/v1/tourpoints?filter=${encodeURIComponent(JSON.stringify({ tour: tourId }))}`
    );

    // Sort and normalize
    const results = data.tourpoints?.results ?? [];
    const order: Record<"start" | "place" | "end", number> = {
      start: 1,
      place: 2,
      end: 3,
    };

    const sorted = results.sort((a, b) => {
      const getOrder = (type?: "start" | "place" | "end"): number =>
        type ? order[type] : 99; // fallback for undefined
      return getOrder(a.waypointtype) - getOrder(b.waypointtype);
    });

    return { tourId, points: sorted };
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message ?? "Failed to load tourpoints");
  }
});

export const fetchMonumentDetails = createAsyncThunk<
  Monument,
  string, // payload is the monumentId
  { rejectValue: string }
>(
  "tourist/fetchMonumentDetails",
  async (monument, { rejectWithValue }) => {
    try {
      const { data } = await api.post<{ monument: Monument }>(
        "/v2/monument",  // Adjust endpoint to accept POST requests
        { monument }    // Send the monumentId as the payload
      );
      return data.monument; // Return the monument data
    } catch (err: any) {
      // Return the error message in case of failure
      return rejectWithValue(
        err?.response?.data?.message ?? "Failed to load monument details"
      );
    }
  }
);

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
    builder.addCase(fetchTourPoints.pending, (s) => {
      s.loading = true;
      s.error = null;
    });

    builder.addCase(fetchTourPoints.fulfilled, (s, { payload }) => {
      s.loading = false;
      const { tourId, points } = payload;

      // Update detail if it's the same tour
      if (s.detail && s.detail._id === tourId) {
        s.detail.tourpoints = points;
      }

      // Also update the cached list version
      const i = s.list.findIndex((t) => t._id === tourId);
      if (i !== -1) s.list[i].tourpoints = points;
    });

    builder.addCase(fetchTourPoints.rejected, (s, { payload }) => {
      s.loading = false;
      s.error = payload || "Failed to load tourpoints";
    });

    // Monument Details
    builder.addCase(fetchMonumentDetails.pending, (s) => {
      s.loading = true;
      s.error = null;
    });

    builder.addCase(fetchMonumentDetails.rejected, (s, { payload }) => {
      s.loading = false;
      s.error = payload || "Failed to load monument details";
    });
    builder.addCase(fetchMonumentDetails.fulfilled, (s, { payload }) => {
      s.loading = false;
      s.monumentDetail = payload;
    });
  },
});

export const { clearTourDetail } = touristSlice.actions;

/* === Selectors === */
export const selectTours = (state: RootState) => state.tourist.list;
export const selectTourDetail = (state: RootState) => state.tourist.detail;
export const selectTouristLoading = (state: RootState) => state.tourist.loading;
export const selectMonumentDetail = (state: RootState) => state.tourist.monumentDetail;
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

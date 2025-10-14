import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import api from "@/lib/api";
import { RootState } from "../index";

/* -------------------- Shared Types -------------------- */
export type TravelMode = "car" | "walk" | "train";

/** Cloudinary Image Type */
export interface CloudinaryImage {
  public_id?: string;
  version?: number;
  signature?: string;
  format?: string;
  resource_type?: string;
  url?: string;
  secure_url?: string;
  width?: number;
  height?: number;
  [key: string]: any;
}
export interface CloudinaryIcon extends CloudinaryImage { }


/* ------------------------------------------------------------------ */
/** Related Tour Type (inside monument.relatedtours[]) */
export interface RelatedTour {
  _id?: string;
  title?: string;
  duration?: string;
  traveltime?: string;
  link?: string;
  content?: {
    brief?: string;
    extended?: string;
  };
  image?: CloudinaryImage;
  featured?: boolean;
}

/* ------------------------------------------------------------------ */
/** Region Type (inside monument.region) */
export interface Region {
  _id?: string;
  slug?: string;
  name?: string;
  title?: string;
  location?: [number, number];
  featuredmonument?: string[];
  content?: {
    brief?: string;
    extended?: string;
  };
  state?: string;
  __v?: number;
}

/* ------------------------------------------------------------------ */
/** Subtheme / Theme Type */
export interface Theme {
  _id?: string;
  title?: string;
  image?: CloudinaryImage;
  theme?: string[];
}

/* ------------------------------------------------------------------ */
/** Monument Interface (main type) */
export interface Monument {
  _id: string;
  slug?: string;
  sortOrder?: number;

  name: string;
  title?: string;
  description?: string;

  /** Images */
  image?: CloudinaryImage;
  gallery?: CloudinaryImage[];

  /** Geo & Region */
  location?: { lat?: number; lng?: number } | [number, number];
  region?: Region;

  /** Classification */
  subtheme?: Theme[];
  theme?: Theme[];
  artemplates?: any[];

  /** Settings / Flags */
  arenabled?: boolean;
  avenabled?: boolean;
  featured?: boolean;
  rare?: boolean;
  tourpoint?: boolean;

  /** Meta Info */
  era?: string;
  year?: string;
  size?: string;
  mtype?: string;
  access?: string;
  georadius?: number;
  state?: string;

  /** Content */
  content?: {
    brief?: string;
    extended?: string;
  };

  /** Relations */
  nearbyservices?: any[];
  nearbymonuments?: any[];
  relatedtours?: RelatedTour[];

  /** Other Metadata */
  imagecredit?: string | { en?: string; ja?: string };
  popularity?: number;
  __v?: number;
}

export interface TravelType {
  _id: string;
  title?: string;
  name?: TravelMode;
  icon?: CloudinaryIcon;
  state?: string;
}

export interface TourPoint {
  _id: string;
  name?: string;
  waypointtype?: "start" | "place" | "end";
  traveltype?: TravelType;
  monument?: Monument;
  traveltime?: string;
  starttime?: string;
  state?: string;
  pointtype?: "monument" | "station" | "lunch";
}

export interface Tour {
  _id: string;
  title: string;
  description?: string;
  duration?: string;
  traveltime?: string;
  link?: string;
  tour?: Record<string, any>;
  content?: { brief?: string; extended?: string };
  monuments?: string[];
  image?: CloudinaryImage;
  routeImage?: CloudinaryImage;
  routeJson?: string;
  featured?: boolean;
  special?: boolean;
  specialContent?: string;
  tourpoints?: TourPoint[];
}

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

/* -------------------- Async Thunks -------------------- */

export const fetchTours = createAsyncThunk<Tour[], void, { rejectValue: string }>(
  "tourist/fetchTours",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post<{ tours: { results: Tour[] } }>("/v2/tours");
      return data.tours.results;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Failed to load tours");
    }
  }
);

export const fetchTourById = createAsyncThunk<Tour, string, { rejectValue: string }>(
  "tourist/fetchTourById",
  async (id, { rejectWithValue, signal }) => {
    try {
      const locale =
        typeof window !== "undefined"
          ? localStorage.getItem("site_locale") || "ja"
          : "ja";

      const { data } = await api.get<{ tour: Tour }>(
        `/v1/tours/${id}?lang=${locale}`,
        {
          signal,
          headers: {
            "Accept-Language": locale,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );

      return data.tour;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? "Failed to load tour");
    }
  }
);

export const fetchTourPoints = createAsyncThunk<
  { tourId: string; points: TourPoint[] },
  string,
  { rejectValue: string }
>("tourist/fetchTourPoints", async (tourId, { rejectWithValue }) => {
  try {
    const { data } = await api.get<{ tourpoints: { results: TourPoint[] } }>(
      `/v1/tourpoints?filter=${encodeURIComponent(JSON.stringify({ tour: tourId }))}`
    );

    const results = data.tourpoints?.results ?? [];
    const order: Record<"start" | "place" | "end", number> = { start: 1, place: 2, end: 3 };

    const sorted = results.sort((a, b) => {
      const getOrder = (t?: "start" | "place" | "end") => (t ? order[t] : 99);
      return getOrder(a.waypointtype) - getOrder(b.waypointtype);
    });

    return { tourId, points: sorted };
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message ?? "Failed to load tourpoints");
  }
});

export const fetchMonumentDetails = createAsyncThunk<
  Monument,
  string,
  { rejectValue: string }
>("tourist/fetchMonumentDetails", async (monument, { rejectWithValue }) => {
  try {
    const { data } = await api.post<{ monument: Monument }>("/v2/monument", { monument });
    return data.monument;
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message ?? "Failed to load monument details");
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
      })
      .addCase(fetchTours.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.list = payload;
      })
      .addCase(fetchTours.rejected, (s, { payload }) => {
        s.loading = false;
        s.error = payload || "Failed to load tours";
      })

      .addCase(fetchTourById.pending, (s) => {
        s.loading = true;
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
        s.error = payload || "Failed to load tour";
      })

      .addCase(fetchTourPoints.fulfilled, (s, { payload }) => {
        s.loading = false;
        const { tourId, points } = payload;
        if (s.detail && s.detail._id === tourId) s.detail.tourpoints = points;
        const i = s.list.findIndex((t) => t._id === tourId);
        if (i !== -1) s.list[i].tourpoints = points;
      })

      .addCase(fetchMonumentDetails.pending, (s) => {
        s.loading = true;
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

// src/lib/store/slices/touristSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/lib/api";
import { RootState } from "../index";

/* === Types === */
export interface Tour {
    _id: string;
    title: string;
    description?: string;
    duration?: string;
    traveltime?: string;
    link?: string;
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
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await api.get<Tour>(`/v1/tours/${id}`);
            return data;
        } catch (err: any) {
            return rejectWithValue(err?.response?.data?.message || "Failed to load tour");
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

export default touristSlice.reducer;

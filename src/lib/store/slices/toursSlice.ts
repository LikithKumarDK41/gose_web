import { createSlice, PayloadAction, nanoid } from '@reduxjs/toolkit';
import type { RootState } from '..';
import type { Tour, Place } from '@/lib/data/tourTypes';
import { seedTours } from '@/lib/data/tours.seed';

type ToursState = {
    byId: Record<string, Tour>;
    allIds: string[];
    activeId: string | null;
};

const mapById = (arr: Tour[]) =>
    Object.fromEntries(arr.map((t) => [t.id, t]));

const initial: ToursState = {
    byId: mapById(seedTours),
    allIds: seedTours.map((t) => t.id),
    activeId: seedTours[0]?.id ?? null,
};

const toursSlice = createSlice({
    name: 'tours',
    initialState: initial,
    reducers: {
        setActiveTour(state, action: PayloadAction<string | null>) {
            state.activeId = action.payload;
        },
        upsertTours(state, action: PayloadAction<Tour[]>) {
            for (const t of action.payload) {
                if (!state.allIds.includes(t.id)) state.allIds.push(t.id);
                state.byId[t.id] = t;
            }
        },
        addTour: {
            reducer(state, action: PayloadAction<Tour>) {
                state.byId[action.payload.id] = action.payload;
                state.allIds.push(action.payload.id);
            },
            prepare(t: Omit<Tour, 'id' | 'createdAt'>) {
                return { payload: { ...t, id: nanoid(), createdAt: new Date().toISOString() } as Tour };
            },
        },
        updateTour(state, action: PayloadAction<Tour>) {
            state.byId[action.payload.id] = action.payload;
        },
        removeTour(state, action: PayloadAction<string>) {
            delete state.byId[action.payload];
            state.allIds = state.allIds.filter((id) => id !== action.payload);
            if (state.activeId === action.payload) state.activeId = state.allIds[0] ?? null;
        },

        addPlace(state, action: PayloadAction<{ tourId: string; place: Place }>) {
            const t = state.byId[action.payload.tourId];
            if (t) t.places.push(action.payload.place);
        },
        updatePlace(state, action: PayloadAction<{ tourId: string; place: Place }>) {
            const t = state.byId[action.payload.tourId];
            if (!t) return;
            const i = t.places.findIndex((p) => p.id === action.payload.place.id);
            if (i >= 0) t.places[i] = action.payload.place;
        },
        removePlace(state, action: PayloadAction<{ tourId: string; placeId: string }>) {
            const t = state.byId[action.payload.tourId];
            if (t) t.places = t.places.filter((p) => p.id !== action.payload.placeId);
        },
        reorderPlaces(state, action: PayloadAction<{ tourId: string; from: number; to: number }>) {
            const t = state.byId[action.payload.tourId];
            if (!t) return;
            const arr = [...t.places];
            const [moved] = arr.splice(action.payload.from, 1);
            arr.splice(action.payload.to, 0, moved);
            t.places = arr;
        },
    },
});

export const {
    setActiveTour,
    upsertTours,
    addTour,
    updateTour,
    removeTour,
    addPlace,
    updatePlace,
    removePlace,
    reorderPlaces,
} = toursSlice.actions;

export default toursSlice.reducer;

// Selectors
export const selectTours = (s: RootState & { tours: ToursState }) => s.tours.allIds.map((id) => s.tours.byId[id]);
export const selectTourById = (id: string) => (s: RootState & { tours: ToursState }) => s.tours.byId[id] ?? null;
export const selectActiveTour = (s: RootState & { tours: ToursState }) =>
    s.tours.activeId ? s.tours.byId[s.tours.activeId] : null;

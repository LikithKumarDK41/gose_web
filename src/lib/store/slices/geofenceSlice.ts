// src/lib/store/slices/geofenceSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState, AppDispatch } from '..';

export type Checkin = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    radius: number;
    distance: number;
    tourId: string;
    blurb?: string;
    time?: string;
};

type GeofenceState = {
    /** placeId -> already checked once */
    checked: Record<string, boolean>;
    /** pending check-in popups */
    queue: Checkin[];
};

const initialState: GeofenceState = {
    checked: {},
    queue: [],
};

const geofenceSlice = createSlice({
    name: 'geofence',
    initialState,
    reducers: {
        markChecked(state, action: PayloadAction<string>) {
            state.checked[action.payload] = true;
        },
        enqueue(state, action: PayloadAction<Checkin>) {
            const exists = state.queue.some((q) => q.id === action.payload.id);
            if (!exists && !state.checked[action.payload.id]) {
                state.queue.push(action.payload);
            }
        },
        dismiss(state, action: PayloadAction<string>) {
            state.queue = state.queue.filter((q) => q.id !== action.payload);
        },
        confirm(state, action: PayloadAction<string>) {
            state.queue = state.queue.filter((q) => q.id !== action.payload);
            state.checked[action.payload] = true;
        },
        resetAll(state) {
            state.checked = {};
            state.queue = [];
        },
    },
});

export const { markChecked, enqueue, dismiss, confirm, resetAll } =
    geofenceSlice.actions;
export default geofenceSlice.reducer;

// ---------- Selectors ----------
export const selectGeofenceQueue = (s: RootState) => s.geofence.queue;
export const selectGeofenceChecked = (s: RootState) => s.geofence.checked;

// ---------- Helper Thunk ----------
export const enqueueGeofenceIfNew =
    (checkin: Checkin) => (dispatch: AppDispatch, getState: () => RootState) => {
        const checked = selectGeofenceChecked(getState());
        const queue = selectGeofenceQueue(getState());
        if (!checked[checkin.id] && !queue.some((q) => q.id === checkin.id)) {
            dispatch(enqueue(checkin));
        }
    };

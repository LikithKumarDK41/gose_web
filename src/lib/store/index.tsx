// src/lib/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import toursReducer from './slices/toursSlice';
import navReducer from './slices/navSlice';
import geofenceReducer from './slices/geofenceSlice'; // ⬅️ add
import authReducer from "./slices/authSlice";
import touristReducer from "./slices/touristSlice";

export const store = configureStore({
  reducer: {
    tours: toursReducer,
    nav: navReducer,
    geofence: geofenceReducer,
    auth: authReducer,
    tourist: touristReducer,
  },
});

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

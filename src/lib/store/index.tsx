// src/lib/store/index.ts
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage"; // defaults to localStorage
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

import navReducer from "./slices/navSlice";
import geofenceReducer from "./slices/geofenceSlice";
import authReducer from "./slices/authSlice";
import touristReducer from "./slices/touristSlice";
import globalReducer from "./slices/globalSlice";

const appReducer = combineReducers({
  nav: navReducer,
  geofence: geofenceReducer,
  auth: authReducer,
  tourist: touristReducer,
  global: globalReducer,
});

const rootReducer = (state: any, action: any) => {
  if (action.type === "auth/logout/fulfilled") {
    // ⭐ RESET EVERYTHING – MAKE REDUX FRESH
    state = undefined;

    // ⭐ ALSO CLEAR REDUX-PERSIST (localStorage)
    try {
      localStorage.removeItem("persist:root");
    } catch {}
  }

  return appReducer(state, action);
};


// ✅ configure persistence
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["nav", "geofence", "tourist","global","auth"], // only persist these slices
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// ✅ create the store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// ✅ create persistor
export const persistor = persistStore(store);

// ✅ export types
export type AppStore = typeof store;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

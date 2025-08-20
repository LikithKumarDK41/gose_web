"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Position { lat: number; lng: number; ts: number; }
type PosState = { samples: Position[]; live: boolean; };
const initial: PosState = { samples: [], live: false };

const pos = createSlice({
    name: "positions", initialState: initial,
    reducers: {
        addSample(s, a: PayloadAction<Position>) { s.samples.push(a.payload); },
        setLive(s, a: PayloadAction<boolean>) { s.live = a.payload; },
        clear(s) { s.samples = []; }
    }
});
export const { addSample, setLive, clear } = pos.actions;
export default pos.reducer;

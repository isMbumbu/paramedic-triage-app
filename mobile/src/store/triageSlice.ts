import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { TriageRecord } from "../types/triage";

type TriageState = {
  records: TriageRecord[];
  syncing: boolean;
};

const initialState: TriageState = {
  records: [],
  syncing: false
};

const triageSlice = createSlice({
  name: "triage",
  initialState,
  reducers: {
    setRecords(state, action: PayloadAction<TriageRecord[]>) {
      state.records = action.payload;
    },
    addRecord(state, action: PayloadAction<TriageRecord>) {
      state.records.unshift(action.payload);
    },
    setSyncing(state, action: PayloadAction<boolean>) {
      state.syncing = action.payload;
    }
  }
});

export const { addRecord, setRecords, setSyncing } = triageSlice.actions;
export const triageReducer = triageSlice.reducer;

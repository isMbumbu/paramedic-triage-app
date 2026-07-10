import NetInfo from "@react-native-community/netinfo";
import { useEffect } from "react";
import { AppState } from "react-native";
import { useDispatch } from "react-redux";

import { initializeDatabase, listRecords } from "../database/triageDatabase";
import { syncPendingRecords } from "../services/sync/syncService";
import { setRecords, setSyncing } from "../store/triageSlice";
import { AppDispatch } from "../store/store";

export function useSyncWorker() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    async function runSync() {
      dispatch(setSyncing(true));
      try {
        await initializeDatabase();
        await syncPendingRecords();
        dispatch(setRecords(await listRecords()));
      } finally {
        dispatch(setSyncing(false));
      }
    }

    const netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        void runSync();
      }
    });

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void runSync();
      }
    });

    void runSync();

    return () => {
      netInfoUnsubscribe();
      appStateSubscription.remove();
    };
  }, [dispatch]);
}

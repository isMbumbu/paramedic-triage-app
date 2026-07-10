import NetInfo from "@react-native-community/netinfo";

import {
  listPendingRecords,
  markFailed,
  markSynced,
  markSyncing
} from "../../database/triageDatabase";
import { uploadTriageRecord } from "../api/triageApi";

let syncInFlight = false;

export async function syncPendingRecords(): Promise<number> {
  if (syncInFlight) {
    return 0;
  }

  const network = await NetInfo.fetch();
  if (!network.isConnected || network.isInternetReachable === false) {
    return 0;
  }

  syncInFlight = true;
  let syncedCount = 0;
  try {
    const pendingRecords = await listPendingRecords();
    for (const record of pendingRecords) {
      try {
        await markSyncing(record.id);
        const remoteId = await uploadTriageRecord(record);
        await markSynced(record.id, remoteId);
        syncedCount += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown sync error";
        await markFailed(record.id, message);
      }
    }
    return syncedCount;
  } finally {
    syncInFlight = false;
  }
}

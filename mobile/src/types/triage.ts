export type TriageStatus = "Pending" | "In-Transit";

export type SyncState = "pending" | "syncing" | "synced" | "failed";

export type TriageRecord = {
  id: string;
  patientName: string;
  conditionDescription: string;
  priority: number;
  status: TriageStatus;
  syncState: SyncState;
  remoteId?: string;
  createdAt: string;
  updatedAt: string;
  lastSyncError?: string;
};

export type TriageFormValues = {
  patientName: string;
  conditionDescription: string;
  priority: number;
  status: TriageStatus;
};

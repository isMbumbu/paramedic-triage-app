import NetInfo from "@react-native-community/netinfo";

import {
  listPendingRecords,
  markFailed,
  markSynced,
  markSyncing
} from "../src/database/triageDatabase";
import { uploadTriageRecord } from "../src/services/api/triageApi";
import { syncPendingRecords } from "../src/services/sync/syncService";
import { TriageRecord } from "../src/types/triage";

jest.mock("@react-native-community/netinfo", () => ({
  fetch: jest.fn()
}));

jest.mock("../src/database/triageDatabase", () => ({
  listPendingRecords: jest.fn(),
  markFailed: jest.fn(),
  markSynced: jest.fn(),
  markSyncing: jest.fn()
}));

jest.mock("../src/services/api/triageApi", () => ({
  uploadTriageRecord: jest.fn()
}));

const queuedRecord: TriageRecord = {
  id: "local-1",
  patientName: "Amina Otieno",
  conditionDescription: "Severe chest pain",
  priority: 1,
  status: "Pending",
  syncState: "pending",
  createdAt: "2026-07-10T10:00:00.000Z",
  updatedAt: "2026-07-10T10:00:00.000Z"
};

describe("syncPendingRecords", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("persists remote IDs after successful background upload", async () => {
    jest.mocked(NetInfo.fetch).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true
    } as never);
    jest.mocked(listPendingRecords).mockResolvedValue([queuedRecord]);
    jest.mocked(uploadTriageRecord).mockResolvedValue("remote-1");

    await expect(syncPendingRecords()).resolves.toBe(1);

    expect(markSyncing).toHaveBeenCalledWith("local-1");
    expect(markSynced).toHaveBeenCalledWith("local-1", "remote-1");
    expect(markFailed).not.toHaveBeenCalled();
  });

  it("leaves queued records untouched while offline", async () => {
    jest.mocked(NetInfo.fetch).mockResolvedValue({
      isConnected: false,
      isInternetReachable: false
    } as never);

    await expect(syncPendingRecords()).resolves.toBe(0);

    expect(listPendingRecords).not.toHaveBeenCalled();
    expect(uploadTriageRecord).not.toHaveBeenCalled();
  });

  it("marks failed uploads for retry on the next sync pass", async () => {
    jest.mocked(NetInfo.fetch).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true
    } as never);
    jest.mocked(listPendingRecords).mockResolvedValue([queuedRecord]);
    jest.mocked(uploadTriageRecord).mockRejectedValue(new Error("Network timeout"));

    await expect(syncPendingRecords()).resolves.toBe(0);

    expect(markSyncing).toHaveBeenCalledWith("local-1");
    expect(markFailed).toHaveBeenCalledWith("local-1", "Network timeout");
    expect(markSynced).not.toHaveBeenCalled();
  });
});

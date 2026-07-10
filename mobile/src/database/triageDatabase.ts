import * as SQLite from "expo-sqlite";

import { TriageFormValues, TriageRecord, SyncState } from "../types/triage";

type TriageRow = {
  id: string;
  patient_name: string;
  condition_description: string;
  priority: number;
  status: "Pending" | "In-Transit";
  sync_state: SyncState;
  remote_id: string | null;
  created_at: string;
  updated_at: string;
  last_sync_error: string | null;
};

const databasePromise = SQLite.openDatabaseAsync("triage.db");

function toRecord(row: TriageRow): TriageRecord {
  return {
    id: row.id,
    patientName: row.patient_name,
    conditionDescription: row.condition_description,
    priority: row.priority,
    status: row.status,
    syncState: row.sync_state,
    remoteId: row.remote_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSyncError: row.last_sync_error ?? undefined
  };
}

export async function initializeDatabase() {
  const db = await databasePromise;
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS triage_records (
      id TEXT PRIMARY KEY NOT NULL,
      patient_name TEXT NOT NULL,
      condition_description TEXT NOT NULL,
      priority INTEGER NOT NULL,
      status TEXT NOT NULL,
      sync_state TEXT NOT NULL,
      remote_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_sync_error TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_triage_sync_state ON triage_records(sync_state);
    CREATE INDEX IF NOT EXISTS idx_triage_priority ON triage_records(priority);
  `);
}

export async function insertLocalRecord(values: TriageFormValues): Promise<TriageRecord> {
  const db = await databasePromise;
  const now = new Date().toISOString();
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  await db.runAsync(
    `INSERT INTO triage_records
      (id, patient_name, condition_description, priority, status, sync_state, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    values.patientName.trim(),
    values.conditionDescription.trim(),
    values.priority,
    values.status,
    "pending",
    now,
    now
  );
  return {
    id,
    patientName: values.patientName.trim(),
    conditionDescription: values.conditionDescription.trim(),
    priority: values.priority,
    status: values.status,
    syncState: "pending",
    createdAt: now,
    updatedAt: now
  };
}

export async function listRecords(): Promise<TriageRecord[]> {
  const db = await databasePromise;
  const rows = await db.getAllAsync<TriageRow>(
    "SELECT * FROM triage_records ORDER BY created_at DESC"
  );
  return rows.map(toRecord);
}

export async function listPendingRecords(): Promise<TriageRecord[]> {
  const db = await databasePromise;
  const rows = await db.getAllAsync<TriageRow>(
    "SELECT * FROM triage_records WHERE sync_state IN ('pending', 'failed') ORDER BY created_at ASC"
  );
  return rows.map(toRecord);
}

export async function markSyncing(id: string) {
  const db = await databasePromise;
  await db.runAsync(
    "UPDATE triage_records SET sync_state = ?, updated_at = ? WHERE id = ?",
    "syncing",
    new Date().toISOString(),
    id
  );
}

export async function markSynced(id: string, remoteId: string) {
  const db = await databasePromise;
  await db.runAsync(
    `UPDATE triage_records
     SET sync_state = ?, remote_id = ?, last_sync_error = NULL, updated_at = ?
     WHERE id = ?`,
    "synced",
    remoteId,
    new Date().toISOString(),
    id
  );
}

export async function markFailed(id: string, message: string) {
  const db = await databasePromise;
  await db.runAsync(
    `UPDATE triage_records
     SET sync_state = ?, last_sync_error = ?, updated_at = ?
     WHERE id = ?`,
    "failed",
    message,
    new Date().toISOString(),
    id
  );
}

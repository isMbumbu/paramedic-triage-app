import { TriageRecord } from "../../types/triage";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
const API_MODE = process.env.EXPO_PUBLIC_API_MODE ?? "mock";
const MOCK_DELAY_MS = Number(process.env.EXPO_PUBLIC_MOCK_DELAY_MS ?? 2000);
const MOCK_FAILURE_RATE = Number(process.env.EXPO_PUBLIC_MOCK_FAILURE_RATE ?? 0);

type ApiTriageResponse = {
  data: {
    id: string;
  };
};

function buildTriageUrl() {
  return `${API_URL.replace(/\/$/, "")}/api/v1/triage`;
}

function toApiPayload(record: TriageRecord) {
  return {
    patient_name: record.patientName,
    condition_description: record.conditionDescription,
    priority: record.priority,
    status: record.status,
    synced: true
  };
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function uploadToMockApi(record: TriageRecord): Promise<string> {
  await wait(MOCK_DELAY_MS);

  if (Math.random() < MOCK_FAILURE_RATE) {
    throw new Error("Mock network failure");
  }

  return `mock-${record.id}`;
}

async function uploadToHttpApi(record: TriageRecord): Promise<string> {
  const response = await fetch(buildTriageUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toApiPayload(record))
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  const body = (await response.json()) as ApiTriageResponse;
  return body.data.id;
}

export async function uploadTriageRecord(record: TriageRecord): Promise<string> {
  if (API_MODE === "mock") {
    return uploadToMockApi(record);
  }

  return uploadToHttpApi(record);
}

export const triageApiInternals = {
  buildTriageUrl,
  toApiPayload
};

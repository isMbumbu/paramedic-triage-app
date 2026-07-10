import { TriageRecord } from "../../types/triage";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

type ApiTriageResponse = {
  data: {
    id: string;
  };
};

export async function uploadTriageRecord(record: TriageRecord): Promise<string> {
  const response = await fetch(`${API_URL}/triage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patient_name: record.patientName,
      condition_description: record.conditionDescription,
      priority: record.priority,
      status: record.status,
      synced: true
    })
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  const body = (await response.json()) as ApiTriageResponse;
  return body.data.id;
}

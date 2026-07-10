import { triageApiInternals } from "../src/services/api/triageApi";
import { TriageRecord } from "../src/types/triage";

const record: TriageRecord = {
  id: "local-1",
  patientName: "Amina Otieno",
  conditionDescription: "Severe chest pain",
  priority: 1,
  status: "Pending",
  syncState: "pending",
  createdAt: "2026-07-10T10:00:00.000Z",
  updatedAt: "2026-07-10T10:00:00.000Z"
};

describe("triage API adapter", () => {
  it("targets the assessment API path", () => {
    expect(triageApiInternals.buildTriageUrl()).toBe("http://localhost:8000/api/v1/triage");
  });

  it("maps local records to the backend payload shape", () => {
    expect(triageApiInternals.toApiPayload(record)).toEqual({
      patient_name: "Amina Otieno",
      condition_description: "Severe chest pain",
      priority: 1,
      status: "Pending",
      synced: true
    });
  });
});

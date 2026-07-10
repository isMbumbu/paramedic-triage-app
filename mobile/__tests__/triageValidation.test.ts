import { triageSchema } from "../src/utils/triageValidation";

describe("triage validation", () => {
  it("accepts a valid critical triage record", () => {
    const result = triageSchema.safeParse({
      patientName: "Jane Doe",
      conditionDescription: "Unconscious after road traffic crash",
      priority: 1,
      status: "Pending"
    });

    expect(result.success).toBe(true);
  });

  it("rejects blank fields and invalid priorities", () => {
    const result = triageSchema.safeParse({
      patientName: "",
      conditionDescription: "",
      priority: 6,
      status: "Pending"
    });

    expect(result.success).toBe(false);
  });
});

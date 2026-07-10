import { z } from "zod";

export const triageSchema = z.object({
  patientName: z.string().trim().min(1, "Patient name is required"),
  conditionDescription: z.string().trim().min(1, "Condition description is required"),
  priority: z.number({ required_error: "Priority is required" }).int().min(1).max(5),
  status: z.enum(["Pending", "In-Transit"])
});

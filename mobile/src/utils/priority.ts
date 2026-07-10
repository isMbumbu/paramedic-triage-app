export function getPriorityStyle(priority: number) {
  if (priority === 1) {
    return { backgroundColor: "#991b1b", borderColor: "#7f1d1d", color: "#ffffff" };
  }
  if (priority === 2) {
    return { backgroundColor: "#c2410c", borderColor: "#9a3412", color: "#ffffff" };
  }
  return { backgroundColor: "#f3f4f6", borderColor: "#d1d5db", color: "#111827" };
}

export function getPriorityLabel(priority: number) {
  const labels: Record<number, string> = {
    1: "Immediate life threat",
    2: "High urgency",
    3: "Needs prompt care",
    4: "Stable / delayed",
    5: "Routine / non-urgent"
  };
  return labels[priority];
}

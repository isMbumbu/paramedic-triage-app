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
    1: "1 Critical",
    2: "2 Emergent",
    3: "3 Urgent",
    4: "4 Stable",
    5: "5 Routine"
  };
  return labels[priority];
}

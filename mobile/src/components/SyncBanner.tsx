import { StyleSheet, Text, View } from "react-native";

type Props = {
  pendingCount: number;
  failedCount: number;
  syncedCount: number;
  syncing: boolean;
};

export function SyncBanner({ pendingCount, failedCount, syncedCount, syncing }: Props) {
  const hasQueue = pendingCount > 0 || failedCount > 0;
  const backgroundColor = failedCount > 0 ? "#7f1d1d" : hasQueue ? "#92400e" : "#064e3b";
  const iconName = syncing ? "sync" : failedCount > 0 ? "alert-octagon" : hasQueue ? "database-clock" : "check-decagram";
  const label = syncing
    ? "Syncing local queue"
    : failedCount > 0
      ? `${failedCount} upload retry pending`
      : pendingCount > 0
        ? `${pendingCount} safely stored offline`
        : "All local records synced";

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.statusRow}>
        <Text style={styles.icon}>{iconName === "sync" ? "↻" : iconName === "alert-octagon" ? "⚠" : iconName === "database-clock" ? "🗄" : "✓"}</Text>
        <Text style={styles.text}>{label}</Text>
      </View>
      <View style={styles.metrics}>
        <Text style={styles.metric}>Queued {pendingCount}</Text>
        <Text style={styles.metric}>Synced {syncedCount}</Text>
        <Text style={styles.metric}>Retry {failedCount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  icon: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900"
  },
  text: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900"
  },
  metrics: {
    flexDirection: "row",
    gap: 8
  },
  metric: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 6,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4
  }
});

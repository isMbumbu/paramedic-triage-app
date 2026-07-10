import { StyleSheet, Text, View } from "react-native";

type Props = {
  pendingCount: number;
  failedCount: number;
  syncing: boolean;
};

export function SyncBanner({ pendingCount, failedCount, syncing }: Props) {
  const backgroundColor = failedCount > 0 ? "#7f1d1d" : pendingCount > 0 ? "#92400e" : "#065f46";
  const label = syncing
    ? "Synchronizing queued records"
    : failedCount > 0
      ? `${failedCount} record(s) need retry`
      : pendingCount > 0
        ? `${pendingCount} record(s) safely queued`
        : "All records synchronized";

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  text: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700"
  }
});

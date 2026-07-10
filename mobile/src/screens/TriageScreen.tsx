import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

import { PrioritySelector } from "../components/PrioritySelector";
import { SyncBanner } from "../components/SyncBanner";
import { initializeDatabase, insertLocalRecord, listRecords } from "../database/triageDatabase";
import { useSyncWorker } from "../hooks/useSyncWorker";
import { syncPendingRecords } from "../services/sync/syncService";
import { addRecord, setRecords, setSyncing } from "../store/triageSlice";
import { AppDispatch, RootState } from "../store/store";
import { TriageFormValues } from "../types/triage";
import { getPriorityStyle } from "../utils/priority";
import { triageSchema } from "../utils/triageValidation";

const defaultValues: TriageFormValues = {
  patientName: "",
  conditionDescription: "",
  priority: 1,
  status: "Pending"
};

export function TriageScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { records, syncing } = useSelector((state: RootState) => state.triage);
  useSyncWorker();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TriageFormValues>({
    defaultValues,
    resolver: zodResolver(triageSchema)
  });

  useEffect(() => {
    async function bootstrap() {
      await initializeDatabase();
      dispatch(setRecords(await listRecords()));
    }

    void bootstrap();
  }, [dispatch]);

  async function submit(values: TriageFormValues) {
    await initializeDatabase();
    const record = await insertLocalRecord(values);
    dispatch(addRecord(record));
    reset(defaultValues);
    dispatch(setSyncing(true));
    void syncPendingRecords()
      .then(async () => {
        dispatch(setRecords(await listRecords()));
      })
      .finally(() => {
        dispatch(setSyncing(false));
      });
  }

  const pendingCount = records.filter((record) => record.syncState === "pending").length;
  const failedCount = records.filter((record) => record.syncState === "failed").length;
  const syncedCount = records.filter((record) => record.syncState === "synced").length;
  const criticalCount = records.filter((record) => record.priority <= 2).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={styles.container}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>EMKF FIELD TRIAGE</Text>
            <Text style={styles.title}>Patient Intake</Text>
          </View>
          <View style={styles.criticalPill}>
            <Text style={styles.criticalPillText}>⚠ {criticalCount} Critical</Text>
          </View>
        </View>

        <View style={styles.formPanel}>
          <SyncBanner
            pendingCount={pendingCount}
            failedCount={failedCount}
            syncedCount={syncedCount}
            syncing={syncing}
          />

          <Text style={styles.label}>Patient Name</Text>
          <Controller
            control={control}
            name="patientName"
            render={({ field }) => (
              <TextInput
                accessibilityLabel="Patient Name"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                value={field.value}
                placeholder="Full name or unknown identifier"
                placeholderTextColor="#6b7280"
                style={styles.input}
              />
            )}
          />
          {errors.patientName ? <Text style={styles.error}>{errors.patientName.message}</Text> : null}

          <Text style={styles.label}>Condition Description</Text>
          <Controller
            control={control}
            name="conditionDescription"
            render={({ field }) => (
              <TextInput
                accessibilityLabel="Condition Description"
                multiline
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                value={field.value}
                placeholder="Vitals, symptoms, mechanism of injury"
                placeholderTextColor="#6b7280"
                style={[styles.input, styles.textArea]}
              />
            )}
          />
          {errors.conditionDescription ? (
            <Text style={styles.error}>{errors.conditionDescription.message}</Text>
          ) : null}

          <Text style={styles.label}>Priority Level</Text>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => <PrioritySelector field={field} />}
          />

          <Text style={styles.label}>Status</Text>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <View style={styles.segment}>
                {(["Pending", "In-Transit"] as const).map((status) => (
                  <Pressable
                    key={status}
                    onPress={() => field.onChange(status)}
                    style={[styles.segmentButton, field.value === status && styles.segmentActive]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        field.value === status && styles.segmentTextActive
                      ]}
                    >
                      {status}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          />

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={handleSubmit(submit)}
            style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
          >
            <Text style={styles.submitIcon}>✓</Text>
            <Text style={styles.submitText}>Save Triage Record</Text>
          </Pressable>
        </View>

        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Recent Intake</Text>
              <Text style={styles.listCount}>{records.length} local</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🗄</Text>
              <Text style={styles.emptyText}>No local triage records yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const priorityStyle = getPriorityStyle(item.priority);
            const isCritical = item.priority <= 2;
            const syncColor =
              item.syncState === "synced"
                ? "#047857"
                : item.syncState === "failed"
                  ? "#b91c1c"
                  : item.syncState === "syncing"
                    ? "#0369a1"
                    : "#b45309";

            return (
              <View style={[styles.recordRow, isCritical && styles.criticalRecord]}>
                <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.backgroundColor }]}>
                  <Text style={styles.priorityBadgeText}>P{item.priority}</Text>
                </View>
                <View style={styles.recordText}>
                  <View style={styles.recordTopLine}>
                    <Text numberOfLines={1} style={styles.recordName}>
                      {item.patientName}
                    </Text>
                    <View style={[styles.syncPill, { backgroundColor: syncColor }]}>
                      <Text style={styles.syncPillText}>{item.syncState.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text numberOfLines={1} style={styles.recordMeta}>
                    {item.status} • {item.conditionDescription}
                  </Text>
                  <Text numberOfLines={1} style={styles.recordSaved}>
                    Saved locally {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                    {item.remoteId ? ` • Remote ${item.remoteId}` : ""}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f172a"
  },
  container: {
    flex: 1,
    padding: 16,
    gap: 12
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4
  },
  eyebrow: {
    color: "#fb923c",
    fontSize: 12,
    fontWeight: "900"
  },
  title: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "900"
  },
  criticalPill: {
    alignItems: "center",
    backgroundColor: "#b91c1c",
    borderRadius: 8,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  criticalPillText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900"
  },
  formPanel: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    gap: 8,
    padding: 12
  },
  label: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12
  },
  textArea: {
    minHeight: 86,
    paddingTop: 12,
    textAlignVertical: "top"
  },
  error: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "700"
  },
  segment: {
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    flexDirection: "row",
    padding: 4
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    paddingVertical: 10
  },
  segmentActive: {
    backgroundColor: "#0f172a"
  },
  segmentText: {
    color: "#111827",
    fontWeight: "800"
  },
  segmentTextActive: {
    color: "#ffffff"
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#047857",
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    minHeight: 52,
    justifyContent: "center",
    marginTop: 4
  },
  submitDisabled: {
    opacity: 0.65
  },
  submitText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900"
  },
  submitIcon: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900"
  },
  list: {
    gap: 8,
    paddingBottom: 24
  },
  listHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4
  },
  listTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900"
  },
  listCount: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "800"
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    gap: 6,
    padding: 18
  },
  emptyIcon: {
    color: "#64748b",
    fontSize: 20,
    fontWeight: "900"
  },
  emptyText: {
    color: "#475569",
    fontWeight: "800"
  },
  recordRow: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderLeftColor: "#334155",
    borderLeftWidth: 5,
    flexDirection: "row",
    gap: 10,
    minHeight: 76,
    padding: 10
  },
  criticalRecord: {
    borderLeftColor: "#dc2626"
  },
  priorityBadge: {
    alignItems: "center",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  priorityBadgeText: {
    color: "#ffffff",
    fontWeight: "900"
  },
  recordText: {
    flex: 1
  },
  recordTopLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  recordName: {
    color: "#0f172a",
    flex: 1,
    fontSize: 15,
    fontWeight: "900"
  },
  syncPill: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3
  },
  syncPillText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900"
  },
  recordMeta: {
    color: "#334155",
    fontSize: 13,
    marginTop: 2
  },
  recordSaved: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3
  }
});

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
import { TriageFormValues, TriageStatus } from "../types/triage";
import { getPriorityStyle } from "../utils/priority";
import { triageSchema } from "../utils/triageValidation";

const statusOptions: Array<{ value: TriageStatus; label: string; helperText: string; backgroundColor: string; textColor: string }> = [
  {
    value: "Pending",
    label: "Awaiting Dispatch",
    helperText: "Still being assessed",
    backgroundColor: "#fde68a",
    textColor: "#92400e"
  },
  {
    value: "In-Transit",
    label: "In Transit",
    helperText: "En route to destination",
    backgroundColor: "#bfdbfe",
    textColor: "#1d4ed8"
  }
];

const defaultValues: TriageFormValues = {
  patientName: "",
  conditionDescription: "",
  priority: 1,
  status: "Pending"
};

type SaveFeedback = { kind: "saved-offline" | "saved-online" | "error"; message: string } | null;

export function TriageScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { records, syncing } = useSelector((state: RootState) => state.triage);
  const [listTab, setListTab] = useState<"queued" | "synced">("queued");
  const [feedback, setFeedback] = useState<SaveFeedback>(null);
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

  // Auto-dismiss the inline save confirmation so it doesn't linger stale.
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  async function submit(values: TriageFormValues) {
    try {
      await initializeDatabase();
      const record = await insertLocalRecord(values);
      dispatch(addRecord(record));
      reset(defaultValues);
      setFeedback({
        kind: "saved-offline",
        message: "Saved on device. Will sync automatically once connected."
      });

      dispatch(setSyncing(true));
      try {
        await syncPendingRecords();
        dispatch(setRecords(await listRecords()));
        setFeedback({ kind: "saved-online", message: "Synced to server." });
      } finally {
        dispatch(setSyncing(false));
      }
    } catch (err) {
      // Local persistence itself failed — this is the one case that matters most
      // to surface clearly, since it's the failure mode the app promises never happens silently.
      setFeedback({
        kind: "error",
        message: "Couldn't save this record locally. Please try again."
      });
    }
  }

  const { pendingCount, failedCount, syncedCount, syncedRecords, queuedRecords, criticalCount } = useMemo(() => {
    return {
      pendingCount: records.filter((r) => r.syncState === "pending").length,
      failedCount: records.filter((r) => r.syncState === "failed").length,
      syncedCount: records.filter((r) => r.syncState === "synced").length,
      syncedRecords: records.filter((r) => r.syncState === "synced"),
      queuedRecords: records.filter((r) => r.syncState !== "synced"),
      criticalCount: records.filter((r) => r.priority <= 2).length
    };
  }, [records]);

  const visibleRecords = listTab === "synced" ? syncedRecords : queuedRecords;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: "height" })}
        keyboardVerticalOffset={Platform.select({ ios: 12, android: 0 })}
        style={styles.container}
      >
        <ScrollView
          alwaysBounceVertical
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.content}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          scrollIndicatorInsets={{ bottom: 32 }}
          showsVerticalScrollIndicator
          style={styles.scroller}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>EMKF FIELD TRIAGE</Text>
              <Text style={styles.title}>Patient Intake</Text>
            </View>
            <View
              accessibilityLabel={`${criticalCount} critical cases`}
              style={[styles.headerPill, criticalCount > 0 && styles.criticalPill]}
            >
              <MaterialCommunityIcons color="#ffffff" name="alert" size={16} />
              <Text style={styles.criticalPillText}>{criticalCount} Critical</Text>
            </View>
          </View>

          <View style={styles.formPanel}>
            <SyncBanner
              pendingCount={pendingCount}
              failedCount={failedCount}
              syncedCount={syncedCount}
              syncing={syncing}
            />

            {feedback ? (
              <View
                accessibilityLiveRegion="polite"
                style={[
                  styles.feedbackBanner,
                  feedback.kind === "error" ? styles.feedbackError : styles.feedbackOk
                ]}
              >
                <MaterialCommunityIcons
                  color={feedback.kind === "error" ? "#b91c1c" : "#0f766e"}
                  name={
                    feedback.kind === "error"
                      ? "alert-circle-outline"
                      : feedback.kind === "saved-online"
                        ? "cloud-check-outline"
                        : "content-save-outline"
                  }
                  size={18}
                />
                <Text
                  style={[
                    styles.feedbackText,
                    { color: feedback.kind === "error" ? "#b91c1c" : "#0f766e" }
                  ]}
                >
                  {feedback.message}
                </Text>
              </View>
            ) : null}

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
                  returnKeyType="next"
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
            {errors.priority ? <Text style={styles.error}>{errors.priority.message}</Text> : null}

            <Text style={styles.label}>Status</Text>
            <Text style={styles.helperText}>Choose the current patient workflow state.</Text>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <View style={styles.statusOptionsRow}>
                  {statusOptions.map(({ value, label, helperText, backgroundColor, textColor }) => {
                    const active = field.value === value;
                    return (
                      <Pressable
                        key={value}
                        accessibilityLabel={label}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => field.onChange(value)}
                        style={[
                          styles.statusButton,
                          {
                            backgroundColor: active ? backgroundColor : "#f8fafc",
                            borderColor: backgroundColor
                          },
                          active && styles.statusButtonActive
                        ]}
                      >
                        <Text style={[styles.statusText, { color: active ? textColor : "#475569" }]}>
                          {label}
                        </Text>
                        <Text style={[styles.statusHelperText, { color: active ? textColor : "#64748b" }]}>
                          {helperText}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            />

            <Pressable
              accessibilityLabel="Save Triage Record"
              accessibilityRole="button"
              accessibilityState={{ disabled: isSubmitting }}
              disabled={isSubmitting}
              onPress={handleSubmit(submit)}
              style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
            >
              <MaterialCommunityIcons color="#ffffff" name="content-save-check" size={20} />
              <Text style={styles.submitText}>Save Triage Record</Text>
            </Pressable>
          </View>

          <View style={styles.listSection}>
            <View style={styles.listHeader}>
              <View>
                <Text style={styles.listTitle}>
                  {listTab === "synced" ? "Synced Records" : "Queued Records"}
                </Text>
                <Text style={styles.listSubtitle}>Local queue remains available offline</Text>
              </View>
              <Text style={styles.listCount}>
                {visibleRecords.length} {listTab === "synced" ? "synced" : "queued"}
              </Text>
            </View>

            <View style={styles.listTabs}>
              <Pressable
                accessibilityLabel="Show queued records"
                accessibilityRole="button"
                accessibilityState={{ selected: listTab === "queued" }}
                onPress={() => setListTab("queued")}
                style={[styles.listTab, listTab === "queued" && styles.listTabActive]}
              >
                <Text style={[styles.listTabText, listTab === "queued" && styles.listTabTextActive]}>
                  Queued
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Show synced records"
                accessibilityRole="button"
                accessibilityState={{ selected: listTab === "synced" }}
                onPress={() => setListTab("synced")}
                style={[styles.listTab, listTab === "synced" && styles.listTabActive]}
              >
                <Text style={[styles.listTabText, listTab === "synced" && styles.listTabTextActive]}>
                  Synced
                </Text>
              </Pressable>
            </View>

            {visibleRecords.length > 0 ? (
              visibleRecords.map((item) => {
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
                  <View key={item.id} style={[styles.recordRow, isCritical && styles.criticalRecord]}>
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
                        {item.status} | {item.conditionDescription}
                      </Text>
                      <Text numberOfLines={1} style={styles.recordSaved}>
                        Saved locally {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                        {item.remoteId ? ` | Remote ${item.remoteId}` : ""}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons color="#64748b" name="clipboard-text-off-outline" size={24} />
                <Text style={styles.emptyText}>
                  {listTab === "synced" ? "No synced records yet" : "No queued records yet"}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111827"
  },
  container: {
    flex: 1
  },
  scroller: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    gap: 12,
    padding: 14,
    paddingBottom: 120
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 2
  },
  eyebrow: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0
  },
  title: {
    color: "#f8fafc",
    fontSize: 26,
    fontWeight: "900"
  },
  headerPill: {
    alignItems: "center",
    backgroundColor: "#334155",
    borderRadius: 8,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  criticalPill: {
    backgroundColor: "#b91c1c"
  },
  criticalPillText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900"
  },
  formPanel: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderColor: "#e5e7eb",
    borderWidth: 1,
    gap: 8,
    padding: 14
  },
  feedbackBanner: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  feedbackOk: {
    backgroundColor: "#f0fdfa",
    borderColor: "#99f6e4"
  },
  feedbackError: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca"
  },
  feedbackText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700"
  },
  label: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4
  },
  helperText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700"
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#d1d5db",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    fontSize: 16,
    minHeight: 46,
    paddingHorizontal: 12
  },
  textArea: {
    minHeight: 76,
    paddingTop: 12,
    textAlignVertical: "top"
  },
  error: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "700"
  },
  statusOptionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6
  },
  statusButton: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  statusButtonActive: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }
  },
  statusText: {
    fontSize: 14,
    fontWeight: "900"
  },
  statusHelperText: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
    textAlign: "center"
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#0f766e",
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    minHeight: 52,
    justifyContent: "center",
    marginTop: 6
  },
  submitDisabled: {
    opacity: 0.65
  },
  submitText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900"
  },
  listSection: {
    gap: 8,
    marginTop: 4,
    paddingBottom: 24
  },
  listHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4
  },
  listTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900"
  },
  listSubtitle: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
  },
  listCount: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "800"
  },
  listTabs: {
    backgroundColor: "#243244",
    borderRadius: 8,
    flexDirection: "row",
    padding: 4
  },
  listTab: {
    borderRadius: 6,
    flex: 1,
    paddingVertical: 8
  },
  listTabActive: {
    backgroundColor: "#0f766e"
  },
  listTabText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  },
  listTabTextActive: {
    color: "#ffffff"
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderColor: "#e5e7eb",
    borderWidth: 1,
    gap: 6,
    padding: 18
  },
  emptyText: {
    color: "#475569",
    fontWeight: "800"
  },
  recordRow: {
    alignItems: "center",
    backgroundColor: "#f9fafb",
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
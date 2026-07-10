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

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={styles.container}
      >
        <View style={styles.formPanel}>
          <SyncBanner pendingCount={pendingCount} failedCount={failedCount} syncing={syncing} />

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
            <Text style={styles.submitText}>Save Triage Record</Text>
          </Pressable>
        </View>

        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<Text style={styles.listTitle}>Recent Intake</Text>}
          renderItem={({ item }) => (
            <View style={styles.recordRow}>
              <View style={[styles.priorityBadge, item.priority <= 2 && styles.criticalBadge]}>
                <Text style={styles.priorityBadgeText}>P{item.priority}</Text>
              </View>
              <View style={styles.recordText}>
                <Text style={styles.recordName}>{item.patientName}</Text>
                <Text numberOfLines={1} style={styles.recordMeta}>
                  {item.status} - {item.syncState}
                </Text>
              </View>
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e5e7eb"
  },
  container: {
    flex: 1,
    padding: 16,
    gap: 12
  },
  formPanel: {
    gap: 8
  },
  label: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#9ca3af",
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
    backgroundColor: "#d1d5db",
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
    backgroundColor: "#111827"
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
    backgroundColor: "#0f766e",
    borderRadius: 8,
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
  list: {
    gap: 8,
    paddingBottom: 24
  },
  listTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4
  },
  recordRow: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    flexDirection: "row",
    gap: 10,
    minHeight: 62,
    padding: 10
  },
  priorityBadge: {
    alignItems: "center",
    backgroundColor: "#374151",
    borderRadius: 8,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  criticalBadge: {
    backgroundColor: "#991b1b"
  },
  priorityBadgeText: {
    color: "#ffffff",
    fontWeight: "900"
  },
  recordText: {
    flex: 1
  },
  recordName: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "900"
  },
  recordMeta: {
    color: "#4b5563",
    fontSize: 13,
    marginTop: 2
  }
});

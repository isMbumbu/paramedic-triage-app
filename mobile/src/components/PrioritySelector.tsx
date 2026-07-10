import { ControllerRenderProps } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { TriageFormValues } from "../types/triage";
import { getPriorityLabel, getPriorityStyle } from "../utils/priority";

type Props = {
  field: ControllerRenderProps<TriageFormValues, "priority">;
};

export function PrioritySelector({ field }: Props) {
  return (
    <View style={styles.grid}>
      {[1, 2, 3, 4, 5].map((priority) => {
        const isSelected = field.value === priority;
        const priorityStyle = getPriorityStyle(priority);
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Priority ${priority}`}
            key={priority}
            onPress={() => field.onChange(priority)}
            style={[
              styles.option,
              {
                backgroundColor: priorityStyle.backgroundColor,
                borderColor: isSelected ? "#111827" : priorityStyle.borderColor,
                borderWidth: isSelected ? 3 : 1
              }
            ]}
          >
            <Text style={[styles.priorityText, { color: priorityStyle.color }]}>
              {getPriorityLabel(priority)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  option: {
    alignItems: "center",
    borderRadius: 8,
    flexBasis: "31%",
    minHeight: 56,
    justifyContent: "center",
    paddingHorizontal: 8
  },
  priorityText: {
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  }
});

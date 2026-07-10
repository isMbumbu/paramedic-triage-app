import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Pressable } from "react-native";

type PriorityFieldLike = {
  value: number;
  onChange: (value: number) => void;
};

type Props = {
  field: PriorityFieldLike;
};

const PRIORITY_LEVELS: Array<{
  value: number;
  label: string;
  helperText: string;
  backgroundColor: string;
  activeBackgroundColor: string;
  textColor: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}> = [
  {
    value: 1,
    label: "P1 · Critical",
    helperText: "Life-threatening, immediate",
    backgroundColor: "#fee2e2",
    activeBackgroundColor: "#dc2626",
    textColor: "#991b1b",
    icon: "alert-octagon"
  },
  {
    value: 2,
    label: "P2 · Urgent",
    helperText: "Serious, fast intervention",
    backgroundColor: "#ffedd5",
    activeBackgroundColor: "#ea580c",
    textColor: "#9a3412",
    icon: "alert"
  },
  {
    value: 3,
    label: "P3 · Serious",
    helperText: "Stable but needs care soon",
    backgroundColor: "#fef9c3",
    activeBackgroundColor: "#ca8a04",
    textColor: "#854d0e",
    icon: "alert-circle-outline"
  },
  {
    value: 4,
    label: "P4 · Stable",
    helperText: "Non-urgent, monitor",
    backgroundColor: "#dcfce7",
    activeBackgroundColor: "#16a34a",
    textColor: "#166534",
    icon: "shield-check-outline"
  },
  {
    value: 5,
    label: "P5 · Minor",
    helperText: "Walking wounded",
    backgroundColor: "#dbeafe",
    activeBackgroundColor: "#2563eb",
    textColor: "#1e40af",
    icon: "information-outline"
  }
];

export function PrioritySelector({ field }: Props) {
  return (
    <View
      accessibilityLabel="Priority Level"
      accessibilityRole="radiogroup"
      style={styles.grid}
    >
      {PRIORITY_LEVELS.map((level) => {
        const active = field.value === level.value;
        return (
          <Pressable
            key={level.value}
            accessibilityLabel={`${level.label}, ${level.helperText}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => field.onChange(level.value)}
            style={[
              styles.card,
              {
                backgroundColor: active ? level.activeBackgroundColor : level.backgroundColor,
                borderColor: active ? level.activeBackgroundColor : "transparent"
              },
              active && styles.cardActive
            ]}
          >
            <MaterialCommunityIcons
              color={active ? "#ffffff" : level.textColor}
              name={level.icon}
              size={20}
            />
            <Text
              numberOfLines={1}
              style={[styles.label, { color: active ? "#ffffff" : level.textColor }]}
            >
              {level.label}
            </Text>
            <Text
              numberOfLines={2}
              style={[styles.helperText, { color: active ? "#ffffff" : level.textColor }]}
            >
              {level.helperText}
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
    gap: 8,
    marginTop: 6
  },
  card: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 2,
    flexBasis: "31%",
    flexGrow: 1,
    gap: 4,
    minHeight: 84,
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 10
  },
  cardActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3
  },
  label: {
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center"
  },
  helperText: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center"
  }
});
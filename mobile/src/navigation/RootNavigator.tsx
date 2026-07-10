import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { TriageScreen } from "../screens/TriageScreen";

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Triage"
        component={TriageScreen}
        options={{
          title: "Paramedic Triage",
          headerStyle: { backgroundColor: "#111827" },
          headerTintColor: "#ffffff"
        }}
      />
    </Stack.Navigator>
  );
}

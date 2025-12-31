import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PaymentScreen from "./PaymentsScreen";
import PaymentDetailsScreen from "./PaymentDetailsScreen";

const Stack = createNativeStackNavigator();

export default function PaymentsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: "#007AFF",
        headerStyle: { backgroundColor: "#fff" },
        headerTitleAlign: "left",
      }}
    >
      <Stack.Screen
        name="PaymentsList"
        component={PaymentScreen}
        options={{
          title: "Payments",
        }}
      />
      <Stack.Screen
        name="PaymentDetails"
        component={PaymentDetailsScreen}
        options={{
          title: "Payment Details",
          headerBackTitle: "Back",
        }}
      />
    </Stack.Navigator>
  );
}

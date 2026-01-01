import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OrdersScreen from "./OrdersScreen";
import OrderDetailsScreen from "./OrderDetailsScreen";

const Stack = createNativeStackNavigator();

export default function OrdersStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: "#007AFF",
        headerStyle: { backgroundColor: "#fff" },
        headerTitleAlign: "left",
      }}
    >
      <Stack.Screen
        name="OrdersList"
        component={OrdersScreen}
        options={{ title: "Orders" }}
      />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{ title: "Order Details" }}
      />
    </Stack.Navigator>
  );
}

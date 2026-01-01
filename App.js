import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  User,
  Settings,
} from "lucide-react-native";
import PaymentsStack from "./screens/payment/PaymentsStack";
import { supabase } from "./lib/supabase";
import LoginForm from "./screens/LoginForm";

// Import your screen components (create these files in your screens folder)
import DashboardScreen from "./screens/dashboard/AdminDashboard";
import UserScreen from "./screens/user/UserScreen";
import SettingsScreen from "./screens/setting/SettingsScreen";
import OrdersStack from "./screens/order/OrdersStack";

const Tab = createBottomTabNavigator();

function MyTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerTintColor: "#007AFF",
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <LayoutDashboard color={color} size={20} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersStack}
        options={{
          tabBarIcon: ({ color }) => <ShoppingCart color={color} size={20} />,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="PaymentsTab" // You can name the Tab "Payments"
        component={PaymentsStack}
        options={{
          headerShown: false,
          title: "Payments",
          tabBarIcon: ({ color }) => <CreditCard color={color} size={20} />,
          unmountOnBlur: true,
        }}
      />
      <Tab.Screen
        name="User"
        component={UserScreen}
        options={{
          tabBarIcon: ({ color }) => <User color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color }) => <Settings color={color} size={20} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <View style={styles.container}>
        {session && session.user ? <MyTabs /> : <LoginForm />}
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});

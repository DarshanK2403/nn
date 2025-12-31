import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { supabase } from "../lib/supabase";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

export default function AdminDashboard() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  const handleTestNotification = async () => {
    const canNotify =
      Constants.appOwnership !== "expo" && Constants.appOwnership !== "guest";

    if (!canNotify) {
      console.log("Notifications not supported in Expo Go");
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔔 Test Notification",
        body: "Notifications are working correctly.",
        sound: "default",
      },
      trigger: null,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>You are logged in for 7 days.</Text>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.notifyBtn}
        onPress={handleTestNotification}
      >
        <Text style={styles.notifyText}>Test Notification</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 10 },
  logoutBtn: {
    marginTop: 40,
    padding: 15,
    backgroundColor: "#ff3b30",
    borderRadius: 8,
  },
  logoutText: { color: "#fff", fontWeight: "bold" },
  notifyBtn: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    width: 220,
    alignItems: "center",
  },
  notifyText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

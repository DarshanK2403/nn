import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";

const DASHBOARD_STATS = [
  {
    id: "1",
    label: "Today's Orders",
    value: 18,
    bg: "#EEF2FF",
    color: "#3730A3",
  },
  {
    id: "2",
    label: "Today's Revenue",
    value: "₹12,450",
    bg: "#ECFDF5",
    color: "#065F46",
  },
  {
    id: "3",
    label: "Pending Orders",
    value: 5,
    bg: "#FEF3C7",
    color: "#92400E",
  },
  {
    id: "4",
    label: "Low Stock Items",
    value: 3,
    bg: "#FEE2E2",
    color: "#991B1B",
  },
];

const RECENT_ORDERS = [
  { id: "#DT1023", customer: "Rahul", amount: "₹1,299", status: "PLACED" },
  { id: "#DT1022", customer: "Ayesha", amount: "₹2,499", status: "CONFIRMED" },
  { id: "#DT1021", customer: "Amit", amount: "₹799", status: "PENDING" },
];

export default function AdminDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>You are logged in for 7 days</Text>

      {/* Stats Cards */}
      <FlatList
        data={DASHBOARD_STATS}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ marginTop: 20 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: item.bg }]}>
            <Text style={styles.cardLabel}>{item.label}</Text>
            <Text style={[styles.cardValue, { color: item.color }]}>
              {item.value}
            </Text>
          </View>
        )}
      />

      {/* Recent Orders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>

        {RECENT_ORDERS.map((order) => (
          <View key={order.id} style={styles.orderRow}>
            <View>
              <Text style={styles.orderId}>{order.id}</Text>
              <Text style={styles.orderCustomer}>{order.customer}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.orderAmount}>{order.amount}</Text>
              <Text style={styles.orderStatus}>{order.status}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 13,
    color: "#374151",
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 6,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  orderRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  orderId: {
    fontWeight: "600",
    fontSize: 14,
  },
  orderCustomer: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  orderAmount: {
    fontWeight: "600",
    fontSize: 14,
  },
  orderStatus: {
    fontSize: 12,
    color: "#2563EB",
    marginTop: 2,
  },
});

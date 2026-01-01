import { supabase } from "@/lib/supabase";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";

const API_URL = "http://192.168.0.166:3000/api/admin/dashboard";

export default function AdminDashboard() {
  const [stats, setStats] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setRefreshing(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const json = await res.json();

      setStats([
        {
          id: "1",
          label: "Today's Orders",
          value: json.dashboardStats.todaysOrders,
          bg: "#EEF2FF",
          color: "#3730A3",
        },
        {
          id: "2",
          label: "Today's Revenue",
          value: `₹${json.dashboardStats.todaysRevenue}`,
          bg: "#ECFDF5",
          color: "#065F46",
        },
        {
          id: "3",
          label: "Pending Orders",
          value: json.dashboardStats.pendingOrders,
          bg: "#FEF3C7",
          color: "#92400E",
        },
        {
          id: "4",
          label: "Low Stock Items",
          value: json.dashboardStats.lowStockItems,
          bg: "#FEE2E2",
          color: "#991B1B",
        },
      ]);

      setOrders(
        json.recentOrders.map((o) => ({
          id: o.id,
          customer: o.customer,
          amount: `₹${o.amount}`,
          status: o.status,
        }))
      );
    } catch (err) {
      console.error("Dashboard API error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      refreshing={refreshing}
      onRefresh={fetchDashboard}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>You are logged in for 7 days</Text>

          {/* Stats */}
          <FlatList
            data={stats}
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

          <Text style={styles.sectionTitle}>Recent Orders</Text>
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.orderRow}>
          <View>
            <Text style={styles.orderId}>{item.id}</Text>
            <Text style={styles.orderCustomer}>{item.customer}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.orderAmount}>{item.amount}</Text>
            <Text style={styles.orderStatus}>{item.status}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },

  container: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 12,
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

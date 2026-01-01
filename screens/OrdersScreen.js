import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  AppState,
} from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { supabase } from "../lib/supabase";

const getStatusStyle = (status) => {
  switch (status) {
    case "CONFIRMED":
      return { backgroundColor: "#dcfce7", color: "#166534" };

    case "PLACED":
      return { backgroundColor: "#fef9c3", color: "#854d0e" };

    case "PENDING":
      return { backgroundColor: "#fee2e2", color: "#991b1b" };

    case "CANCELLED":
      return { backgroundColor: "#e5e7eb", color: "#374151" };

    default:
      return { backgroundColor: "#f3f4f6", color: "#374151" };
  }
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
    subscribeToOrders();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  /* ---------------- Fetch Initial Orders ---------------- */
  const fetchOrders = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("https://desitrend.store/api/admin/orders", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const result = await response.json();
      setOrders(result.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Realtime Subscription ---------------- */
  const subscribeToOrders = () => {
    channelRef.current = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            handleNewOrder(payload.new);
          }

          if (payload.eventType === "UPDATE") {
            handleOrderUpdate(payload.new);
          }
        }
      )
      .subscribe();
  };

  /* ---------------- Handlers ---------------- */
  const handleNewOrder = async (newOrder) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Re-fetch full order from your admin API
      const res = await fetch(
        `https://desitrend.store/api/admin/orders?id=${newOrder.id}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await res.json();

      if (result?.data) {
        setOrders((prev) => {
          const exists = prev.find((o) => o.id === result.data.id);
          if (exists) {
            return prev.map((o) => (o.id === result.data.id ? result.data : o));
          }
          return [result.data, ...prev];
        });
      }

      // 🔔 Notification ONLY for INSERT
      const canNotify =
        Constants.appOwnership !== "expo" && Constants.appOwnership !== "guest";

      if (canNotify) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🛒 New Order Received",
            body: `Order ${newOrder.order_code} placed`,
          },
          trigger: null,
        });
      }
    } catch (err) {
      console.error("New order handler error:", err);
    }
  };

  const handleOrderUpdate = async (updatedOrder) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // 🔁 Always refetch full order (with payments)
      const res = await fetch(
        `https://desitrend.store/api/admin/orders?id=${updatedOrder.id}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await res.json();

      if (result?.data) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === result.data.id ? result.data : order
          )
        );
      }
    } catch (err) {
      console.error("Order update refetch error:", err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  /* ---------------- UI ---------------- */
  const renderOrderItem = ({ item }) => {
    const amount = (item.amount_paise / 100).toFixed(2);
    const customer = item.shipping_address_snapshot;
    const paymentStatus = item.payments?.state || "N/A";

    return (
      <TouchableOpacity style={styles.card}>
        <View style={styles.row}>
          <View>
            <Text style={styles.orderId}>{item.order_code}</Text>
            <Text style={styles.customerName}>
              {customer?.first_name} {customer?.last_name}
            </Text>
          </View>

          <View style={styles.alignRight}>
            <Text style={styles.amount}>₹{amount}</Text>
            <Text style={[styles.statusBadge, getStatusStyle(item.status)]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <Text
            style={[
              styles.paymentStatus,
              { color: paymentStatus === "COMPLETED" ? "#22c55e" : "#ef4444" },
            ]}
          >
            ● {paymentStatus}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        extraData={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listPadding}
        refreshing={refreshing} // 👈 REQUIRED
        onRefresh={onRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listPadding: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  alignRight: { alignItems: "flex-end" },
  orderId: { fontSize: 16, fontWeight: "bold", color: "#1a1a1a" },
  customerName: { fontSize: 14, color: "#666", marginTop: 2 },
  amount: { fontSize: 18, fontWeight: "700", color: "#000" },
  statusBadge: {
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    overflow: "hidden",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f1f1f1",
    paddingTop: 12,
  },
  date: { fontSize: 12, color: "#999" },
  paymentStatus: { fontSize: 12, fontWeight: "600" },
});

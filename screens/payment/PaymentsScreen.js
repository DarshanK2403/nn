import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { supabase } from "../../lib/supabase";
// 1. IMPORT the hook
import { useNavigation } from "@react-navigation/native";

export default function PaymentScreen() {
  // 2. INITIALIZE navigation
  const navigation = useNavigation();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch(
        "https://desitrend.store/api/admin/payments",
        {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }
      );
      const result = await response.json();
      setPayments(result.data || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (state) => {
    switch (state?.toUpperCase()) {
      case "COMPLETED":
      case "SUCCESS":
        return { bg: "#dcfce7", text: "#166534" };
      case "PENDING":
        return { bg: "#fef9c3", text: "#854d0e" };
      case "FAILED":
        return { bg: "#fee2e2", text: "#991b1b" };
      default:
        return { bg: "#f3f4f6", text: "#374151" };
    }
  };

  const renderItem = ({ item }) => {
    const status = getStatusStyle(item.state);
    const amount = item.amount.toFixed(2);

    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("PaymentDetails", { paymentId: item.id })
        }
        activeOpacity={0.7}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.amount}>₹{amount}</Text>
            <View style={[styles.badge, { backgroundColor: status.bg }]}>
              <Text style={[styles.badgeText, { color: status.text }]}>
                {item.state || "UNKNOWN"}
              </Text>
            </View>
          </View>

          {/* This is the Order ID (for display only) */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Order:</Text>
            <Text style={styles.value}>{item.merchant_order_id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{item.user?.email || "N/A"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Txn ID:</Text>
            <Text style={styles.txnId}>{item.transaction_id || "N/A"}</Text>
          </View>

          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleString()}
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
        data={payments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listPadding}
        onRefresh={fetchPayments}
        refreshing={loading}
      />
    </View>
  );
}

// ... styles remain the same
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  centered: { flex: 1, justifyContent: "center" },
  listPadding: { padding: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: "#007AFF", // Vertical accent line
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  amount: { fontSize: 22, fontWeight: "bold", color: "#1a1a1a" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 },
  badgeText: { fontSize: 11, fontWeight: "bold" },
  infoRow: { flexDirection: "row", marginBottom: 4 },
  label: { width: 70, fontSize: 13, color: "#777", fontWeight: "600" },
  value: { flex: 1, fontSize: 13, color: "#333" },
  txnId: { flex: 1, fontSize: 12, color: "#007AFF", fontFamily: "monospace" },
  date: { fontSize: 11, color: "#bbb", marginTop: 8, textAlign: "right" },
});

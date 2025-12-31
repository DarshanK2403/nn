import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Share,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "@/lib/supabase";

export default function PaymentDetailsScreen({ route }) {
  const { paymentId } = route.params;
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    fetchDetails();
  }, [paymentId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(
        `https://desitrend.store/api/admin/payments/${paymentId}`,
        {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }
      );
      const result = await response.json();
      setPayment(result.data);
    } catch (error) {
      console.error("Error fetching payment details:", error);
    } finally {
      setLoading(false);
    }
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Payment Detail: ₹${(payment.amount / 100).toFixed(
          2
        )} | Status: ${payment.state} | Method: ${
          payment.payment_mode || "N/A"
        }`,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!payment) {
    return (
      <View style={styles.centered}>
        <Text>Payment details not found.</Text>
      </View>
    );
  }

  const statusColor =
    payment.state === "COMPLETED" || payment.state === "SUCCESS"
      ? "#22c55e"
      : "#ef4444";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Top Hero Section */}
      <View style={styles.header}>
        <Text style={styles.label}>Transaction Amount</Text>
        <Text style={styles.amount}>₹{(payment.amount / 100).toFixed(2)}</Text>
        <View
          style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {payment.state}
          </Text>
        </View>
      </View>

      {/* Transaction Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction Info</Text>
        <DetailRow
          label="Payment Mode"
          value={payment.payment_mode || "UPI / Online"}
        />
        <DetailRow label="Transaction ID" value={payment.transaction_id} />
        <DetailRow
          label="Merchant Order ID"
          value={payment.merchant_order_id}
        />
        <DetailRow
          label="Date & Time"
          value={new Date(payment.created_at).toLocaleString()}
        />
      </View>

      {/* User Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Details</Text>
        <DetailRow label="Email" value={payment.user?.email} />
        <DetailRow label="Username" value={payment.user?.username || "N/A"} />
        <DetailRow label="User ID" value={payment.user_id} />
      </View>

      {/* Share Button */}
      <TouchableOpacity style={styles.shareButton} onPress={onShare}>
        <Text style={styles.shareButtonText}>Share Transaction Info</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const DetailRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value || "N/A"}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    padding: 40,
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  label: { fontSize: 14, color: "#888", marginBottom: 5 },
  amount: {
    fontSize: 42,
    fontWeight: "800",
    color: "#000",
  },
  statusBadge: {
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { fontSize: 14, fontWeight: "bold", textTransform: "uppercase" },
  section: {
    padding: 20,
    backgroundColor: "#fff",
    marginTop: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#007AFF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  rowLabel: { color: "#666", fontSize: 14 },
  rowValue: {
    fontWeight: "600",
    color: "#333",
    fontSize: 14,
    flex: 1,
    textAlign: "right",
    marginLeft: 20,
  },
  shareButton: {
    margin: 20,
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  shareButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

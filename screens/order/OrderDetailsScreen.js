import { supabase } from "@/lib/supabase";
import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { Platform, ToastAndroid } from "react-native";
import CopyIcon from "@/components/icons/CopyIcon";

const COLORS = {
  primary: "#1E40AF", // royal blue – identifiers, section focus
  success: "#16A34A", // paid / completed
  warning: "#D97706", // pending
  danger: "#DC2626", // failed / cancelled / totals
  muted: "#6B7280", // labels
  text: "#111827", // default text
};

export function showToast(message) {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}

export default function OrderDetailsScreen({ route }) {
  const { order_code } = route.params;
  const [order, setOrder] = React.useState({});
  const insets = useSafeAreaInsets();
  const amount = (order?.amount_paise / 100).toFixed(2);
  const subtotal = (Number(order?.subtotal_paise) / 100).toFixed(2);
  const tax = Number(order?.tax_total_paise).toFixed(2);
  const shipping = Number(order?.shipping_amount).toFixed(2);
  const customer = order?.shipping_address_snapshot;
  const [openingReceipt, setOpeningReceipt] = React.useState(false);
  const items = order?.items?.items || [];
  const payment = order?.payments?.[0] || null;
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, []);
  const fetchOrderDetails = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(
        `http://192.168.0.166:3000/api/admin/orders/${order_code}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await res.json();
      setOrder(result.data);
    } catch (err) {
      console.error("Order details fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceiptUrl = async (orderCode) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const url = new URL(
        `http://192.168.0.166:3000/api/admin/orders/${orderCode}/invoice`
      );

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const result = await response.json();
      return result?.url || null;
    } catch (err) {
      console.error("Fetch receipt URL error:", err);
      return null;
    }
  };
  if (loading) {
    return (
      <View style={styles.loadingWrapper}>
        <View style={styles.skeletonCard}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonRow} />
          <View style={styles.skeletonRow} />
          <View style={styles.skeletonRowSmall} />
        </View>

        <View style={styles.skeletonSection}>
          <View style={styles.skeletonSectionTitle} />
          <View style={styles.skeletonRow} />
          <View style={styles.skeletonRow} />
        </View>

        <ActivityIndicator
          size="small"
          color={COLORS.primary}
          style={{ marginTop: 24 }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 10 }}
    >
      {/* ---------------- Order Info ---------------- */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order Info</Text>

        <Row
          label="Order Code"
          value={
            <View style={styles.orderCodeRow}>
              <Text style={styles.orderCodeText}>{order?.order_code}</Text>

              <TouchableOpacity
                onPress={async () => {
                  await Clipboard.setStringAsync(order?.order_code);
                  showToast("Order code copied");
                }}
                hitSlop={10}
                style={styles.copyBtn}
              >
                <CopyIcon />
              </TouchableOpacity>
            </View>
          }
        />

        <Row
          label="Status"
          value={
            <Text
              style={{
                fontWeight: "700",
                color:
                  order?.status === "CONFIRMED"
                    ? COLORS.success
                    : order?.status === "PENDING"
                    ? COLORS.warning
                    : COLORS.danger,
              }}
            >
              {order?.status}
            </Text>
          }
        />

        <Row
          label="Payment Status"
          value={
            <Text
              style={{
                fontWeight: "700",
                color:
                  payment?.state === "COMPLETED"
                    ? COLORS.success
                    : COLORS.danger,
              }}
            >
              {payment?.state || "N/A"}
            </Text>
          }
        />

        <Row
          label="Created At"
          value={new Date(order?.created_at).toLocaleString()}
        />

        {order?.receipt_path ? (
          <TouchableOpacity
            style={styles.receiptBtn}
            disabled={openingReceipt}
            onPress={async () => {
              try {
                setOpeningReceipt(true);
                const signedUrl = await fetchReceiptUrl(order?.order_code);
                if (signedUrl) await Linking.openURL(signedUrl);
              } catch (err) {
                console.error("Open receipt error:", err);
              } finally {
                setOpeningReceipt(false);
              }
            }}
          >
            {openingReceipt ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.receiptBtnText}>View Receipt</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ---------------- Customer ---------------- */}
      <Text style={styles.sectionTitle}>Customer</Text>
      <Row
        label="Name"
        value={`${customer?.first_name} ${customer?.last_name}`}
      />
      <Row label="Phone" value={customer?.phone} />
      <Row label="Email" value={order?.user?.email} />

      {/* ---------------- Shipping Address ---------------- */}
      <Text style={styles.sectionTitle}>Shipping Address</Text>
      <Text style={styles.text}>{customer?.address_line1}</Text>
      {customer?.address_line2 ? (
        <Text style={styles.text}>{customer?.address_line2}</Text>
      ) : null}
      <Text style={styles.text}>
        {customer?.city}, {customer?.state} - {customer?.pincode}
      </Text>

      {/* ---------------- Items ---------------- */}
      <Text style={styles.sectionTitle}>Items</Text>

      <View style={styles.table}>
        {/* Table Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.cell, styles.colName]}>Item</Text>
          <Text style={[styles.cell, styles.colQty]}>Qty</Text>
          <Text style={[styles.cell, styles.colPrice]}>Price</Text>
          <Text style={[styles.cell, styles.colTax]}>GST</Text>
          <Text style={[styles.cell, styles.colTotal]}>Total</Text>
        </View>

        {/* Table Rows */}
        {items.map((item, index) => {
          const qty = Number(item?.qty || 0);
          const price = Number(item?.unit_price || 0);
          const tax = Number(item?.tax_amount || 0);
          const total = qty * price + tax;
          const title = item?.variant?.product?.title || "N/A";
          return (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.cell, styles.colName]} numberOfLines={2}>
                {title}
              </Text>
              <Text style={[styles.cell, styles.colQty]}>{qty}</Text>
              <Text style={[styles.cell, styles.colPrice]}>₹{price}</Text>
              <Text style={[styles.cell, styles.colTax]}>₹{tax}</Text>
              <Text style={[styles.cell, styles.colTotal]}>₹{total}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.divider} />
      {/* ---------------- Price Summary ---------------- */}
      <Text style={styles.sectionTitle}>Price Summary</Text>
      <Row label="Subtotal" value={`₹${subtotal}`} />
      <Row label="GST" value={`₹${tax}`} />
      <Row label="Shipping" value={`${Number(shipping ?? 0)}`} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Payable</Text>
        <Text style={styles.totalValue}>₹{amount}</Text>
      </View>
      <View style={styles.divider} />
      {/* ---------------- Payment ---------------- */}
      <Text style={styles.paymentSectionTitle}>Payment</Text>

      <Row label="Payment Status" value={order?.payments?.state || "N/A"} />

      <Row
        label="Payment Mode"
        value={order?.payments?.payment_mode || "N/A"}
      />

      <Row
        label="Transaction ID"
        value={
          order?.payments?.transaction_id ? (
            <View style={styles.copyRow}>
              <Text
                style={styles.copyText}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {order.payments.transaction_id}
              </Text>

              <TouchableOpacity
                onPress={async () => {
                  await Clipboard.setStringAsync(order.payments.transaction_id);
                  showToast("Transaction ID copied");
                }}
                hitSlop={10}
                style={styles.copyBtn}
              >
                <CopyIcon />
              </TouchableOpacity>
            </View>
          ) : (
            "N/A"
          )
        }
      />

      <Row
        label="Paid Amount"
        value={
          <Text style={{ fontWeight: "800", color: COLORS.success }}>
            ₹{(Number(order?.payments?.amount) / 100).toFixed(2)}
          </Text>
        }
      />
    </ScrollView>
  );
}

/* ---------------- Reusable Row ---------------- */
function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 5,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  paymentSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 8,
    color: COLORS.primary,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: "#6B7280",
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  text: {
    fontSize: 13,
    color: "#111827",
    marginBottom: 4,
  },
  itemCard: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "710",
    marginBottom: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.danger,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },

  table: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableHeader: {
    backgroundColor: "#F3F4F6",
  },
  cell: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontSize: 12,
    color: "#374151", // slightly softer than pure black
  },

  colName: {
    flex: 4.0,
    fontWeight: "600",
  },

  colQty: {
    flex: 1.0,
    textAlign: "center",
  },
  colPrice: {
    flex: 1.0,
    textAlign: "right",
  },
  colTax: {
    flex: 1.0,
    textAlign: "right",
  },
  colTotal: {
    flex: 1.0,
    textAlign: "right",
    fontWeight: "700",
  },
  receiptBtn: {
    marginTop: 12,
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  receiptBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  copyBtn: {
    marginLeft: 8,
  },
  orderCodeRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8, // RN 0.71+ (or replace with marginLeft)
  },

  orderCodeText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  copyBtn: {
    padding: 2,
  },
  copyRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },

  copyText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },

  copyBtn: {
    marginLeft: 8,
    padding: 2,
  },
  loadingWrapper: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },

  skeletonCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  skeletonTitle: {
    height: 18,
    width: "60%",
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
    marginBottom: 12,
  },

  skeletonRow: {
    height: 14,
    width: "100%",
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
    marginBottom: 10,
  },

  skeletonRowSmall: {
    height: 14,
    width: "40%",
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
  },

  skeletonSection: {
    marginTop: 12,
  },

  skeletonSectionTitle: {
    height: 16,
    width: "30%",
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
    marginBottom: 10,
  },
});

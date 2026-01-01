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
import { supabase } from "../../lib/supabase";
import { useNavigation } from "@react-navigation/native";
import { TextInput } from "react-native";
import {
  Clock,
  FileText,
  CheckCircle,
  Loader,
  Box,
  Truck,
  MapPin,
  PackageCheck,
  XCircle,
  RotateCcw,
  Undo2,
  CreditCard,
  Calendar,
  User,
  Tag,
} from "lucide-react-native";

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

const OrderStatusIcon = ({ status, size = 16, color = "#374151" }) => {
  const props = { size, color, strokeWidth: 2 };

  switch (status) {
    case "PENDING":
      return <Clock {...props} />;

    case "PLACED":
      return <FileText {...props} />;

    case "CONFIRMED":
      return <CheckCircle {...props} />;

    case "PROCESSING":
      return <Loader {...props} />;

    case "PACKED":
      return <Box {...props} />;

    case "SHIPPED":
      return <Truck {...props} />;

    case "OUT_FOR_DELIVERY":
      return <MapPin {...props} />;

    case "DELIVERED":
      return <PackageCheck {...props} />;

    case "CANCELLED":
      return <XCircle {...props} />;

    case "RETURN_REQUESTED":
      return <RotateCcw {...props} />;

    case "RETURNED":
      return <Undo2 {...props} />;

    default:
      return null;
  }
};

const PaymentIcon = ({ status, size = 16 }) => {
  const color =
    status === "COMPLETED"
      ? "#166534"
      : status === "FAILED"
      ? "#991b1b"
      : "#92400e";

  return <CreditCard size={size} color={color} strokeWidth={2} />;
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const searchTimeout = useRef(null);

  useEffect(() => {
    fetchOrders();
    subscribeToOrders();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const fetchOrders = async (searchValue = "") => {
    try {
      if (!searchValue) setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const url = new URL("http://192.168.0.166:3000/api/admin/orders");

      if (searchValue) {
        url.searchParams.set("search", searchValue);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const result = await response.json();
      setOrders(result.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      if (!searchValue) setLoading(false);
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
        `http://192.168.0.166:3000/api/admin/orders?id=${newOrder.id}`,
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
        `http://192.168.0.166:3000/api/admin/orders?id=${updatedOrder.id}`,
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

  const renderOrderItem = ({ item }) => {
    const amount = (item.amount_paise / 100).toFixed(2);
    const customer = item.shipping_address_snapshot;
    const paymentStatus = item.payments?.state || "PENDING";

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() =>
          navigation.navigate("OrderDetails", {
            order_code: item.order_code,
          })
        }
      >
        {/* ROW 1 */}
        <View style={styles.topRow}>
          <View style={styles.orderCodeWrap}>
            <Tag size={16} color="#111827" strokeWidth={2} />
            <Text style={styles.orderCode}>{item.order_code}</Text>
          </View>
          <Text style={styles.amount}>₹{amount}</Text>
        </View>

        {/* ROW 2 */}
        <View style={styles.middleRow}>
          <View style={styles.customerWrap}>
            <User size={20} color="#374151" strokeWidth={2} />
            <Text style={styles.customer}>
              {customer?.first_name} {customer?.last_name}
            </Text>
          </View>

          <View style={[styles.statusPill, getStatusStyle(item.status)]}>
            <OrderStatusIcon status={item.status} />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        {/* ROW 3 */}
        <View style={styles.bottomRow}>
          <View style={styles.customerWrap}>
            <Calendar size={16} color="#6b7280" strokeWidth={2} />
            <Text style={styles.customer}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.paymentWrap}>
            <PaymentIcon status={paymentStatus} />
            <Text
              style={[
                styles.payment,
                paymentStatus === "COMPLETED"
                  ? styles.paymentSuccess
                  : styles.paymentPending,
              ]}
            >
              {paymentStatus}
            </Text>
          </View>
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
      <TextInput
        placeholder="Search order, amount, city, status…"
        value={search}
        onChangeText={(text) => {
          setSearch(text);

          if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
          }

          searchTimeout.current = setTimeout(() => {
            fetchOrders(text);
          }, 400);
        }}
        style={styles.searchInput}
      />
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
  container: {
    flex: 1,
    backgroundColor: "#f5f6f8",
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  listPadding: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  /* ROWS */
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  middleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f1f1",
  },

  /* TEXT */
  orderCode: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  amount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  customer: {
    fontSize: 13,
    color: "#374151",
  },

  date: {
    fontSize: 12,
    color: "#6b7280",
  },

  /* STATUS */
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },

  searchInput: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    margin: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    fontSize: 14,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f1f1",
  },

  paymentWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  payment: {
    fontSize: 12,
    fontWeight: "600",
  },

  paymentSuccess: {
    color: "#166534",
  },

  paymentPending: {
    color: "#92400e",
  },
  date: {
    fontSize: 12,
    color: "#6b7280",
  },
  customerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  customer: {
    fontSize: 13,
    color: "#374151",
  },
  orderCodeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  orderCode: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
});

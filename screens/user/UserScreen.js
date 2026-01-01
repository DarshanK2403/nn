import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import MoreIcon from "@/components/icons/MoreIcon";

export default function UserScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [menuUser, setMenuUser] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setError("");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch("http://192.168.0.166:3000/api/admin/user", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to load users");
      }

      setUsers(json.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading users…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 4 }]}>User</Text>
        <Text style={[styles.th, { flex: 1 }]}>Role</Text>
        <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>Action</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            {/* User */}
            <View style={{ flex: 4 }}>
              <Text style={styles.name}>{item.name || item.username}</Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>

            {/* Role */}
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.badge,
                  item.role === "admin" ? styles.adminBadge : styles.userBadge,
                ]}
              >
                {item.role.toUpperCase()}
              </Text>
            </View>

            {/* Remove */}
            <View
              style={{ flex: 1, alignItems: "flex-end" }}
              ref={(ref) => {
                if (ref) buttonRefs.current[item.id] = ref;
              }}
            >
              <TouchableOpacity
                style={styles.moreBtn}
                onPressIn={(e) => {
                  const { pageX, pageY } = e.nativeEvent;
                  setMenuPos({
                    x: pageX,
                    y: pageY,
                  });
                  setMenuUser(item);
                }}
              >
                <MoreIcon />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      {menuUser && (
        <>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setMenuUser(null)}
          />

          <View
            style={[
              styles.menu,
              {
                position: "absolute",
                top: menuPos.y,
                left: Math.max(8, menuPos.x - 230),
                top: Math.max(8, menuPos.y - 130),
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuUser(null);
                Alert.alert("User Profile", menuUser.email);
              }}
            >
              <Text style={styles.menuText}>View Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuUser(null);
                Alert.alert("Change Role", menuUser.email);
              }}
            >
              <Text style={styles.menuText}>
                {menuUser.role === "admin"
                  ? "Change to User"
                  : "Change to Admin"}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: "#475569",
  },
  error: {
    color: "#b91c1c",
    fontSize: 14,
    fontWeight: "600",
  },
  remove: {
    fontSize: 12,
    fontWeight: "600",
    color: "#b91c1c",
  },

  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingTop: 0,
  },

  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },

  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },

  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#e2e8f0",
  },

  th: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },

  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    alignItems: "center",
  },

  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },

  email: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },

  adminBadge: {
    backgroundColor: "#ede9fe",
    color: "#5b21b6",
  },

  userBadge: {
    backgroundColor: "#e0f2fe",
    color: "#075985",
  },
  moreBtn: {
    padding: 6,
    borderRadius: 6,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  menu: {
    width: 220,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 6,
    elevation: 6,
  },

  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  menuText: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "500",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#c1c1c150",
  },

  menu: {
    width: 200,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 6,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
});

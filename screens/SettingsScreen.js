import { View, Text, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";

export default function SettingsScreen() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings Management</Text>+
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 20, fontWeight: "600" },
  logoutBtn: {
    marginTop: 40,
    padding: 15,
    backgroundColor: "#ff3b30",
    borderRadius: 8,
  },
  logoutText: { color: "#fff", fontWeight: "bold" },
});

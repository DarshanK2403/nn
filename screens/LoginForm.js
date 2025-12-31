import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert("Login Failed", error.message);
    } else {
      Alert.alert("Success", "Welcome Admin!");
    }
    setLoading(false);
  }

  return (
    // This parent View centers the form
    <View style={styles.screenContainer}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.subtitle}>Secure Access Only</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Admin Email"
            value={email}
            onChangeText={(text) => setEmail(text)}
            autoCapitalize={"none"}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={(text) => setPassword(text)}
            secureTextEntry={true}
            autoCapitalize={"none"}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { backgroundColor: "#ccc" }]}
          onPress={() => signInWithEmail()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 1. New style to fill the whole screen and center content
  screenContainer: {
    flex: 1,
    justifyContent: "center", // Vertical center
    alignItems: "center", // Horizontal center
    backgroundColor: "#fff",
  },
  // 2. formContainer now just handles the width
  formContainer: {
    width: "90%",
    maxWidth: 400,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: { marginBottom: 20 },
  input: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

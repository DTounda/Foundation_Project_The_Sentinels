import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { login } from '../services/api';
import { ROUTES } from '../navigation/routes';
import { COLORS } from '../constants/colors';

// Email and password only. Creating an account is its own screen.
export default function LoginScreen({ navigation, route }) {
  const redirectTo = route?.params?.redirectTo || ROUTES.HOME;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigation.replace(ROUTES.TABS, { screen: redirectTo });
    } catch (e) {
      setError(e?.message || 'Could not log you in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log in</Text>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={submit}
      />

      <Pressable
        style={[styles.button, busy && styles.buttonBusy]}
        onPress={submit}
        disabled={busy}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{busy ? 'Please wait...' : 'Log in'}</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate(ROUTES.SIGN_UP, { redirectTo })}
        accessibilityRole="button"
      >
        <Text style={styles.link}>New here? Create an account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: COLORS.white },
  title: { fontSize: 23, fontWeight: '700', color: COLORS.ink, marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    padding: 11,
    marginBottom: 10,
    fontSize: 14,
    color: COLORS.ink,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonBusy: { opacity: 0.7 },
  buttonText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  link: { marginTop: 16, textAlign: 'center', color: COLORS.primary, fontSize: 13 },
  error: { color: COLORS.danger, marginBottom: 10, fontSize: 13 },
});

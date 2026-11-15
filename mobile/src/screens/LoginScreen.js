import React, { useState } from 'react';
import { ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { login } from '../services/api';
import { ROUTES } from '../navigation/routes';
import { Screen, Title, Body, Button, Field, Logo } from '../components/ui';
import { ErrorMessage } from '../components/LoadingAndError';
import { COLORS, FONTS } from '../constants/theme';

// Email and password only. Creating an account is its own screen.
export default function LoginScreen({ navigation, route }) {
  const redirectTo = route?.params?.redirectTo || ROUTES.HOME;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retryable, setRetryable] = useState(false);

  async function submit() {
    setError('');
    if (!email.trim() || !password) {
      setRetryable(false);
      setError('Please enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigation.replace(ROUTES.TABS, { screen: redirectTo });
    } catch (e) {
      setRetryable(!e?.status || e.status >= 500);
      setError(e?.message || 'Could not log you in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Logo size={52} />
        <Title size={28}>Welcome back</Title>
        <Body>Log in to see your allergies and medicines on every check.</Body>

        {!!error && <ErrorMessage message={error} onRetry={retryable ? submit : undefined} />}

        <Field
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Field
          label="Password"
          placeholder="Your password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={submit}
        />

        <Button title={busy ? 'Logging in...' : 'Log in'} busy={busy} onPress={submit} />

        <Pressable
          onPress={() => navigation.navigate(ROUTES.SIGN_UP, { redirectTo })}
          accessibilityRole="button"
          style={styles.link}
        >
          <Text style={styles.linkText}>
            New here? <Text style={styles.linkStrong}>Create an account</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 18 },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkText: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.slate },
  linkStrong: { fontFamily: FONTS.semibold, color: COLORS.primary },
});

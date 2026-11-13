import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { register, getIngredients, addAllergy } from '../services/api';
import { storeMedication } from '../services/profileStore';
import { ROUTES } from '../navigation/routes';
import { COLORS } from '../constants/colors';

// Step 1 creates the account, so step 2 can already save allergies.

const SEVERITIES = ['mild', 'moderate', 'severe'];

export default function SignUpScreen({ navigation, route }) {
  const redirectTo = route?.params?.redirectTo || ROUTES.HOME;

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Step 2
  const [query, setQuery] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [chosen, setChosen] = useState([]); // [{ id, name, severity }]
  const [medication, setMedication] = useState('');
  const [medications, setMedications] = useState([]);

  useEffect(() => {
    if (step !== 2) return;
    getIngredients(query).then(setIngredients).catch(() => setIngredients([]));
  }, [query, step]);

  async function onCreateAccount() {
    setError('');
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !password) {
      setError('Please fill in every field.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      setStep(2);
    } catch (e) {
      setError(e?.message || 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  }

  function toggleIngredient(item) {
    setChosen((prev) => {
      const found = prev.find((c) => c.id === item.id);
      if (found) return prev.filter((c) => c.id !== item.id);
      return [...prev, { id: item.id, name: item.name, severity: 'moderate' }];
    });
  }

  function setSeverity(id, severity) {
    setChosen((prev) => prev.map((c) => (c.id === id ? { ...c, severity } : c)));
  }

  function addMedicationToList() {
    const name = medication.trim();
    if (!name) return;
    setMedications((prev) => [...prev, name]);
    setMedication('');
  }

  async function onFinish() {
    setError('');
    setBusy(true);
    // One failed save should never block the rest, or strand the user here.
    for (const c of chosen) {
      try {
        await addAllergy(c.id, c.severity);
      } catch (e) {
        // already saved or failed, move on regardless
      }
    }
    for (const name of medications) {
      try {
        await storeMedication(name);
      } catch (e) {
        // keep going
      }
    }
    setBusy(false);
    navigation.replace(ROUTES.TABS, { screen: redirectTo });
  }

  if (step === 1) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.hint}>Step 1 of 2</Text>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TextInput style={styles.input} placeholder="First name" value={firstName} onChangeText={setFirstName} />
        <TextInput style={styles.input} placeholder="Last name" value={lastName} onChangeText={setLastName} />
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
          placeholder="Phone number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (at least 8 characters)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          style={[styles.button, busy && styles.buttonBusy]}
          onPress={onCreateAccount}
          disabled={busy}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>{busy ? 'Please wait...' : 'Continue'}</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate(ROUTES.LOGIN)} accessibilityRole="button">
          <Text style={styles.link}>Already have an account? Log in</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>A few health questions</Text>
      <Text style={styles.hint}>
        Step 2 of 2. You can skip this and add it later under My allergies.
      </Text>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.sectionTitle}>Are you allergic to any ingredient?</Text>
      <TextInput
        style={styles.input}
        placeholder="Search an ingredient, e.g. amox"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
      />
      <View style={styles.pickList}>
        {ingredients.length === 0 ? (
          <Text style={styles.empty}>No ingredients match.</Text>
        ) : (
          ingredients.slice(0, 8).map((item) => {
            const on = !!chosen.find((c) => c.id === item.id);
            return (
              <Pressable
                key={String(item.id)}
                onPress={() => toggleIngredient(item)}
                accessibilityRole="button"
                style={[styles.pickRow, on && styles.pickRowOn]}
              >
                <Text style={on ? styles.pickTextOn : styles.pickText}>{item.name}</Text>
              </Pressable>
            );
          })
        )}
      </View>

      {chosen.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>How bad is each one?</Text>
          {chosen.map((c) => (
            <View key={String(c.id)} style={styles.chosenRow}>
              <Text style={styles.chosenName}>{c.name}</Text>
              <View style={styles.chips}>
                {SEVERITIES.map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setSeverity(c.id, v)}
                    accessibilityRole="button"
                    style={[styles.chip, c.severity === v && styles.chipOn]}
                  >
                    <Text style={c.severity === v ? styles.chipTextOn : styles.chipText}>{v}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>What medicines are you taking at the moment?</Text>
      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, styles.addInput]}
          placeholder="e.g. Metformin"
          value={medication}
          onChangeText={setMedication}
          onSubmitEditing={addMedicationToList}
        />
        <Pressable style={styles.addButton} onPress={addMedicationToList} accessibilityRole="button">
          <Text style={styles.buttonText}>Add</Text>
        </Pressable>
      </View>
      {medications.length === 0 ? (
        <Text style={styles.empty}>Nothing added.</Text>
      ) : (
        medications.map((m, i) => (
          <Text key={`${m}-${i}`} style={styles.medItem}>
            {m}
          </Text>
        ))
      )}

      {busy ? (
        <ActivityIndicator style={styles.spinner} size="small" color="#0b7a54" />
      ) : (
        <Pressable style={styles.button} onPress={onFinish} accessibilityRole="button">
          <Text style={styles.buttonText}>Finish</Text>
        </Pressable>
      )}

      <Pressable
        onPress={() => navigation.replace(ROUTES.TABS, { screen: redirectTo })}
        accessibilityRole="button"
      >
        <Text style={styles.link}>Skip for now</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.ink },
  hint: { fontSize: 12, color: COLORS.slate, marginTop: 4, marginBottom: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: COLORS.ink, marginTop: 20, marginBottom: 8 },
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
    marginTop: 10,
  },
  buttonBusy: { opacity: 0.7 },
  buttonText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  link: { marginTop: 16, textAlign: 'center', color: COLORS.primary, fontSize: 13 },
  error: { color: COLORS.danger, marginBottom: 10, lineHeight: 18, fontSize: 13 },
  pickList: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 9, overflow: 'hidden' },
  pickRow: { padding: 11, borderBottomWidth: 1, borderColor: COLORS.border },
  pickRowOn: { backgroundColor: COLORS.primaryLight },
  pickText: { color: COLORS.slate, fontSize: 14 },
  pickTextOn: { color: COLORS.primaryDark, fontWeight: '600', fontSize: 14 },
  chosenRow: { marginBottom: 14 },
  chosenName: { fontSize: 14, color: COLORS.ink, marginBottom: 6 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 13,
  },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.slate, fontSize: 12 },
  chipTextOn: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  addInput: { flex: 1 },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 9,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  medItem: { paddingVertical: 8, color: COLORS.slate, fontSize: 14, borderBottomWidth: 1, borderColor: COLORS.border },
  empty: { color: COLORS.muted, fontStyle: 'italic', padding: 11, fontSize: 13 },
  spinner: { marginTop: 20 },
});

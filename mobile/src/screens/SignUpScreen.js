import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { register, getIngredients, addAllergy } from '../services/api';
import { storeMedication } from '../services/profileStore';
import { ROUTES } from '../navigation/routes';
import { Screen, Header, Title, Body, Button, Field, Card, Chip, Toggle, SectionTitle, Notice } from '../components/ui';
import Icon from '../components/Icon';
import { COLORS, FONTS } from '../constants/theme';

// Step 1 creates the account, so step 2 can already save allergies.

const SEVERITIES = ['mild', 'moderate', 'severe'];

function Progress({ step }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.progress}>
        <View style={[styles.bar, styles.barOn]} />
        <View style={[styles.bar, step === 2 && styles.barOn]} />
      </View>
      <Text style={styles.stepText}>
        Step {step} of 2 · {step === 1 ? 'Your details' : 'Your health'}
      </Text>
    </View>
  );
}

export default function SignUpScreen({ navigation, route }) {
  const redirectTo = route?.params?.redirectTo || ROUTES.HOME;

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

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
      <Screen>
        <Header title="Create account" onBack={navigation.canGoBack() ? navigation.goBack : null} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Progress step={1} />
          {!!error && <Notice text={error} tone="error" />}
          <View style={styles.twoCols}>
            <Field label="First name" placeholder="Aline" value={firstName} onChangeText={setFirstName} style={{ flex: 1 }} />
            <Field label="Last name" placeholder="Uwase" value={lastName} onChangeText={setLastName} style={{ flex: 1 }} />
          </View>
          <Field
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field label="Phone number" placeholder="+250 7XX XXX XXX" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          <Field
            label="Password"
            placeholder="At least 8 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Card style={styles.privacy}>
            <Icon name="lock" size={20} color={COLORS.primary} />
            <Body size={14} style={{ flex: 1 }}>Next, you can add your allergies. Only you can see them.</Body>
          </Card>
          <Button title={busy ? 'Please wait...' : 'Continue'} busy={busy} onPress={onCreateAccount} />
          <Pressable onPress={() => navigation.navigate(ROUTES.LOGIN)} accessibilityRole="button" style={styles.link}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkStrong}>Log in</Text></Text>
          </Pressable>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Your health" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Progress step={2} />
        <Title size={24}>A few health questions</Title>
        <Body size={14}>You can skip this and add it later under Allergies and Profile.</Body>
        {!!error && <Notice text={error} tone="error" />}

        <Card>
          <SectionTitle>Are you allergic to any ingredient?</SectionTitle>
          <Field icon="search" placeholder="Search an ingredient, e.g. amox" autoCapitalize="none" value={query} onChangeText={setQuery} />
          <View style={styles.wrap}>
            {ingredients.length === 0 ? (
              <Body size={13} color={COLORS.muted}>No ingredients match.</Body>
            ) : (
              ingredients.slice(0, 10).map((item) => (
                <Toggle
                  key={item.id}
                  label={item.name}
                  on={chosen.some((c) => c.id === item.id)}
                  onPress={() => toggleIngredient(item)}
                />
              ))
            )}
          </View>
        </Card>

        {chosen.length > 0 && (
          <Card>
            <SectionTitle>How bad is each one?</SectionTitle>
            {chosen.map((c) => (
              <View key={c.id} style={{ gap: 8 }}>
                <Text style={styles.allergyName}>{c.name}</Text>
                <View style={styles.wrap}>
                  {SEVERITIES.map((sev) => (
                    <Toggle key={sev} label={sev[0].toUpperCase() + sev.slice(1)} on={c.severity === sev} onPress={() => setSeverity(c.id, sev)} />
                  ))}
                </View>
              </View>
            ))}
          </Card>
        )}

        <Card>
          <SectionTitle>Medicines you take now</SectionTitle>
          <View style={styles.addRow}>
            <Field
              placeholder="e.g. Metformin"
              value={medication}
              onChangeText={setMedication}
              onSubmitEditing={addMedicationToList}
              style={{ flex: 1 }}
            />
            <Button title="Add" onPress={addMedicationToList} style={{ paddingHorizontal: 18 }} />
          </View>
          {medications.length > 0 && (
            <View style={styles.wrap}>
              {medications.map((m, i) => (
                <Chip key={`${m}-${i}`} label={m} icon="pill" color={COLORS.primaryDark} background={COLORS.primarySoft} />
              ))}
            </View>
          )}
        </Card>

        <Button title={busy ? 'Saving...' : 'Finish'} busy={busy} onPress={onFinish} />
        <Button title="Skip for now" kind="ghost" onPress={() => navigation.replace(ROUTES.TABS, { screen: redirectTo })} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingTop: 8, gap: 16 },
  progress: { flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  barOn: { backgroundColor: COLORS.primary },
  stepText: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.muted },
  twoCols: { flexDirection: 'row', gap: 12 },
  privacy: { flexDirection: 'row', alignItems: 'flex-start', padding: 14 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  allergyName: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.ink },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkText: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.slate },
  linkStrong: { fontFamily: FONTS.semibold, color: COLORS.primary },
});

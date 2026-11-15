import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Linking, StyleSheet } from 'react-native';
import { searchMedicines, submitReport } from '../services/api';
import { Screen, Header, Title, Body, Button, Field, Toggle, Chip } from '../components/ui';
import { LoadingIndicator, ErrorMessage } from '../components/LoadingAndError';
import Icon from '../components/Icon';
import { COLORS, FONTS } from '../constants/theme';

const REASONS = ['Broken seal', 'Spelling errors on pack', 'Different colour or shape', 'Price far too low', 'Other'];

function FdaLine() {
  return (
    <Text style={styles.fda}>
      You can also report directly to Rwanda FDA: toll-free{' '}
      <Text style={styles.fdaLink} accessibilityRole="link" onPress={() => Linking.openURL('tel:9707')}>9707</Text>
    </Text>
  );
}

export default function ReportScreen({ route, navigation }) {
  const params = route?.params || {};
  const preselected = params.medicineId ? { id: params.medicineId, name: params.medicineName } : null;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [medicine, setMedicine] = useState(preselected);
  const [productName, setProductName] = useState(!params.medicineId && params.medicineName ? params.medicineName : '');
  const [reasons, setReasons] = useState([]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [retry, setRetry] = useState('');

  function toggleReason(r) {
    setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  }

  async function onSearch() {
    setError('');
    setRetry('');
    if (query.trim().length < 2) return setError('Type at least 2 characters to search.');
    try {
      setSearching(true);
      const r = await searchMedicines(query.trim());
      setResults(r.map((x) => x.medicine).filter(Boolean));
    } catch (e) {
      setError(e.message);
      setRetry('search');
    } finally {
      setSearching(false);
    }
  }

  async function submit() {
    setError('');
    setRetry('');
    if (!medicine && !productName.trim()) {
      return setError('Pick a medicine from the search, or type the product name.');
    }
    // Chosen reasons go first, so the reviewer sees them at a glance.
    const details = [reasons.length ? `Reasons: ${reasons.join(', ')}.` : '', description.trim()].filter(Boolean).join(' ');
    const text = medicine ? details : `Product: ${productName.trim()}. ${details}`;
    if (details.length < 5 || text.length > 1000) {
      return setError('Choose a reason or describe what looks suspicious.');
    }
    setLoading(true);
    try {
      await submitReport({
        medicineId: medicine ? medicine.id : undefined,
        description: text,
        location: location.trim() || undefined,
      });
      setDone(true);
    } catch (e) {
      setError(e.message);
      setRetry('submit');
    } finally {
      setLoading(false);
    }
  }

  function startOver() {
    setMedicine(null); setResults([]); setQuery(''); setProductName('');
    setReasons([]); setDescription(''); setLocation(''); setDone(false);
  }

  if (done) {
    return (
      <Screen>
        <Header title="Report a product" onBack={navigation.goBack} />
        <View style={styles.done}>
          <View style={styles.doneIcon}>
            <Icon name="checkCircle" size={40} color={COLORS.success} />
          </View>
          <Title size={24} style={{ textAlign: 'center' }}>Report sent</Title>
          <Body style={{ textAlign: 'center' }}>Thank you. Your report will be reviewed.</Body>
          <Button title="Send another report" kind="ghost" onPress={startOver} style={{ alignSelf: 'stretch' }} />
          <FdaLine />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Report a product" onBack={navigation.goBack} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Body size={14}>Something looks wrong with a pack? Tell us. MediCheck cannot confirm whether a product is fake.</Body>

        {medicine ? (
          <View style={styles.selected}>
            <Icon name="pill" size={20} color={COLORS.success} />
            <Text style={styles.selectedText}>{medicine.name}</Text>
            <Pressable onPress={() => setMedicine(null)} accessibilityRole="button" style={styles.change}>
              <Text style={styles.changeText}>Change</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <View style={styles.searchRow}>
              <Field
                label="Find it in our records"
                icon="search"
                placeholder="Search the medicine name"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={onSearch}
                style={{ flex: 1 }}
              />
              <Button title="Search" kind="soft" onPress={onSearch} style={{ paddingHorizontal: 14 }} />
            </View>
            {searching && <LoadingIndicator text="Searching..." />}
            {results.length > 0 && (
              <View style={styles.wrap}>
                {results.slice(0, 8).map((m) => (
                  <Toggle key={m.id} label={m.name} on={false} onPress={() => setMedicine(m)} />
                ))}
              </View>
            )}
            <Field
              label="Or type the product name"
              icon="pill"
              placeholder="Name on the pack"
              value={productName}
              onChangeText={setProductName}
            />
          </View>
        )}

        <View style={{ gap: 8 }}>
          <Text style={styles.label}>What looks suspicious?</Text>
          <View style={styles.wrap}>
            {REASONS.map((r) => (
              <Toggle key={r} label={r} on={reasons.includes(r)} onPress={() => toggleReason(r)} />
            ))}
          </View>
        </View>

        <Field
          label="Tell us more"
          placeholder="e.g. the foil was already opened"
          multiline
          value={description}
          onChangeText={setDescription}
        />
        <Field
          label="Where did you get it? (optional)"
          icon="pin"
          placeholder="e.g. Kimironko market"
          value={location}
          onChangeText={setLocation}
        />

        {!!error && (
          <ErrorMessage message={error} onRetry={retry === 'search' ? onSearch : retry === 'submit' ? submit : undefined} />
        )}
        <Button title={loading ? 'Sending...' : 'Send report'} icon={loading ? undefined : 'flag'} busy={loading} onPress={submit} />
        <FdaLine />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 8, gap: 16 },
  label: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.slate },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  selected: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14,
    backgroundColor: COLORS.successBg,
  },
  selectedText: { flex: 1, fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.ink },
  change: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  changeText: { fontFamily: FONTS.bold, color: COLORS.success, fontSize: 14 },
  done: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 14 },
  doneIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.successBg,
    alignItems: 'center', justifyContent: 'center',
  },
  fda: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, textAlign: 'center' },
  fdaLink: { fontFamily: FONTS.bold, color: COLORS.primary, textDecorationLine: 'underline' },
});

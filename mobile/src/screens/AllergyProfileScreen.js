import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { getIngredients, getAllergies, addAllergy, deleteAllergy, hasToken } from '../services/api';
import { ROUTES } from '../navigation/routes';
import { Screen, Title, Body, Button, Card, Field, Toggle, Chip, SectionTitle, Notice } from '../components/ui';
import { LoadingIndicator, ErrorMessage } from '../components/LoadingAndError';
import Icon from '../components/Icon';
import { COLORS, FONTS } from '../constants/theme';

const SEVERITIES = ['mild', 'moderate', 'severe'];

const SEVERITY_STYLE = {
  mild: { color: COLORS.primaryDark, background: COLORS.primarySoft },
  moderate: { color: COLORS.warning, background: COLORS.warningBg },
  severe: { color: COLORS.danger, background: COLORS.dangerBg },
};

const cap = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);

export default function AllergyProfileScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [severity, setSeverity] = useState('moderate');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [adding, setAdding] = useState(false);

  function handleError(e) {
    if (e.code === 'UNAUTHORIZED') navigation.navigate(ROUTES.LOGIN, { redirectTo: ROUTES.ALLERGY_PROFILE });
    else setError(e.message);
  }

  async function loadAllergies() {
    setLoading(true);
    setLoadError('');
    try {
      setAllergies(await getAllergies());
    } catch (e) {
      if (e.code === 'UNAUTHORIZED') handleError(e);
      else setLoadError(e.message || 'Could not load your allergies.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    hasToken().then((ok) => {
      if (!ok) navigation.navigate(ROUTES.LOGIN, { redirectTo: ROUTES.ALLERGY_PROFILE });
      else loadAllergies();
    });
  }, []);

  useEffect(() => {
    getIngredients(query).then(setIngredients).catch(handleError);
  }, [query]);

  async function onAdd() {
    if (!selected) return setError('Choose an ingredient first.');
    setError('');
    setAdding(true);
    try {
      await addAllergy(selected.id, severity);
      setSelected(null);
      setQuery('');
      await loadAllergies();
    } catch (e) {
      handleError(e);
    } finally {
      setAdding(false);
    }
  }

  async function onDelete(id) {
    try {
      await deleteAllergy(id);
      await loadAllergies();
    } catch (e) {
      handleError(e);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 4 }}>
          <Title size={26}>My allergies</Title>
          <Body size={14}>We check every medicine against these.</Body>
        </View>

        <Card style={{ padding: 16 }}>
          <SectionTitle>Add an allergy</SectionTitle>
          <Field icon="search" placeholder="Find an ingredient, e.g. amox" autoCapitalize="none" value={query} onChangeText={setQuery} />
          <View style={styles.wrap}>
            {ingredients.slice(0, 8).map((item) => (
              <Toggle key={item.id} label={item.name} on={selected?.id === item.id} onPress={() => setSelected(item)} />
            ))}
          </View>
          <Text style={styles.label}>How bad is it?</Text>
          <View style={styles.segment} accessibilityRole="radiogroup">
            {SEVERITIES.map((sev) => {
              const on = severity === sev;
              return (
                <Pressable
                  key={sev}
                  onPress={() => setSeverity(sev)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  style={[styles.segBtn, on && styles.segBtnOn]}
                >
                  <Text style={[styles.segText, on && styles.segTextOn]}>{cap(sev)}</Text>
                </Pressable>
              );
            })}
          </View>
          {!!error && <Notice text={error} tone="error" />}
          <Button title={adding ? 'Adding...' : 'Add allergy'} busy={adding} onPress={onAdd} />
        </Card>

        <SectionTitle>Saved</SectionTitle>
        {loading && <LoadingIndicator text="Loading your allergies..." />}
        {!!loadError && <ErrorMessage message={loadError} onRetry={loadAllergies} />}
        {!loading && !loadError && allergies.length === 0 && (
          <Body size={14} color={COLORS.muted}>No allergies saved yet.</Body>
        )}
        {allergies.map((item) => {
          const st = SEVERITY_STYLE[item.severity] || SEVERITY_STYLE.mild;
          return (
            <View key={String(item.id)} style={styles.saved}>
              <View style={[styles.savedIcon, { backgroundColor: st.background }]}>
                <Icon name="allergy" size={20} color={st.color} />
              </View>
              <Text style={styles.savedName}>{item.ingredient}</Text>
              <Chip label={cap(item.severity)} color={st.color} background={st.background} />
              <Pressable
                onPress={() => onDelete(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.ingredient}`}
                style={styles.remove}
              >
                <Icon name="trash" size={20} color={COLORS.muted} />
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 12, gap: 14 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  label: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.slate },
  segment: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 12, backgroundColor: COLORS.neutralBg },
  segBtn: { flex: 1, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segBtnOn: { backgroundColor: COLORS.white },
  segText: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.muted },
  segTextOn: { color: COLORS.ink },
  saved: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16,
  },
  savedIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  savedName: { flex: 1, fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.ink },
  remove: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});

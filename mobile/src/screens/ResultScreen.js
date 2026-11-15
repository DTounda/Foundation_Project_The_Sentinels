import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, Linking, ActivityIndicator, StyleSheet } from 'react-native';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { normalizeResult } from '../utils/normalizeResult';
import { getMedicineDetails, checkInteractions, getAllergies, hasToken } from '../services/api';
import { loadMedications, loadContacts } from '../services/profileStore';
import { DOSAGE_NOTICE } from '../constants/safetyText';
import { ROUTES } from '../navigation/routes';
import { Screen, Header, Title, Body, Button, Card, Chip, StatusHero, SafetyRow, SectionTitle, Notice } from '../components/ui';
import { ErrorMessage } from '../components/LoadingAndError';
import Icon from '../components/Icon';
import { COLORS, FONTS } from '../constants/theme';

// Severity comes from the backend (DDInter): Major or Moderate.
const LEVEL = {
  Major: { color: COLORS.danger, background: COLORS.dangerBg },
  Moderate: { color: COLORS.warning, background: '#FFE9B0' },
};

function sortBySeverity(list) {
  return [...list].sort((a, b) => (a.level === 'Major' ? 0 : 1) - (b.level === 'Major' ? 0 : 1));
}

function describeInteraction({ ingredient, withIngredient, withMedicationName }) {
  if (!ingredient || !withIngredient) {
    return `May interact with ${withMedicationName}, which you listed under your medicines.`;
  }
  const sameName = withIngredient.toLowerCase() === String(withMedicationName).toLowerCase();
  const other = sameName ? withIngredient : `${withIngredient} (in ${withMedicationName})`;
  return `${ingredient} in this medicine and ${other}, which you listed under your medicines, may interact.`;
}

const NEXT_STEPS = [
  ['Check the spelling', 'Try the generic name too, like “paracetamol” instead of a brand.'],
  ['Ask your pharmacist', 'They can check the pack and its batch number.'],
  ['Report it', 'If the pack looks wrong, tell us so it can be reviewed.'],
];

export default function ResultScreen({ route, navigation }) {
  const result = normalizeResult(route.params?.result);
  const medicineId = result?.medicineId ?? null;

  const [ingredients, setIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [ingredientsError, setIngredientsError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [interactions, setInteractions] = useState([]);
  const [allergyCount, setAllergyCount] = useState(null);
  const [medCount, setMedCount] = useState(null);
  const [pharmacy, setPharmacy] = useState(null);

  // Hooks run on every render, so this sits above the early return.
  useEffect(() => {
    if (!medicineId) return undefined;
    let cancelled = false;
    setLoadingIngredients(true);
    setIngredientsError(false);
    getMedicineDetails(medicineId)
      .then((data) => !cancelled && setIngredients(data.ingredients))
      .catch(() => !cancelled && (setIngredients([]), setIngredientsError(true)))
      .finally(() => !cancelled && setLoadingIngredients(false));
    return () => {
      cancelled = true;
    };
  }, [medicineId, reloadKey]);

  useEffect(() => {
    if (!medicineId) return undefined;
    let cancelled = false;
    (async () => {
      if (!(await hasToken())) return;
      const [found, allergies, meds, contacts] = await Promise.all([
        checkInteractions(medicineId),
        getAllergies().catch(() => null),
        loadMedications().catch(() => null),
        loadContacts().catch(() => null),
      ]);
      if (cancelled) return;
      setInteractions(sortBySeverity(found));
      setAllergyCount(allergies ? allergies.length : null);
      setMedCount(meds ? meds.data.length : null);
      setPharmacy(contacts?.data?.pharmacy?.phone ? contacts.data.pharmacy : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [medicineId]);

  const back = () => navigation.navigate(ROUTES.TABS, { screen: ROUTES.HOME });

  if (!result) {
    return (
      <Screen>
        <Header title="Result" onBack={navigation.goBack} />
        <View style={styles.empty}>
          <Body style={{ textAlign: 'center' }}>No result to show yet. Go back and search for a medicine.</Body>
          <Button title="Back to search" kind="ghost" icon="search" onPress={back} />
        </View>
        <DisclaimerBanner />
      </Screen>
    );
  }

  const report = () =>
    navigation.navigate(ROUTES.REPORT, { medicineId: result.medicineId, medicineName: result.medicineName });

  // Not found: explain it is not a verdict, then give next steps.
  if (result.status === 'not_found') {
    return (
      <Screen>
        <Header title="Result" onBack={navigation.goBack} />
        <ScrollView contentContainerStyle={styles.content}>
          {result.medicineName ? <Title size={22}>“{result.medicineName}”</Title> : null}
          <StatusHero status="not_found" message={result.message} />
          <Notice text="This does not mean the medicine is fake. It may be spelled differently, or not be on the Rwanda FDA list." />
          <Card style={{ gap: 14 }}>
            <SectionTitle>What you can do</SectionTitle>
            {NEXT_STEPS.map(([title, text], i) => (
              <View key={title} style={styles.step}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.stepTitle}>{title}</Text>
                  <Body size={13}>{text}</Body>
                </View>
              </View>
            ))}
          </Card>
          <View style={styles.actions}>
            <Button title="Search again" kind="ghost" icon="search" onPress={back} style={{ flex: 1 }} />
            <Button title="Report" icon="flag" onPress={report} style={{ flex: 1 }} />
          </View>
        </ScrollView>
        <DisclaimerBanner />
      </Screen>
    );
  }

  const alerts = result.allergyAlerts;
  const verified = result.status === 'verified';

  let allergyRow;
  if (!result.ingredientsKnown) allergyRow = ['Ingredient list not available', 'na'];
  else if (alerts.length > 0) allergyRow = ['Contains an ingredient you listed', 'bad'];
  else if (allergyCount === 0) allergyRow = ['No allergies saved yet', 'na'];
  else allergyRow = [allergyCount ? `No match with your ${allergyCount} allerg${allergyCount === 1 ? 'y' : 'ies'}` : 'No match found', 'ok'];

  let medRow;
  if (interactions.length > 0) {
    const major = interactions.some((i) => i.level === 'Major');
    medRow = [`${interactions.length} possible interaction${interactions.length === 1 ? '' : 's'}`, major ? 'bad' : 'warn'];
  } else if (medCount === 0) medRow = ['No medicines listed on your profile', 'na'];
  else medRow = ['No known interaction', 'ok'];

  const hasWarning = alerts.length > 0 || interactions.length > 0;
  const subtitle = ingredients.map((i) => i.name).join(', ');

  return (
    <Screen>
      <Header title="Result" onBack={navigation.goBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ gap: 4 }}>
          {result.medicineName ? <Title size={22}>{result.medicineName}</Title> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <StatusHero status={result.status} message={result.message} />

        <Card style={{ gap: 0, paddingVertical: 12 }}>
          <SectionTitle style={{ marginBottom: 4 }}>Your safety check</SectionTitle>
          <SafetyRow first icon="shieldCheck" label="Rwanda FDA list" value={verified ? 'Registered' : 'Could not confirm'} state={verified ? 'ok' : 'warn'} />
          <SafetyRow icon="allergy" label="Your allergies" value={allergyRow[0]} state={allergyRow[1]} />
          <SafetyRow icon="interact" label="Medicines you take" value={medRow[0]} state={medRow[1]} />
          {!result.ingredientsKnown && result.ingredientsNote ? (
            <Notice text={result.ingredientsNote} tone="warn" style={{ marginTop: 8 }} />
          ) : null}
        </Card>

        {alerts.length > 0 && (
          <View style={[styles.warnCard, { backgroundColor: COLORS.dangerBg, borderColor: COLORS.dangerBorder }]} testID="allergy-alerts">
            <View style={styles.warnHead}>
              <Icon name="alert" size={20} color={COLORS.danger} />
              <Text style={[styles.warnTitle, { color: COLORS.danger }]}>Allergy</Text>
            </View>
            {alerts.map((a) => (
              <View key={`${a.ingredient}-${a.severity}`} style={{ gap: 6 }}>
                {a.severity ? <Chip label={a.severity[0].toUpperCase() + a.severity.slice(1)} color={COLORS.danger} background={COLORS.white} /> : null}
                <Text style={[styles.warnText, { color: '#7A1A12' }]}>
                  Contains <Text style={{ fontFamily: FONTS.bold }}>{a.ingredient}</Text>, which you listed as an allergy.
                </Text>
              </View>
            ))}
          </View>
        )}

        {interactions.length > 0 && (
          <View style={[styles.warnCard, { backgroundColor: COLORS.warningBg, borderColor: COLORS.warningBorder }]} testID="interaction-alerts">
            <View style={styles.warnHead}>
              <Icon name="interact" size={20} color={COLORS.warning} />
              <Text style={[styles.warnTitle, { color: COLORS.warning }]}>Possible interactions</Text>
            </View>
            {interactions.map((item) => {
              const lv = LEVEL[item.level] ?? LEVEL.Moderate;
              return (
                <View key={`${item.withMedicationName}-${item.ingredient}-${item.withIngredient}`} style={{ gap: 6 }}>
                  <Chip label={item.level || 'Moderate'} color={lv.color} background={lv.background} />
                  <Text style={[styles.warnText, { color: '#5C3A00' }]}>{describeInteraction(item)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {hasWarning && (
          <>
            <Text style={styles.talk}>Talk to your doctor or pharmacist before using this medicine.</Text>
            {pharmacy ? (
              <Button
                title={`Call my pharmacy · ${pharmacy.name}`}
                icon="phone"
                onPress={() => Linking.openURL(`tel:${String(pharmacy.phone).replace(/\s+/g, '')}`).catch(() => {})}
              />
            ) : null}
          </>
        )}

        {medicineId ? (
          <Card style={{ padding: 16, gap: 8 }} testID="ingredients">
            <View style={styles.insideHead}>
              <Icon name="pill" size={22} color={COLORS.primary} />
              <Text style={styles.insideTitle}>What’s inside</Text>
            </View>
            {loadingIngredients ? (
              <ActivityIndicator size="small" color={COLORS.slate} />
            ) : ingredientsError ? (
              <ErrorMessage message="Could not load the ingredients." onRetry={() => setReloadKey((k) => k + 1)} />
            ) : ingredients.length > 0 ? (
              <View style={styles.wrap}>
                {ingredients.map((ing) => (
                  <Chip
                    key={ing.id ?? ing.name}
                    label={ing.strength ? `${ing.name} · ${ing.strength}` : ing.name}
                    color={COLORS.ink}
                    background={COLORS.surface}
                  />
                ))}
              </View>
            ) : (
              <Body size={13} color={COLORS.muted}>No ingredient information for this product.</Body>
            )}
          </Card>
        ) : null}

        <Body size={13}>{DOSAGE_NOTICE}</Body>

        <View style={styles.actions}>
          <Button title="Report" kind="ghost" icon="flag" onPress={report} style={{ flex: 1 }} />
          <Button
            title="Pharmacies"
            kind="soft"
            icon="pin"
            onPress={() => navigation.navigate(ROUTES.TABS, { screen: ROUTES.PHARMACIES })}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
      <DisclaimerBanner />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 8, gap: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  subtitle: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted },
  warnCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 10 },
  warnHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  warnTitle: { fontFamily: FONTS.heading, fontSize: 16 },
  warnText: { fontFamily: FONTS.regular, fontSize: 15, lineHeight: 22 },
  talk: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.ink },
  insideHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  insideTitle: { fontFamily: FONTS.heading, fontSize: 15, color: COLORS.ink },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actions: { flexDirection: 'row', gap: 10 },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.primaryDark },
  stepTitle: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.ink },
});

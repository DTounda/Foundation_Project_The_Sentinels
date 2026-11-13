import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { STATUS_STYLES, FALLBACK_STATUS } from '../constants/statusStyles';
import { normalizeResult } from '../utils/normalizeResult';
import { getMedicineDetails, checkInteractions } from '../services/api';
import { DOSAGE_NOTICE } from '../constants/safetyText';
import { ROUTES } from '../navigation/routes';
import { COLORS } from '../constants/colors';

/**
 * Result screen (see the "Result" frame in the MediCheck Figma).
 * Receives route.params.result from the Search/Scan screen.
 * "Report this product" opens the Report screen with { medicineId, medicineName } as params.
 */
export default function ResultScreen({ route, navigation }) {
  const result = normalizeResult(route.params?.result);
  const medicineId = result?.medicineId ?? null;

  const [ingredients, setIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [interactions, setInteractions] = useState([]);

  // Hooks run on every render, so this sits above the early return.
  useEffect(() => {
    if (!medicineId) {
      setIngredients([]);
      setInteractions([]);
      return undefined;
    }

    let cancelled = false;
    setLoadingIngredients(true);

    getMedicineDetails(medicineId)
      .then((data) => {
        if (!cancelled) setIngredients(data.ingredients);
      })
      .catch(() => {
        // Never let a failed ingredient load break the verdict.
        if (!cancelled) setIngredients([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingIngredients(false);
      });

    // Empty until the backend's interaction check exists.
    checkInteractions(medicineId).then((found) => {
      if (!cancelled) setInteractions(found);
    });

    // Stops a late answer updating a screen the user left.
    return () => {
      cancelled = true;
    };
  }, [medicineId]);

  if (!result) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No result to show yet. Go back and search for a medicine.</Text>
          <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate(ROUTES.TABS, { screen: ROUTES.HOME })} accessibilityRole="button">
            <Text style={styles.secondaryButtonText}>Back to search</Text>
          </Pressable>
        </View>
        <DisclaimerBanner />
      </View>
    );
  }

  const known = STATUS_STYLES[result.status];
  const style = known ?? { ...FALLBACK_STATUS, label: String(result.status) };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {result.medicineName ? <Text style={styles.medicineName}>{result.medicineName}</Text> : null}

        <View
          style={[styles.statusCard, { backgroundColor: style.background, borderColor: style.color }]}
          accessible
          accessibilityLabel={`Status: ${style.label}. ${result.message}`}
          testID="status-card"
        >
          <Text style={[styles.statusLabel, { color: style.color }]}>{style.label}</Text>
          <Text style={styles.message}>{result.message}</Text>
        </View>

        {result.allergyAlerts.length > 0 && (
          <View style={styles.alertsCard} testID="allergy-alerts">
            {result.allergyAlerts.map((alert) => (
              <Text key={`${alert.ingredient}-${alert.severity}`} style={styles.alertText}>
                Contains {alert.ingredient}, which you listed as an allergy
                {alert.severity ? ` (${alert.severity})` : ''}. Talk to your doctor or pharmacist before use.
              </Text>
            ))}
          </View>
        )}

        {/* Same slot as allergy alerts, for clashes with current medicines. */}
        {interactions.length > 0 && (
          <View style={styles.interactionsCard} testID="interaction-alerts">
            {interactions.map((item) => (
              <Text key={item.withMedicationName} style={styles.interactionText}>
                May interact with {item.withMedicationName}, which you listed under your medicines.
                Talk to your doctor or pharmacist before use.
              </Text>
            ))}
          </View>
        )}

        {medicineId ? (
          <View style={styles.ingredientsCard} testID="ingredients">
            <Text style={styles.ingredientsTitle}>What is in this medicine</Text>

            {loadingIngredients ? (
              <ActivityIndicator size="small" color={COLORS.slate} />
            ) : ingredients.length > 0 ? (
              ingredients.map((ingredient) => (
                <Text key={ingredient.id ?? ingredient.name} style={styles.ingredientText}>
                  {ingredient.name}
                  {ingredient.strength ? ` · ${ingredient.strength}` : ''}
                </Text>
              ))
            ) : (
              <Text style={styles.ingredientsEmpty}>
                No ingredient information for this product.
              </Text>
            )}
          </View>
        ) : null}

        {/* Shown on every result, including Verified. */}
        <View style={styles.dosageCard}>
          <Text style={styles.dosageText}>{DOSAGE_NOTICE}</Text>
        </View>

        <Pressable
          style={styles.secondaryButton}
          accessibilityRole="button"
          onPress={() => navigation.navigate('Report', { medicineId: result.medicineId, medicineName: result.medicineName })}
        >
          <Text style={styles.secondaryButtonText}>Report this product</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} accessibilityRole="button" onPress={() => navigation.navigate(ROUTES.TABS, { screen: ROUTES.HOME })}>
          <Text style={styles.secondaryButtonText}>Back to search</Text>
        </Pressable>
      </ScrollView>
      <DisclaimerBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 20, gap: 14 },
  medicineName: { fontSize: 21, fontWeight: '700', color: COLORS.ink },
  statusCard: { borderWidth: 1.5, borderRadius: 14, padding: 18, gap: 6 },
  statusLabel: { fontSize: 23, fontWeight: '700' },
  message: { fontSize: 15, color: COLORS.slate, lineHeight: 21 },
  alertsCard: {
    borderWidth: 1,
    borderColor: '#F3C9C4',
    backgroundColor: COLORS.dangerBg,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  alertText: { fontSize: 14, color: '#7A2E24', lineHeight: 20 },
  interactionsCard: {
    borderWidth: 1,
    borderColor: '#F0D8A8',
    backgroundColor: COLORS.warningBg,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  interactionText: { fontSize: 14, color: '#7A5A10', lineHeight: 20 },
  ingredientsCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  ingredientsTitle: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
  ingredientText: { fontSize: 14, color: COLORS.slate, lineHeight: 20 },
  ingredientsEmpty: { fontSize: 13, color: COLORS.muted, fontStyle: 'italic' },
  dosageCard: {
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
    padding: 13,
  },
  dosageText: { fontSize: 13, color: COLORS.primaryDark, lineHeight: 19 },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.ink },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  emptyText: { fontSize: 15, color: COLORS.slate, textAlign: 'center' },
});

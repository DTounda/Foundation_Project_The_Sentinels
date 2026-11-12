import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { STATUS_STYLES, FALLBACK_STATUS } from '../constants/statusStyles';
import { normalizeResult } from '../utils/normalizeResult';
import { getMedicineDetails } from '../services/api';

/**
 * Result screen (see the "Result" frame in the MediCheck Figma).
 * Receives route.params.result from the Search/Scan screen.
 * "Report this product" opens the Report screen with { medicineId, medicineName } as params.
 *
 * When the product is in our records we also load its ingredients from
 * GET /medicines/:id, so the user can see what is actually in the medicine.
 */
export default function ResultScreen({ route, navigation }) {
  const result = normalizeResult(route.params?.result);
  const medicineId = result?.medicineId ?? null;

  const [ingredients, setIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  // Hooks must run on every render, so this sits above the early return below.
  useEffect(() => {
    if (!medicineId) {
      setIngredients([]);
      return undefined;
    }

    let cancelled = false;
    setLoadingIngredients(true);

    getMedicineDetails(medicineId)
      .then((data) => {
        if (!cancelled) setIngredients(data.ingredients);
      })
      .catch(() => {
        // The verdict above is the part that matters. If the ingredient list
        // cannot be loaded we leave it out rather than failing the whole screen.
        if (!cancelled) setIngredients([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingIngredients(false);
      });

    // Stops a late answer from updating a screen the user already left.
    return () => {
      cancelled = true;
    };
  }, [medicineId]);

  if (!result) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No result to show yet. Go back and search for a medicine.</Text>
          <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('SearchScan')} accessibilityRole="button">
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

        {medicineId ? (
          <View style={styles.ingredientsCard} testID="ingredients">
            <Text style={styles.ingredientsTitle}>What is in this medicine</Text>

            {loadingIngredients ? (
              <ActivityIndicator size="small" color="#475467" />
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

        <Pressable
          style={styles.secondaryButton}
          accessibilityRole="button"
          onPress={() => navigation.navigate('Report', { medicineId: result.medicineId, medicineName: result.medicineName })}
        >
          <Text style={styles.secondaryButtonText}>Report this product</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} accessibilityRole="button" onPress={() => navigation.navigate('SearchScan')}>
          <Text style={styles.secondaryButtonText}>Back to search</Text>
        </Pressable>
      </ScrollView>
      <DisclaimerBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 20, gap: 16 },
  medicineName: { fontSize: 22, fontWeight: '700', color: '#101828' },
  statusCard: { borderWidth: 2, borderRadius: 12, padding: 20, gap: 8 },
  statusLabel: { fontSize: 26, fontWeight: '800' },
  message: { fontSize: 16, color: '#344054', lineHeight: 22 },
  alertsCard: { borderWidth: 1, borderColor: '#F5C2C0', backgroundColor: '#FFF6F5', borderRadius: 12, padding: 16, gap: 10 },
  alertText: { fontSize: 15, color: '#7A271A', lineHeight: 21 },
  ingredientsCard: {
    borderWidth: 1,
    borderColor: '#E4E7EC',
    backgroundColor: '#FCFCFD',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  ingredientsTitle: { fontSize: 15, fontWeight: '700', color: '#101828' },
  ingredientText: { fontSize: 15, color: '#344054', lineHeight: 21 },
  ingredientsEmpty: { fontSize: 14, color: '#667085', fontStyle: 'italic' },
  secondaryButton: {
    backgroundColor: '#F2F4F7',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '600', color: '#101828' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  emptyText: { fontSize: 16, color: '#475467', textAlign: 'center' },
});

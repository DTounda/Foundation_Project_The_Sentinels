import React from 'react';
import { View, ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { STATUS_STYLES, FALLBACK_STATUS } from '../constants/statusStyles';
import { normalizeResult } from '../utils/normalizeResult';

/**
 * Result screen (see the "Result" frame in the MediCheck Figma).
 * Receives route.params.result from the Search/Scan screen.
 * "Report this product" opens the Report screen with { medicineId, medicineName } as params.
 */
export default function ResultScreen({ route, navigation }) {
  const result = normalizeResult(route.params?.result);

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

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const DISCLAIMER_TEXT =
  'MediCheck gives information only. It does not replace advice from your doctor or pharmacist.';

/** Shown on every result screen. Never remove it and never add instructions to take or stop a medicine. */
export default function DisclaimerBanner() {
  return (
    <View style={styles.banner} testID="disclaimer-banner" accessibilityRole="summary">
      <Text style={styles.text}>{DISCLAIMER_TEXT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#EEF4FF',
    borderTopWidth: 1,
    borderTopColor: '#C7D7FE',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  text: { fontSize: 14, color: '#1D3A8A', textAlign: 'center' },
});

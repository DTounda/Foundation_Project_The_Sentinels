import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from './Icon';
import { COLORS, FONTS } from '../constants/theme';

export const DISCLAIMER_TEXT =
  'MediCheck gives information only. It does not replace advice from your doctor or pharmacist.';

/** Shown on every result screen. Never remove it and never add instructions to take or stop a medicine. */
export default function DisclaimerBanner() {
  return (
    <View style={styles.banner} testID="disclaimer-banner" accessibilityRole="summary">
      <Icon name="info" size={18} color={COLORS.primaryDark} />
      <Text style={styles.text}>{DISCLAIMER_TEXT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: COLORS.primarySoft, paddingVertical: 14, paddingHorizontal: 20,
  },
  text: { flex: 1, fontFamily: FONTS.regular, fontSize: 13, lineHeight: 19, color: COLORS.primaryDark },
});

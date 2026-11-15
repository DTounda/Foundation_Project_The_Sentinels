import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import Icon from './Icon';
import { COLORS, FONTS } from '../constants/theme';

// Shared loading and error pieces for every screen that calls the API.

export function LoadingIndicator({ text = 'Loading...' }) {
  return (
    <View style={styles.loading} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  );
}

export function ErrorMessage({ message, onRetry }) {
  if (!message) return null;
  return (
    <View style={styles.errorBox} accessibilityLiveRegion="polite">
      <View style={styles.errorRow}>
        <Icon name="info" size={18} color={COLORS.primaryDark} />
        <Text style={styles.errorText}>{message}</Text>
      </View>
      {onRetry ? (
        <Pressable style={styles.retryButton} accessibilityRole="button" onPress={onRetry}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', padding: 16, gap: 8 },
  loadingText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.slate },
  errorBox: { backgroundColor: COLORS.primarySoft, borderRadius: 14, padding: 14, gap: 10 },
  errorRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  errorText: { flex: 1, fontFamily: FONTS.regular, color: COLORS.primaryDark, fontSize: 14, lineHeight: 20 },
  retryButton: { backgroundColor: COLORS.primary, borderRadius: 10, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  retryText: { fontFamily: FONTS.semibold, color: COLORS.white, fontSize: 15 },
});

import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';

// Shared loading and error pieces for every screen that calls the API.
// Colours follow the MediCheck style guide (blue 1565C0, light blue box, no red).

export function LoadingIndicator({ text = 'Loading...' }) {
  return (
    <View style={styles.loading} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color="#1565C0" />
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  );
}

export function ErrorMessage({ message, onRetry }) {
  if (!message) return null;
  return (
    <View style={styles.errorBox} accessibilityLiveRegion="polite">
      <Text style={styles.errorText}>{message}</Text>
      {onRetry ? (
        <Pressable style={styles.retryButton} accessibilityRole="button" onPress={onRetry}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', padding: 16 },
  loadingText: { marginTop: 8, fontSize: 14, color: '#212121' },
  errorBox: { backgroundColor: '#E3F2FD', borderRadius: 8, padding: 14, marginTop: 8 },
  errorText: { color: '#212121', fontSize: 15, textAlign: 'center' },
  retryButton: {
    backgroundColor: '#1565C0',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  retryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
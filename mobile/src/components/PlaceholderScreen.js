import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Temporary screen body used until the owner of a screen replaces it.
 * Each teammate edits only their own screen file in src/screens.
 */
export default function PlaceholderScreen({ title, owner, children }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Placeholder. Owner: {owner}</Text>
      <View style={styles.actions}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#FFFFFF' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#475467', marginBottom: 24 },
  actions: { gap: 12 },
});

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Linking,
  Alert,
  StyleSheet,
} from 'react-native';
import directory from '../data/pharmacies.json';
import { COLORS } from '../constants/colors';

// Reference data, so it ships in src/data/pharmacies.json, not the API.

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pharmacy', label: 'Pharmacies' },
  { key: 'hospital', label: 'Hospitals' },
];

export default function PharmaciesScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const entries = Array.isArray(directory?.entries) ? directory.entries : [];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (filter !== 'all' && e.type !== filter) return false;
      if (!q) return true;
      return [e.name, e.district, e.address]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    });
  }, [entries, query, filter]);

  async function call(phone) {
    if (!phone) return;
    const url = `tel:${String(phone).replace(/\s+/g, '')}`;
    const supported = await Linking.canOpenURL(url).catch(() => false);
    if (!supported) {
      // Expo web has no dialler, so show the number.
      Alert.alert('Phone number', phone);
      return;
    }
    Linking.openURL(url).catch(() => Alert.alert('Phone number', phone));
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search by name, district or area"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
      />

      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              accessibilityRole="button"
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id ?? item.name)}
        contentContainerStyle={visible.length === 0 && styles.emptyWrap}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {entries.length === 0
              ? 'No directory data loaded yet.'
              : 'Nothing matches that search.'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {[item.type === 'hospital' ? 'Hospital' : 'Pharmacy', item.district, item.address]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            {item.phone ? (
              <Pressable
                onPress={() => call(item.phone)}
                accessibilityRole="button"
                style={styles.callButton}
              >
                <Text style={styles.callText}>Call {item.phone}</Text>
              </Pressable>
            ) : (
              <Text style={styles.noPhone}>No phone number listed</Text>
            )}
          </View>
        )}
      />

      {directory?.source ? (
        <Text style={styles.source} numberOfLines={2}>
          Source: {directory.source}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: COLORS.white },
  search: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    padding: 11,
    fontSize: 14,
    color: COLORS.ink,
  },
  filters: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 14 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 13,
  },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.slate, fontSize: 13 },
  chipTextOn: { color: COLORS.white, fontWeight: '600' },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 13,
    marginBottom: 10,
    gap: 5,
  },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
  meta: { fontSize: 13, color: COLORS.slate },
  callButton: {
    marginTop: 4,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  callText: { color: COLORS.primaryDark, fontWeight: '600', fontSize: 13 },
  noPhone: { fontSize: 12, color: COLORS.muted, fontStyle: 'italic' },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  empty: { textAlign: 'center', color: COLORS.slate },
  source: { fontSize: 11, color: COLORS.muted, paddingTop: 8 },
});

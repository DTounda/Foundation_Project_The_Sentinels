import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, Linking, Alert, StyleSheet } from 'react-native';
import directory from '../data/pharmacies.json';
import { Screen, Title, Body, Field, Toggle } from '../components/ui';
import Icon from '../components/Icon';
import { COLORS, FONTS } from '../constants/theme';

// Reference data, so it ships in src/data/pharmacies.json, not the API.

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pharmacy', label: 'Pharmacies' },
  { key: 'hospital', label: 'Hospitals' },
];

// The pilot area comes first, so people see it without searching.
const PRIORITY_DISTRICTS = ['Kimironko', 'Gasabo'];

// Kimironko is a sector, so it appears in the address, not the district.
function priorityRank(entry) {
  const place = `${entry.district || ''} ${entry.address || ''}`.toLowerCase();
  const idx = PRIORITY_DISTRICTS.findIndex((d) => place.includes(d.toLowerCase()));
  return idx === -1 ? PRIORITY_DISTRICTS.length : idx;
}

const TYPE_LABEL = { pharmacy: 'Pharmacy', hospital: 'Hospital', clinic: 'Clinic' };

export default function PharmaciesScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const rawEntries = Array.isArray(directory?.entries) ? directory.entries : [];

  // Stable sort: priority districts first, everything else keeps its order.
  const entries = useMemo(
    () => [...rawEntries].sort((a, b) => priorityRank(a) - priorityRank(b)),
    [rawEntries],
  );

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

  function renderItem({ item }) {
    const isPharmacy = item.type === 'pharmacy';
    return (
      <View style={styles.card}>
        <View style={[styles.icon, { backgroundColor: isPharmacy ? COLORS.successBg : COLORS.primarySoft }]}>
          <Icon name={isPharmacy ? 'store' : 'hospital'} size={22} color={isPharmacy ? COLORS.success : COLORS.primary} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta} numberOfLines={2}>
            {[TYPE_LABEL[item.type] || 'Health facility', item.district, item.address].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {item.phone ? (
          <Pressable
            onPress={() => call(item.phone)}
            accessibilityRole="button"
            accessibilityLabel={`Call ${item.name}`}
            style={styles.call}
          >
            <Icon name="phone" size={20} color={COLORS.white} />
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <Screen>
      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id ?? item.name)}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={15}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 4 }}>
            <View style={{ gap: 4 }}>
              <Title size={26}>Pharmacies</Title>
              <Body size={14}>Kimironko and Gasabo first.</Body>
            </View>
            <Field
              icon="search"
              placeholder="Search by name, district or area"
              autoCapitalize="none"
              value={query}
              onChangeText={setQuery}
            />
            <View style={styles.filters}>
              {FILTERS.map((f) => (
                <Toggle key={f.key} label={f.label} on={filter === f.key} onPress={() => setFilter(f.key)} />
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <Body size={14} color={COLORS.muted} style={{ textAlign: 'center', marginTop: 24 }}>
            {entries.length === 0 ? 'No directory data loaded yet.' : 'Nothing matches that search.'}
          </Body>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 12, gap: 10 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16,
  },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.ink },
  meta: { fontFamily: FONTS.regular, fontSize: 12, lineHeight: 17, color: COLORS.muted },
  call: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});

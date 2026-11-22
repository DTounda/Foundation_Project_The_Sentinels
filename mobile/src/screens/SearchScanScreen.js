import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getStoredUser, getAllergies, hasToken } from '../services/api';
import { loadMedications } from '../services/profileStore';
import { ROUTES } from '../navigation/routes';
import { Screen, Title, Card, SectionTitle, StatusChip, Body } from '../components/ui';
import Icon from '../components/Icon';
import { COLORS, FONTS } from '../constants/theme';

const LEGEND = [
  ['verified', 'On the Rwanda FDA list of authorised medicines.'],
  ['unconfirmed', 'On the list, but its registration has expired.'],
  ['not_found', 'No record. Check the spelling or ask your pharmacist.'],
];

function initials(name) {
  return (name || '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
}

// Home: photo or search, plus a quick look at the user's safety profile.

export default function SearchScanScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [counts, setCounts] = useState({ allergies: null, medicines: null });

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const stored = await getStoredUser();
        if (!cancelled) setUser(stored);
        if (!(await hasToken())) return;
        const [allergies, meds] = await Promise.all([
          getAllergies().catch(() => null),
          loadMedications().catch(() => null),
        ]);
        if (!cancelled) {
          setCounts({ allergies: allergies ? allergies.length : null, medicines: meds ? meds.data.length : null });
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  // Validates the query and navigates to the search results.
  function handleSearch() {
    const text = query.trim();
    if (text.length < 2) {
      setError('Please type at least 2 characters.');
      return;
    }
    setError('');
    navigation.navigate(ROUTES.SEARCH_RESULTS, { query: text });
  }

  const firstName = (user?.fullName || '').split(' ')[0];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.top}>
          <View>
            <Text style={styles.hello}>Muraho,</Text>
            <Title size={26}>{firstName || 'welcome'}</Title>
          </View>
          <Pressable
            onPress={() => navigation.navigate(ROUTES.PROFILE)}
            accessibilityRole="button"
            accessibilityLabel="Open your profile"
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initials(user?.fullName)}</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroRing} />
          <Text style={styles.heroTitle}>Is this medicine{'\n'}safe to trust?</Text>
          <Pressable
            onPress={() => navigation.navigate(ROUTES.PHOTO_VERIFY)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.photoBtn, pressed && { opacity: 0.9 }]}
          >
            <View style={styles.photoIcon}>
              <Icon name="camera" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.photoTitle}>Take a photo of the box</Text>
              <Text style={styles.photoSub}>We read the name for you</Text>
            </View>
            <Icon name="chevron" size={20} color={COLORS.muted} />
          </Pressable>
          <View style={styles.searchWrap}>
            <View style={styles.searchIcon}>
              <Icon name="search" size={20} color="#C9D8F2" />
            </View>
            <TextInput
              style={styles.search}
              placeholder="Or search by name, e.g. ibuprofen"
              placeholderTextColor="#C9D8F2"
              accessibilityLabel="Search medicine by name"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          {!!error && <Text style={styles.heroError}>{error}</Text>}
        </View>

        <View style={styles.tiles}>
          <Pressable style={styles.tile} accessibilityRole="button" onPress={() => navigation.navigate(ROUTES.ALLERGY_PROFILE)}>
            <Icon name="allergy" size={24} color={COLORS.danger} />
            <Text style={styles.tileNum}>{counts.allergies ?? '–'}</Text>
            <Text style={styles.tileLabel}>Allergies saved</Text>
          </Pressable>
          <Pressable style={styles.tile} accessibilityRole="button" onPress={() => navigation.navigate(ROUTES.PROFILE)}>
            <Icon name="pill" size={24} color={COLORS.primary} />
            <Text style={styles.tileNum}>{counts.medicines ?? '–'}</Text>
            <Text style={styles.tileLabel}>Medicines I take</Text>
          </Pressable>
        </View>

        <Card style={{ gap: 10, padding: 16 }}>
          <SectionTitle>What the colours mean</SectionTitle>
          {LEGEND.map(([status, text]) => (
            <View key={status} style={styles.legendRow}>
              <StatusChip status={status} />
              <Body size={13} style={{ flex: 1 }}>{text}</Body>
            </View>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 12, gap: 16 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hello: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: FONTS.bold, color: COLORS.primaryDark, fontSize: 15 },
  hero: { borderRadius: 26, backgroundColor: COLORS.primaryDark, padding: 20, gap: 14, overflow: 'hidden' },
  heroRing: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100, right: -70, top: -70,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
  },
  heroTitle: { fontFamily: FONTS.display, fontSize: 21, lineHeight: 27, color: COLORS.white },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: COLORS.white },
  photoIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  photoTitle: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.ink },
  photoSub: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted },
  searchWrap: { justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: 14, zIndex: 1 },
  search: {
    height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.1)', paddingLeft: 44, paddingRight: 14,
    fontFamily: FONTS.regular, fontSize: 15, color: COLORS.white,
  },
  heroError: { fontFamily: FONTS.medium, fontSize: 13, color: '#FFE3A1' },
  tiles: { flexDirection: 'row', gap: 12 },
  tile: {
    flex: 1, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 18, padding: 14, gap: 8,
  },
  tileNum: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.ink },
  tileLabel: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.slate },
  legendRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
});

import React, { useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { verifyPhoto, verifyMedicine } from '../services/api';
import { ROUTES } from '../navigation/routes';
import { Screen, Header, Button, Notice, Body } from '../components/ui';
import DisclaimerBanner from '../components/DisclaimerBanner';
import Icon from '../components/Icon';
import { COLORS, FONTS } from '../constants/theme';

// Two backend calls, never one: candidates first, then the user's own pick.
const UNREADABLE_MESSAGE = "We couldn't read that clearly. Try again with better light, or search by name instead.";

const TIPS = [
  ['sun', 'Good light'],
  ['frame', 'Name inside frame'],
  ['hand', 'Hold still'],
];

// Words, not percentages, so a score never reads as a guarantee.
function strength(confidence = 0) {
  if (confidence >= 0.85) return { label: 'Strong match', bars: 4, color: COLORS.success };
  if (confidence >= 0.7) return { label: 'Possible', bars: 2, color: COLORS.warning };
  return { label: 'Weak', bars: 1, color: COLORS.neutral };
}

function Bars({ n, color }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[styles.bar, { backgroundColor: i < n ? color : COLORS.border }]} />
      ))}
    </View>
  );
}

export default function PhotoVerifyScreen({ navigation }) {
  const [photoUri, setPhotoUri] = useState(null);
  const [busy, setBusy] = useState(false);
  const [busyText, setBusyText] = useState('');
  const [error, setError] = useState('');
  const [candidates, setCandidates] = useState(null);
  const [offerSearch, setOfferSearch] = useState(false);

  function reset() {
    setPhotoUri(null);
    setBusy(false);
    setError('');
    setCandidates(null);
    setOfferSearch(false);
  }

  function goSearch() {
    navigation.navigate(ROUTES.TABS, { screen: ROUTES.HOME });
  }

  async function takePhoto() {
    setError('');
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera access is needed to take a photo of the medicine.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 1, base64: false });
    if (result.canceled || !result.assets?.[0]) return;
    await processAndUpload(result.assets[0].uri);
  }

  async function processAndUpload(uri) {
    setBusy(true);
    setOfferSearch(false);
    setBusyText('Preparing photo...');
    setCandidates(null);
    try {
      // Resize, and convert to JPEG: iPhones default to HEIC, which OCR can't read.
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      setPhotoUri(manipulated.uri);
      setBusyText('Reading the label...');
      const data = await verifyPhoto(manipulated.base64);
      const found = Array.isArray(data?.candidates) ? data.candidates : [];
      if (found.length === 0) {
        setError(UNREADABLE_MESSAGE);
        setOfferSearch(true);
      } else {
        setCandidates(found);
      }
    } catch (e) {
      if (e?.status === 503) {
        setError(e.message || 'Photo reading is unavailable right now. Please search by name.');
        setOfferSearch(true);
      } else if (e?.status === 422) {
        setError(UNREADABLE_MESSAGE);
        setOfferSearch(true);
      } else {
        setError(e?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
      setBusyText('');
    }
  }

  async function confirmCandidate(medicineId) {
    setBusy(true);
    setBusyText('Checking this medicine...');
    setError('');
    try {
      const result = await verifyMedicine(medicineId);
      navigation.replace(ROUTES.RESULT, { result });
    } catch (e) {
      setError(e?.message || 'Could not confirm this medicine. Please try again.');
      setBusy(false);
      setBusyText('');
    }
  }

  // Step 2: matches or an error, on a light screen.
  if (!busy && (candidates || (photoUri && error))) {
    return (
      <Screen>
        <Header title={candidates ? 'Which one is it?' : 'Verify by photo'} onBack={navigation.goBack} />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.summary}>
            {photoUri ? <Image source={{ uri: photoUri }} style={styles.thumb} accessibilityLabel="Your photo" /> : null}
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.summaryTitle}>
                {candidates ? `${candidates.length} possible match${candidates.length === 1 ? '' : 'es'}` : 'No match yet'}
              </Text>
              <Body size={13}>Only pick one if the name matches your pack exactly.</Body>
            </View>
          </View>

          {!!error && <Notice text={error} tone="warn" />}

          {candidates?.map((c) => {
            const st = strength(c.confidence);
            return (
              <Pressable
                key={c.medicineId}
                onPress={() => confirmCandidate(c.medicineId)}
                accessibilityRole="button"
                accessibilityLabel={`${c.name}, ${st.label}`}
                style={({ pressed }) => [styles.candidate, pressed && { opacity: 0.85 }]}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.candidateName}>{c.name}</Text>
                  {c.manufacturer ? <Text style={styles.candidateMeta}>{c.manufacturer}</Text> : null}
                  <View style={styles.strengthRow}>
                    <Bars n={st.bars} color={st.color} />
                    <Text style={[styles.strengthText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>
                <Icon name="chevron" size={20} color={COLORS.muted} />
              </Pressable>
            );
          })}

          {(candidates || offerSearch) && (
            <Pressable onPress={goSearch} accessibilityRole="button" style={styles.none}>
              <Icon name="search" size={22} color={COLORS.primaryDark} />
              <View style={{ flex: 1 }}>
                <Text style={styles.noneTitle}>{candidates ? 'None of these match my pack' : 'Search by name instead'}</Text>
                {candidates ? <Text style={styles.noneSub}>Search by name instead</Text> : null}
              </View>
            </Pressable>
          )}

          <Button title="Retake photo" kind="ghost" icon="camera" onPress={() => { reset(); takePhoto(); }} />
        </ScrollView>
        <DisclaimerBanner />
      </Screen>
    );
  }

  // Step 1: the dark camera screen.
  return (
    <Screen dark>
      <Header title="Verify by photo" onBack={navigation.goBack} dark />
      <ScrollView contentContainerStyle={styles.darkContent}>
        <View style={styles.viewfinder}>
          {photoUri ? <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} /> : null}
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
          {busy ? (
            <View style={styles.busyBox}>
              <ActivityIndicator size="large" color={COLORS.white} />
              <Text style={styles.busyText}>{busyText}</Text>
            </View>
          ) : (
            <Icon name="camera" size={44} color={COLORS.nightText} />
          )}
        </View>

        <Text style={styles.darkTitle}>Point at the medicine’s name</Text>
        <View style={styles.tips}>
          {TIPS.map(([icon, text]) => (
            <View key={text} style={styles.tip}>
              <Icon name={icon} size={16} color={COLORS.white} />
              <Text style={styles.tipText}>{text}</Text>
            </View>
          ))}
        </View>

        {!!error && !photoUri && <Notice text={error} tone="warn" />}

        <Pressable
          onPress={takePhoto}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          style={[styles.shutter, busy && { opacity: 0.5 }]}
        >
          <View style={styles.shutterInner} />
        </Pressable>

        <Text style={styles.consent}>
          Your photo is sent to a cloud text-reading service to identify the medicine, and is not stored afterwards.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const C = 38;
const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 8, gap: 12 },
  darkContent: { padding: 28, paddingTop: 12, gap: 22, alignItems: 'center' },
  viewfinder: {
    width: 290, height: 290, borderRadius: 28, backgroundColor: COLORS.nightCard,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  corner: { position: 'absolute', width: C, height: C, borderColor: COLORS.sun },
  tl: { left: 0, top: 0, borderLeftWidth: 4, borderTopWidth: 4, borderTopLeftRadius: 28 },
  tr: { right: 0, top: 0, borderRightWidth: 4, borderTopWidth: 4, borderTopRightRadius: 28 },
  bl: { left: 0, bottom: 0, borderLeftWidth: 4, borderBottomWidth: 4, borderBottomLeftRadius: 28 },
  br: { right: 0, bottom: 0, borderRightWidth: 4, borderBottomWidth: 4, borderBottomRightRadius: 28 },
  busyBox: { alignItems: 'center', gap: 10, backgroundColor: 'rgba(11,23,48,0.7)', padding: 16, borderRadius: 16 },
  busyText: { fontFamily: FONTS.semibold, color: COLORS.white, fontSize: 14 },
  darkTitle: { fontFamily: FONTS.heading, fontSize: 20, color: COLORS.white, textAlign: 'center' },
  tips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  tip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)',
  },
  tipText: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.white },
  shutter: {
    width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.white },
  consent: { fontFamily: FONTS.regular, fontSize: 12, lineHeight: 18, color: COLORS.nightText, textAlign: 'center' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  thumb: { width: 72, height: 72, borderRadius: 16, backgroundColor: COLORS.nightCard },
  summaryTitle: { fontFamily: FONTS.heading, fontSize: 17, color: COLORS.ink },
  candidate: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16,
  },
  candidateName: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.ink },
  candidateMeta: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  strengthText: { fontFamily: FONTS.bold, fontSize: 12 },
  bar: { width: 6, height: 14, borderRadius: 2 },
  none: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft,
  },
  noneTitle: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.primaryDark },
  noneSub: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.primaryDark },
});

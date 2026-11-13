import React, { useState } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { verifyPhoto, verifyMedicine } from '../services/api';
import { COLORS } from '../constants/colors';

// Two backend calls, never one. verifyPhoto returns up to 5 ranked candidates
// and is never treated as a verdict by itself; the user has to pick one, then
// verifyMedicine confirms that single pick and returns the real result.
const UNREADABLE_MESSAGE = "We couldn't read that clearly. Try again with better light, or search by name instead.";

export default function PhotoVerifyScreen({ navigation }) {
  const [photoUri, setPhotoUri] = useState(null);
  const [busy, setBusy] = useState(false);
  const [busyText, setBusyText] = useState('');
  const [error, setError] = useState('');
  const [candidates, setCandidates] = useState(null);

  function reset() {
    setPhotoUri(null);
    setBusy(false);
    setError('');
    setCandidates(null);
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
    setBusyText('Preparing photo...');
    setCandidates(null);
    try {
      // Resize to ~1024px wide, convert to JPEG (iPhones default to HEIC,
      // which the OCR service can't read), compress to keep the upload fast.
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
      } else {
        setCandidates(found);
      }
    } catch (e) {
      if (e?.status === 422) {
        setError(UNREADABLE_MESSAGE);
      } else if (e?.status === 413) {
        setError("The server rejected this photo as too large. This is a backend setup issue, not something retaking the photo will fix — let the team know.");
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
      navigation.replace('Result', { result });
    } catch (e) {
      setError(e?.message || 'Could not confirm this medicine. Please try again.');
      setBusy(false);
      setBusyText('');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Point your camera at the medicine's box or label</Text>
          </View>
        )}

        {busy && (
          <View style={styles.statusCard}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.statusText}>{busyText}</Text>
          </View>
        )}

        {!busy && error !== '' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!busy && candidates && candidates.length > 0 && (
          <View style={styles.candidatesCard}>
            <Text style={styles.candidatesTitle}>Which one is it?</Text>
            <Text style={styles.candidatesHint}>Pick the closest match. We never guess for you.</Text>
            {candidates.map((c) => (
              <Pressable
                key={c.medicineId}
                style={styles.candidateRow}
                accessibilityRole="button"
                onPress={() => confirmCandidate(c.medicineId)}
              >
                <View style={styles.candidateInfo}>
                  <Text style={styles.candidateName}>{c.name}</Text>
                  {c.manufacturer ? <Text style={styles.candidateMeta}>{c.manufacturer}</Text> : null}
                </View>
                <Text style={styles.candidateConfidence}>{Math.round((c.confidence ?? 0) * 100)}%</Text>
              </Pressable>
            ))}
          </View>
        )}

        {!busy && (
          <Pressable style={styles.button} accessibilityRole="button" onPress={takePhoto}>
            <Text style={styles.buttonText}>{photoUri ? 'Retake photo' : 'Take a photo'}</Text>
          </Pressable>
        )}

        {(photoUri || error !== '') && !busy && (
          <Pressable style={styles.secondaryButton} accessibilityRole="button" onPress={reset}>
            <Text style={styles.secondaryButtonText}>Start over</Text>
          </Pressable>
        )}

        <Text style={styles.consent}>
          Your photo is sent to a cloud text-reading service to identify the medicine, and is not stored
          afterwards.
        </Text>
      </View>
      <DisclaimerBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { flex: 1, padding: 16, gap: 12 },
  placeholder: {
    height: 220,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  placeholderText: { color: COLORS.slate, fontSize: 14, textAlign: 'center' },
  preview: { height: 220, borderRadius: 14, backgroundColor: COLORS.surface },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
    padding: 14,
  },
  statusText: { color: COLORS.primaryDark, fontSize: 14 },
  errorCard: {
    borderWidth: 1,
    borderColor: '#F0D8A8',
    backgroundColor: COLORS.warningBg,
    borderRadius: 12,
    padding: 14,
  },
  errorText: { color: '#7A5A10', fontSize: 14, lineHeight: 20 },
  candidatesCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  candidatesTitle: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
  candidatesHint: { fontSize: 12, color: COLORS.muted, marginBottom: 8 },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  candidateInfo: { flex: 1, paddingRight: 10 },
  candidateName: { fontSize: 14, fontWeight: '600', color: COLORS.ink },
  candidateMeta: { fontSize: 12, color: COLORS.slate, marginTop: 2 },
  candidateConfidence: { fontSize: 13, fontWeight: '700', color: COLORS.primaryDark },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.ink },
  consent: { fontSize: 11, color: COLORS.muted, textAlign: 'center', lineHeight: 16 },
});

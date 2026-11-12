import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { searchMedicines } from '../services/api';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { LoadingIndicator, ErrorMessage } from '../components/LoadingAndError';
import { STATUS_STYLES, FALLBACK_STATUS } from '../constants/statusStyles';

// Used when a search finds nothing, so the user sees the real message and never a blank screen.
const NOT_FOUND_RESULT = {
  status: 'not_found',
  message: 'Not found in our records. Ask your pharmacist.',
  medicine: null,
  allergyAlerts: [],
};

export default function SearchScanScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Scanner. Tasnim owns what the user sees (the states and the layout below).
  // Annabel owns the camera: CameraView, permission, onBarcodeScanned and the verify call.
  // She sets scanLoading while verifying and scanError when something fails.
  // For an unreadable code she uses:
  // setScanError("We couldn't read this code. Please try again or search by name.")
  const [showScanner, setShowScanner] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState('');

  async function handleSearch() {
    const text = query.trim();
    if (text.length < 2) {
      setError('Please type at least 2 characters.');
      return;
    }
    setError('');
    setResults(null);
    setLoading(true);
    try {
      const found = await searchMedicines(text);
      if (!found || found.length === 0) {
        navigation.navigate('Result', { result: NOT_FOUND_RESULT });
      } else if (found.length === 1) {
        navigation.navigate('Result', { result: found[0] });
      } else {
        setResults(found);
      }
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function closeScanner() {
    setShowScanner(false);
    setScanLoading(false);
    setScanError('');
  }

  if (showScanner) {
    return (
      <View style={styles.scannerContainer}>
        {/* Annabel: put the CameraView here, filling the screen behind the frame. */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>Place the barcode inside the frame</Text>
        </View>

        <View style={styles.scanFrame} />

        {scanLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Verifying...</Text>
          </View>
        )}

        {scanError !== '' && (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{scanError}</Text>
            <Pressable
              style={styles.retryButton}
              accessibilityRole="button"
              onPress={() => setScanError('')}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={styles.cancelButton} accessibilityRole="button" onPress={closeScanner}>
          <Text style={styles.buttonText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  function renderItem({ item }) {
    const style = STATUS_STYLES[item.status] || FALLBACK_STATUS;
    return (
      <Pressable
        style={[styles.card, { borderLeftColor: style.color }]}
        accessibilityRole="button"
        onPress={() => navigation.navigate('Result', { result: item })}
      >
        <Text style={styles.cardTitle}>{item.medicine ? item.medicine.name : 'Unknown medicine'}</Text>
        <Text style={styles.cardMessage}>{item.message}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Search medicine by name"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <Pressable style={styles.button} accessibilityRole="button" onPress={handleSearch}>
          <Text style={styles.buttonText}>Search</Text>
        </Pressable>
        <Pressable style={styles.button} accessibilityRole="button" onPress={() => setShowScanner(true)}>
          <Text style={styles.buttonText}>Scan barcode / QR code</Text>
        </Pressable>

        {loading && <LoadingIndicator text="Searching..." />}
        {error !== '' && <ErrorMessage message={error} onRetry={handleSearch} />}

        {results !== null && (
          <FlatList
            data={results}
            keyExtractor={(item, index) =>
              item.medicine && item.medicine.id ? String(item.medicine.id) : String(index)
            }
            renderItem={renderItem}
            style={styles.space}
          />
        )}
      </View>
      <DisclaimerBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#757575',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: '#212121',
  },
  button: {
    backgroundColor: '#1565C0',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  space: { marginTop: 12 },
  error: { color: '#212121', backgroundColor: '#E3F2FD', borderRadius: 8, padding: 12, marginTop: 8 },
  card: {
    borderWidth: 1,
    borderColor: '#B0B0B0',
    borderLeftWidth: 6,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#212121' },
  cardMessage: { fontSize: 14, color: '#212121', marginTop: 4 },
  scannerContainer: { flex: 1, backgroundColor: '#212121' },
  instructionContainer: {
    position: 'absolute',
    top: 50,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 8,
  },
  scanFrame: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    width: '70%',
    height: '40%',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    zIndex: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  loadingText: { color: '#FFFFFF', marginTop: 10, fontSize: 16 },
  messageBox: {
    position: 'absolute',
    bottom: 110,
    left: 20,
    right: 20,
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    zIndex: 20,
  },
  messageText: { color: '#212121', textAlign: 'center', fontSize: 15 },
  retryButton: {
    backgroundColor: '#1565C0',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  retryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  cancelButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#1565C0',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    zIndex: 10,
  },
});
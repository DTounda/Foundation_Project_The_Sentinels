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
import { CameraView, useCameraPermissions } from 'expo-camera';
import { searchMedicines, verifyBarcode } from '../services/api';
import DisclaimerBanner from '../components/DisclaimerBanner';
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
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

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

  async function startScan() {
    if (!permission || !permission.granted) {
      const answer = await requestPermission();
      if (!answer.granted) {
        setError('Camera permission is needed to scan. You can search by name instead.');
        return;
      }
    }
    setError('');
    setScanned(false);
    setScanning(true);
  }

  async function handleBarcode({ data: barcode }) {
    if (scanned) return;
    setScanned(true);
    setScanning(false);
    setError('');
    setLoading(true);
    try {
      const result = await verifyBarcode(barcode);
      navigation.navigate('Result', { result });
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (scanning) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={handleBarcode}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'qr'],
          }}
        />
        <Pressable style={styles.button} accessibilityRole="button" onPress={() => setScanning(false)}>
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
        <Pressable style={styles.button} accessibilityRole="button" onPress={startScan}>
          <Text style={styles.buttonText}>Scan barcode / QR code</Text>
        </Pressable>

        {loading && <ActivityIndicator size="large" color="#1565C0" style={styles.space} />}
        {error !== '' && <Text style={styles.error}>{error}</Text>}

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
  cameraContainer: { flex: 1, backgroundColor: '#000000' },
  camera: { flex: 1 },
});
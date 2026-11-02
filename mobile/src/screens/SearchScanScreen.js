import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { API_BASE_URL } from '../config';

const COLORS = {
  blue: '#1565C0',
  text: '#212121',
  verified: '#2E7D32',
  unconfirmed: '#F9A825',
  not_found: '#757575',
};

async function request(path, options) {
  const response = await fetch(API_BASE_URL + path, options);
  const data = await response.json();
  if (!response.ok) {
    const message =
      data && data.error ? data.error.message : 'Something went wrong. Please try again.';
    throw new Error(message);
  }
  return data;
}

export default function SearchScanScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [disclaimer, setDisclaimer] = useState('');
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
      const data = await request('/medicines/search?q=' + encodeURIComponent(text));
      setResults(data.results || []);
      setDisclaimer(data.disclaimer || '');
    } catch (e) {
      setError(e.message);
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
      const result = await request('/verify/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode }),
      });
      navigation.navigate('Result', { result });
    } catch (e) {
      setError(e.message);
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
        <TouchableOpacity style={styles.cancelButton} onPress={() => setScanning(false)}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderItem({ item }) {
    const name = item.medicine ? item.medicine.name : 'Unknown medicine';
    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: COLORS[item.status] || COLORS.not_found }]}
        onPress={() => navigation.navigate('Result', { result: { ...item, disclaimer } })}
      >
        <Text style={styles.cardTitle}>{name}</Text>
        <Text style={styles.cardMessage}>{item.message}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search medicine by name</Text>
      <TextInput
        style={styles.input}
        placeholder="Search medicine by name"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
      />
      <TouchableOpacity style={styles.button} onPress={handleSearch}>
        <Text style={styles.buttonText}>Search</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={startScan}>
        <Text style={styles.buttonText}>Scan barcode / QR code</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color={COLORS.blue} style={styles.space} />}
      {error !== '' && <Text style={styles.error}>{error}</Text>}

      {results !== null && results.length === 0 && (
        <Text style={styles.cardMessage}>Not found in our records. Ask your pharmacist.</Text>
      )}

      {results !== null && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item, index) =>
            item.medicine && item.medicine.id ? String(item.medicine.id) : String(index)
          }
          renderItem={renderItem}
          style={styles.space}
        />
      )}

      {results !== null && disclaimer !== '' && (
        <Text style={styles.disclaimer}>{disclaimer}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#FFFFFF' },
  title: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.not_found,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.blue,
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: { color: '#FFFFFF', fontSize: 15 },
  space: { marginTop: 12 },
  error: { color: COLORS.text, marginTop: 8 },
  card: {
    borderWidth: 1,
    borderColor: '#B0B0B0',
    borderLeftWidth: 6,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  cardMessage: { fontSize: 13, color: COLORS.text, marginTop: 4 },
  disclaimer: { fontSize: 11, color: COLORS.not_found, textAlign: 'center', marginTop: 12 },
  cameraContainer: { flex: 1, backgroundColor: '#000000' },
  camera: { flex: 1 },
  cancelButton: {
    backgroundColor: COLORS.blue,
    padding: 14,
    alignItems: 'center',
  },
});
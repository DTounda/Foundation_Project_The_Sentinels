import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { submitReport } from '../services/api';

export default function ReportScreen() {
  const [productName, setProductName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    if (!productName.trim() || !description.trim()) {
      setError('Please enter the product name and describe what looks suspicious.');
      return;
    }
    setLoading(true);
    try {
      // TODO: match field names to docs/API.md
      await submitReport({
        product_name: productName.trim(),
        barcode: barcode.trim() || undefined,
        location: location.trim() || undefined,
        description: description.trim(),
      });
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <View style={s.container}>
        <Text style={s.title}>Report sent</Text>
        <Text style={s.body}>Thank you. Your report will be reviewed.</Text>
        <TouchableOpacity style={s.button} onPress={() => {
          setProductName(''); setBarcode(''); setLocation(''); setDescription(''); setDone(false);
        }}>
          <Text style={s.buttonText}>Send another report</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.title}>Report a suspicious product</Text>
      <Text style={s.body}>
        MediCheck gives information only. It cannot confirm whether a product is fake.
      </Text>
      <TextInput style={s.input} placeholder="Product name *" value={productName} onChangeText={setProductName} />
      <TextInput style={s.input} placeholder="Barcode (optional)" value={barcode} onChangeText={setBarcode} />
      <TextInput style={s.input} placeholder="Where did you find it? (optional)" value={location} onChangeText={setLocation} />
      <TextInput style={[s.input, s.multiline]} placeholder="What looks suspicious? *" multiline
        value={description} onChangeText={setDescription} />
      {!!error && <Text style={s.error}>{error}</Text>}
      <TouchableOpacity style={s.button} onPress={submit} disabled={loading}>
        <Text style={s.buttonText}>{loading ? 'Sending...' : 'Submit report'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  body: { marginBottom: 16, color: '#444' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, marginBottom: 12 },
  multiline: { height: 110, textAlignVertical: 'top' },
  button: { backgroundColor: '#0b7a54', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  error: { color: '#a4261d', marginBottom: 10 },
});
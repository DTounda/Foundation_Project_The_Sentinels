import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { searchMedicines, submitReport } from '../services/api';

export default function ReportScreen({ route }) {
  const params = route?.params || {};
  const preselected = params.medicineId ? { id: params.medicineId, name: params.medicineName } : null;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [medicine, setMedicine] = useState(preselected);
  const [productName, setProductName] = useState(!params.medicineId && params.medicineName ? params.medicineName : '');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSearch() {
    setError('');
    if (query.trim().length < 2) return setError('Type at least 2 characters to search.');
    try {
      const r = await searchMedicines(query.trim());
      setResults(r.map((x) => x.medicine).filter(Boolean));
    } catch (e) { setError(e.message); }
  }

  async function submit() {
    setError('');
    if (!medicine && !productName.trim()) {
      return setError('Pick a medicine from the search, or type the product name.');
    }
    const details = description.trim();
    const text = medicine ? details : `Product: ${productName.trim()}. ${details}`;
    if (text.length < 5 || text.length > 1000) {
      return setError('Please describe what looks suspicious (5 to 1000 characters).');
    }
    setLoading(true);
    try {
      await submitReport({
        medicineId: medicine ? medicine.id : undefined,
        description: text,
        location: location.trim() || undefined,
      });
      setDone(true);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  if (done) {
    return (
      <View style={s.container}>
        <Text style={s.title}>Report sent</Text>
        <Text style={s.body}>Thank you. Your report will be reviewed.</Text>
        <TouchableOpacity style={s.button} onPress={() => {
          setMedicine(null); setResults([]); setQuery(''); setProductName('');
          setDescription(''); setLocation(''); setDone(false);
        }}>
          <Text style={s.buttonText}>Send another report</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.title}>Report a suspicious product</Text>
      <Text style={s.body}>MediCheck gives information only. It cannot confirm whether a product is fake.</Text>

      {medicine ? (
        <View style={s.selected}>
          <Text style={{ flex: 1 }}>Medicine: {medicine.name}</Text>
          <TouchableOpacity onPress={() => setMedicine(null)}><Text style={s.link}>Change</Text></TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text style={s.label}>Find it in our records</Text>
          <TextInput style={s.input} placeholder="Search the medicine name" value={query}
            onChangeText={setQuery} onSubmitEditing={onSearch} />
          <TouchableOpacity style={s.secondary} onPress={onSearch}><Text>Search</Text></TouchableOpacity>
          {results.map((m) => (
            <TouchableOpacity key={m.id} style={s.row} onPress={() => setMedicine(m)}>
              <Text>{m.name}</Text>
            </TouchableOpacity>
          ))}
          <Text style={s.label}>Or type the product name</Text>
          <TextInput style={s.input} placeholder="Product name (if not in our records)"
            value={productName} onChangeText={setProductName} />
        </View>
      )}

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
  label: { fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, marginBottom: 12 },
  multiline: { height: 110, textAlignVertical: 'top' },
  row: { padding: 10, borderBottomWidth: 1, borderColor: '#eee' },
  selected: { flexDirection: 'row', padding: 12, backgroundColor: '#dff3ea', borderRadius: 10, marginBottom: 12 },
  secondary: { alignSelf: 'flex-start', borderWidth: 1, borderColor: '#ccc', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 8 },
  button: { backgroundColor: '#0b7a54', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  link: { color: '#0b7a54', fontWeight: '700' },
  error: { color: '#a4261d', marginBottom: 10 },
});
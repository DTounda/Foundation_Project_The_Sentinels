import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { getIngredients, getAllergies, addAllergy, deleteAllergy } from '../services/api';

const SEVERITIES = ['mild', 'moderate', 'severe']; // TODO: confirm allowed values

export default function AllergyProfileScreen({ navigation }) {
  const [ingredients, setIngredients] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [severity, setSeverity] = useState('mild');
  const [error, setError] = useState('');

  async function load() {
    try {
      setIngredients(await getIngredients());   // TODO: may be data.ingredients
      setAllergies(await getAllergies());       // TODO: may be data.allergies
    } catch (e) {
      setError(e.message);
      // TODO: if the token is missing or expired, navigation.replace('Login')
    }
  }
  useEffect(() => { load(); }, []);

  async function onAdd() {
    if (!selected) return setError('Choose an ingredient first.');
    setError('');
    try {
      await addAllergy(selected.id, severity);
      setSelected(null);
      await load();
    } catch (e) { setError(e.message); }
  }

  async function onDelete(id) {
    try { await deleteAllergy(id); await load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>My allergies</Text>
      {!!error && <Text style={s.error}>{error}</Text>}

      <Text style={s.label}>1. Choose an ingredient</Text>
      <FlatList style={s.pickList} data={ingredients} keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelected(item)}
            style={[s.row, selected?.id === item.id && s.rowSelected]}>
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )} />

      <Text style={s.label}>2. Choose severity</Text>
      <View style={s.chips}>
        {SEVERITIES.map((v) => (
          <TouchableOpacity key={v} onPress={() => setSeverity(v)}
            style={[s.chip, severity === v && s.chipOn]}>
            <Text style={severity === v && s.chipTextOn}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={s.button} onPress={onAdd}>
        <Text style={s.buttonText}>Add allergy</Text>
      </TouchableOpacity>

      <Text style={s.label}>Saved allergies</Text>
      <FlatList data={allergies} keyExtractor={(a) => String(a.id)}
        ListEmptyComponent={<Text>No allergies saved yet.</Text>}
        renderItem={({ item }) => (
          <View style={s.row}>
            <Text style={{ flex: 1 }}>{item.name || item.ingredient_name} ({item.severity})</Text>
            <TouchableOpacity onPress={() => onDelete(item.id)}>
              <Text style={s.delete}>Delete</Text>
            </TouchableOpacity>
          </View>
        )} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  label: { fontWeight: '700', marginTop: 14, marginBottom: 6 },
  pickList: { maxHeight: 160, borderWidth: 1, borderColor: '#ccc', borderRadius: 10 },
  row: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderColor: '#eee' },
  rowSelected: { backgroundColor: '#dff3ea' },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14 },
  chipOn: { backgroundColor: '#12263a', borderColor: '#12263a' },
  chipTextOn: { color: '#fff' },
  button: { backgroundColor: '#0b7a54', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '700' },
  delete: { color: '#a4261d', fontWeight: '700' },
  error: { color: '#a4261d' },
});
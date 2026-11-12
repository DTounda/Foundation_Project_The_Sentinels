import { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { getIngredients, getAllergies, addAllergy, deleteAllergy, hasToken } from '../services/api';

const SEVERITIES = ['mild', 'moderate', 'severe'];

export default function AllergyProfileScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [severity, setSeverity] = useState('mild');
  const [error, setError] = useState('');

  function handleError(e) {
    if (e.code === 'UNAUTHORIZED') navigation.navigate('Login', { redirectTo: 'AllergyProfile' });
    else setError(e.message);
  }

  async function loadAllergies() {
    try { setAllergies(await getAllergies()); } catch (e) { handleError(e); }
  }

  useEffect(() => {
    hasToken().then((ok) => {
      if (!ok) navigation.navigate('Login', { redirectTo: 'AllergyProfile' });
      else loadAllergies();
    });
  }, []);

  useEffect(() => {
    getIngredients(query).then(setIngredients).catch(handleError);
  }, [query]);

  async function onAdd() {
    if (!selected) return setError('Choose an ingredient first.');
    setError('');
    try {
      await addAllergy(selected.id, severity);
      setSelected(null);
      await loadAllergies();
    } catch (e) { handleError(e); }
  }

  async function onDelete(id) {
    try { await deleteAllergy(id); await loadAllergies(); } catch (e) { handleError(e); }
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>My allergies</Text>
      {!!error && <Text style={s.error}>{error}</Text>}

      <Text style={s.label}>1. Find an ingredient</Text>
      <TextInput style={s.input} placeholder="e.g. amox" value={query} onChangeText={setQuery} autoCapitalize="none" />
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
          <TouchableOpacity key={v} onPress={() => setSeverity(v)} style={[s.chip, severity === v && s.chipOn]}>
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
            <Text style={{ flex: 1 }}>{item.ingredient} ({item.severity})</Text>
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
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 10, marginBottom: 8 },
  pickList: { maxHeight: 140, borderWidth: 1, borderColor: '#ccc', borderRadius: 10 },
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
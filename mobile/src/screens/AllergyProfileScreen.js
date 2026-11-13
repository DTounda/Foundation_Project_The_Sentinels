import { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { getIngredients, getAllergies, addAllergy, deleteAllergy, hasToken } from '../services/api';
import { COLORS } from '../constants/colors';

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
            <Text style={s.rowText}>{item.name}</Text>
          </TouchableOpacity>
        )} />

      <Text style={s.label}>2. Choose severity</Text>
      <View style={s.chips}>
        {SEVERITIES.map((v) => (
          <TouchableOpacity key={v} onPress={() => setSeverity(v)} style={[s.chip, severity === v && s.chipOn]}>
            <Text style={[s.chipText, severity === v && s.chipTextOn]}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={s.button} onPress={onAdd}>
        <Text style={s.buttonText}>Add allergy</Text>
      </TouchableOpacity>

      <Text style={s.label}>Saved allergies</Text>
      <FlatList data={allergies} keyExtractor={(a) => String(a.id)}
        ListEmptyComponent={<Text style={s.empty}>No allergies saved yet.</Text>}
        renderItem={({ item }) => (
          <View style={s.row}>
            <Text style={s.rowTextFlex}>{item.ingredient} ({item.severity})</Text>
            <TouchableOpacity onPress={() => onDelete(item.id)}>
              <Text style={s.delete}>Delete</Text>
            </TouchableOpacity>
          </View>
        )} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.white },
  title: { fontSize: 21, fontWeight: '700', color: COLORS.ink, marginBottom: 8 },
  label: { fontWeight: '600', fontSize: 13, color: COLORS.ink, marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    padding: 10,
    marginBottom: 8,
    fontSize: 14,
    color: COLORS.ink,
  },
  pickList: { maxHeight: 140, borderWidth: 1, borderColor: COLORS.border, borderRadius: 9 },
  row: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderColor: COLORS.border },
  rowSelected: { backgroundColor: COLORS.primaryLight },
  rowText: { fontSize: 14, color: COLORS.ink },
  rowTextFlex: { flex: 1, fontSize: 14, color: COLORS.ink },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 13,
  },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.slate, fontSize: 12 },
  chipTextOn: { color: COLORS.white, fontWeight: '600' },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  delete: { color: COLORS.danger, fontWeight: '600', fontSize: 13 },
  empty: { color: COLORS.muted, fontStyle: 'italic', fontSize: 13 },
  error: { color: COLORS.danger, fontSize: 13 },
});

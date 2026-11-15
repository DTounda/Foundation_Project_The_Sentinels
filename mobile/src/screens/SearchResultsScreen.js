import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { searchMedicines } from '../services/api';
import { ROUTES } from '../navigation/routes';
import { Screen, Header, Field, Notice, StatusChip, Chip } from '../components/ui';
import { LoadingIndicator, ErrorMessage } from '../components/LoadingAndError';
import Icon from '../components/Icon';
import { COLORS, FONTS } from '../constants/theme';

// When nothing matches, the Result screen shows the real "Not found" message.
function notFoundResult(query) {
  return {
    status: 'not_found',
    message: 'Not found in our records. Ask your pharmacist.',
    medicine: { id: null, name: query },
    allergyAlerts: [],
  };
}

export default function SearchResultsScreen({ navigation, route }) {
  const [query, setQuery] = useState(route.params?.query || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run(text) {
    const q = (text ?? query).trim();
    if (q.length < 2) {
      setError('Please type at least 2 characters.');
      return;
    }
    setError('');
    setLoading(true);
    setResults([]);
    try {
      const found = await searchMedicines(q);
      if (!found || found.length === 0) {
        navigation.replace(ROUTES.RESULT, { result: notFoundResult(q) });
      } else if (found.length === 1) {
        navigation.replace(ROUTES.RESULT, { result: found[0] });
      } else {
        setResults(found);
      }
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (route.params?.query) run(route.params.query);
  }, [route.params?.query]);

  function renderItem({ item }) {
    const m = item.medicine || {};
    const alerts = item.allergyAlerts?.length || 0;
    return (
      <Pressable
        onPress={() => navigation.navigate(ROUTES.RESULT, { result: item })}
        accessibilityRole="button"
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
      >
        <View style={styles.rowIcon}>
          <Icon name="pill" size={22} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.name}>{m.name || 'Unknown medicine'}</Text>
          {m.manufacturer ? <Text style={styles.meta} numberOfLines={1}>{m.manufacturer}</Text> : null}
          {alerts > 0 ? (
            <Chip label="Allergy warning" icon="alert" color={COLORS.danger} background={COLORS.dangerBg} />
          ) : null}
        </View>
        <StatusChip status={item.status} />
      </Pressable>
    );
  }

  return (
    <Screen>
      <Header title="Search" onBack={navigation.goBack} />
      <FlatList
        data={results}
        keyExtractor={(item, i) => String(item.medicine?.id ?? i)}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 4 }}>
            <Field
              icon="search"
              placeholder="Search medicine by name"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => run()}
              returnKeyType="search"
              autoCapitalize="none"
            />
            {loading && <LoadingIndicator text="Searching..." />}
            {!!error && <ErrorMessage message={error} onRetry={() => run()} />}
            {results.length > 1 && (
              <Notice
                tone="warn"
                text="Several products match. Pick the one whose name and strength match your box exactly."
              />
            )}
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 8, gap: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16,
  },
  rowIcon: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.ink },
  meta: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted },
});

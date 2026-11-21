import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Screen, Header, Card, Body, Button } from '../components/ui';
import { LoadingIndicator, ErrorMessage } from '../components/LoadingAndError';
import { getHistory } from '../services/api';
import { ROUTES } from '../navigation/routes';
import { COLORS } from '../constants/theme';

// Words follow the team's wording: "verified" means registered with Rwanda FDA, never "authentic".
const RESULT_LABELS = {
  verified: 'Registered with Rwanda FDA',
  unconfirmed: 'Could not confirm',
  not_found: 'Not found in our records',
};

function formatDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

// Displays the user's past medicine checks from the API.

export default function HistoryScreen({ navigation }) {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setNeedsLogin(false);
    try {
      setItems(await getHistory());
    } catch (e) {
      if (e.code === 'UNAUTHORIZED') setNeedsLogin(true);
      else setError(e.message || 'Could not load your history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const showList = !loading && !error && !needsLogin && items && items.length > 0;
  const showEmpty = !loading && !error && !needsLogin && items && items.length === 0;

  return (
    <Screen>
      <Header title="My history" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        {loading && <LoadingIndicator text="Loading your history..." />}
        {!!error && <ErrorMessage message={error} onRetry={load} />}

        {needsLogin && (
          <View style={styles.gap}>
            <Body>Log in to see the medicines you checked.</Body>
            <Button title="Log in" onPress={() => navigation.navigate(ROUTES.LOGIN)} />
          </View>
        )}

        {showEmpty && <Body>No checks yet. Search for a medicine and it will appear here.</Body>}

        {showList && (
          <FlatList
            data={items}
            keyExtractor={(item, index) => `${item.date}-${index}`}
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <Text style={styles.name}>{item.medicineName || 'Unknown medicine'}</Text>
                <Text style={styles.result}>{RESULT_LABELS[item.result] || String(item.result)}</Text>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
              </Card>
            )}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 20 },
  gap: { gap: 14 },
  card: { marginBottom: 10, gap: 4 },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.ink },
  result: { fontSize: 14, color: COLORS.slate },
  date: { fontSize: 12, color: COLORS.muted },
});
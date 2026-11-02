import React from 'react';
import { Text } from 'react-native';
import PlaceholderScreen from '../components/PlaceholderScreen';

// Owner: Dorcase. This stub is replaced by the real Result screen in the next pull request.
export default function ResultScreen({ route }) {
  const result = route.params?.result;
  return (
    <PlaceholderScreen title="Result" owner="Dorcase">
      <Text>{result ? `${result.status}: ${result.message}` : 'No result yet.'}</Text>
    </PlaceholderScreen>
  );
}

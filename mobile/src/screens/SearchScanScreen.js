import React from 'react';
import { Button } from 'react-native';
import PlaceholderScreen from '../components/PlaceholderScreen';
import { SAMPLE_RESULTS } from '../data/sampleResults';

// Owner: Tasnim. Replace this placeholder with the real search and scan screen.
export default function SearchScanScreen({ navigation }) {
  return (
    <PlaceholderScreen title="Search / Scan" owner="Tasnim">
      <Button title="Preview result: verified" onPress={() => navigation.navigate('Result', { result: SAMPLE_RESULTS.verified })} />
      <Button title="Preview result: could not confirm" onPress={() => navigation.navigate('Result', { result: SAMPLE_RESULTS.unverified })} />
      <Button title="Preview result: not found" onPress={() => navigation.navigate('Result', { result: SAMPLE_RESULTS.notFound })} />
      <Button title="My allergies" onPress={() => navigation.navigate('AllergyProfile')} />
      <Button title="Report a product" onPress={() => navigation.navigate('Report')} />
      <Button title="Log in" onPress={() => navigation.navigate('Login')} />
    </PlaceholderScreen>
  );
}

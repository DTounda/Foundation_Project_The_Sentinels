import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import SearchResultsScreen from '../SearchResultsScreen';
import { searchMedicines } from '../../services/api';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('../../services/api', () => ({ searchMedicines: jest.fn() }));

const result = (id, name) => ({ status: 'verified', message: 'ok', medicine: { id, name }, allergyAlerts: [] });

function nav() {
  return { navigate: jest.fn(), replace: jest.fn(), goBack: jest.fn() };
}

test('goes straight to Result when exactly one medicine matches', async () => {
  const navigation = nav();
  const one = result(1, 'Paracetamol');
  searchMedicines.mockResolvedValue([one]);
  await render(<SearchResultsScreen navigation={navigation} route={{ params: { query: 'parac' } }} />);
  await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('Result', { result: one }));
});

test('shows a Not found result when nothing matches', async () => {
  const navigation = nav();
  searchMedicines.mockResolvedValue([]);
  await render(<SearchResultsScreen navigation={navigation} route={{ params: { query: 'zzz' } }} />);
  await waitFor(() => expect(navigation.replace).toHaveBeenCalled());
  const [, params] = navigation.replace.mock.calls[0];
  expect(params.result.status).toBe('not_found');
  expect(params.result.medicine.name).toBe('zzz');
});

test('lists every match when there are several', async () => {
  searchMedicines.mockResolvedValue([result(1, 'BREN-200'), result(2, 'BREN-400')]);
  await render(<SearchResultsScreen navigation={nav()} route={{ params: { query: 'bren' } }} />);
  expect(await screen.findByText('BREN-200')).toBeTruthy();
  expect(screen.getByText('BREN-400')).toBeTruthy();
  expect(screen.getByText(/Several products match/)).toBeTruthy();
});

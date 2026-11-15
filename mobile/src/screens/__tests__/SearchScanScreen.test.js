import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import SearchScanScreen from '../SearchScanScreen';
import { searchMedicines } from '../../services/api';

jest.mock('../../services/api', () => ({ searchMedicines: jest.fn() }));

test('asks for at least 2 characters before searching', async () => {
  await render(<SearchScanScreen navigation={{ navigate: jest.fn() }} />);
  await fireEvent.press(screen.getByText('Search'));
  expect(screen.getByText('Please type at least 2 characters.')).toBeTruthy();
  expect(searchMedicines).not.toHaveBeenCalled();
});

test('goes straight to Result when exactly one medicine matches', async () => {
  const navigate = jest.fn();
  const one = { status: 'verified', message: 'ok', medicine: { id: 1, name: 'Paracetamol' }, allergyAlerts: [] };
  searchMedicines.mockResolvedValue([one]);
  await render(<SearchScanScreen navigation={{ navigate }} />);
  await fireEvent.changeText(screen.getByPlaceholderText('Search medicine by name'), 'parac');
  await fireEvent.press(screen.getByText('Search'));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('Result', { result: one }));
});
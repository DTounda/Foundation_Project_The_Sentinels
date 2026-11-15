import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import SearchScanScreen from '../SearchScanScreen';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-navigation/native', () => ({ useFocusEffect: jest.fn() }));
jest.mock('../../services/api', () => ({
  getStoredUser: jest.fn().mockResolvedValue(null),
  getAllergies: jest.fn().mockResolvedValue([]),
  hasToken: jest.fn().mockResolvedValue(false),
}));
jest.mock('../../services/profileStore', () => ({ loadMedications: jest.fn() }));

test('asks for at least 2 characters before searching', async () => {
  const navigate = jest.fn();
  await render(<SearchScanScreen navigation={{ navigate }} />);
  const input = screen.getByPlaceholderText('Or search by name, e.g. ibuprofen');
  await fireEvent.changeText(input, 'p');
  await fireEvent(input, 'submitEditing');
  expect(screen.getByText('Please type at least 2 characters.')).toBeTruthy();
  expect(navigate).not.toHaveBeenCalled();
});

test('opens the search results with what was typed', async () => {
  const navigate = jest.fn();
  await render(<SearchScanScreen navigation={{ navigate }} />);
  const input = screen.getByPlaceholderText('Or search by name, e.g. ibuprofen');
  await fireEvent.changeText(input, ' parac ');
  await fireEvent(input, 'submitEditing');
  expect(navigate).toHaveBeenCalledWith('SearchResults', { query: 'parac' });
});

test('the photo button opens photo verification', async () => {
  const navigate = jest.fn();
  await render(<SearchScanScreen navigation={{ navigate }} />);
  await fireEvent.press(screen.getByText('Take a photo of the box'));
  expect(navigate).toHaveBeenCalledWith('PhotoVerify');
});

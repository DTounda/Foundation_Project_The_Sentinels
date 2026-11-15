import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, getAllergies, hasToken } from '../api';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

function mockFetch(status, body) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('login stores the token and returns the user', async () => {
  mockFetch(200, { token: 'abc123', user: { id: 1, fullName: 'Annabel' } });
  const user = await login('a@b.com', 'pass1234');
  expect(user.fullName).toBe('Annabel');
  expect(await hasToken()).toBe(true);
});

test('an expired token (401) is cleared and reported', async () => {
  await AsyncStorage.setItem('token', 'old');
  mockFetch(401, {});
  await expect(getAllergies()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  expect(await hasToken()).toBe(false);
});

test('protected calls without a token fail before any network request', async () => {
  global.fetch = jest.fn();
  await expect(getAllergies()).rejects.toThrow('Please log in first.');
  expect(global.fetch).not.toHaveBeenCalled();
});

test('API error messages are passed on to the screen', async () => {
  mockFetch(400, { error: { code: 'VALIDATION_ERROR', message: 'email is required' } });
  await expect(login('', '')).rejects.toThrow('email is required');
});
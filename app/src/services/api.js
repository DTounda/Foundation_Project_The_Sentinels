import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: confirm base URL and paths in docs/API.md
// On a real phone, use your computer's IP address, not localhost.
export const BASE_URL = 'http://localhost:3000';

export async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await AsyncStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

// TODO: confirm paths and field names (name/email/password, token)
export async function login(email, password) {
  const data = await request('/auth/login', { method: 'POST', body: { email, password } });
  await AsyncStorage.setItem('token', data.token);
  return data;
}

export const register = (name, email, password) =>
  request('/auth/register', { method: 'POST', body: { name, email, password } });
// TODO: confirm paths and field names in docs/API.md
export const getIngredients = () => request('/ingredients');
export const getAllergies = () => request('/allergies', { auth: true });
export const addAllergy = (ingredient_id, severity) =>
  request('/allergies', { method: 'POST', auth: true, body: { ingredient_id, severity } });
export const deleteAllergy = (id) =>
  request(`/allergies/${id}`, { method: 'DELETE', auth: true });
// TODO: confirm path, field names, and whether login is required
export const submitReport = (report) =>
  request('/reports', { method: 'POST', body: report });
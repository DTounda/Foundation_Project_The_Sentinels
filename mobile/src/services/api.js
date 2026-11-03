import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

async function request(path, { method = 'GET', body, auth = false } = {}, retried = false) {
  const token = await AsyncStorage.getItem('token');
  if (auth && !token) {
    const err = new Error('Please log in first.');
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // An expired or invalid token makes the API answer 401, even on public routes.
  if (res.status === 401 && token) {
    await AsyncStorage.removeItem('token');
    if (!auth && !retried) return request(path, { method, body, auth }, true); // retry as a guest
    const err = new Error('Your session expired. Please log in again.');
    err.code = 'UNAUTHORIZED';
    err.status = 401;
    throw err;
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || 'Something went wrong');
    err.code = data?.error?.code;
    err.status = res.status;
    throw err;
  }
  return data;
} 

async function saveSession(data) {
  await AsyncStorage.setItem('token', data.token);
  return data.user;
}

export async function register(fullName, email, password) {
  return saveSession(await request('/auth/register', { method: 'POST', body: { fullName, email, password } }));
}

export async function login(email, password) {
  return saveSession(await request('/auth/login', { method: 'POST', body: { email, password } }));
}

export const logout = () => AsyncStorage.removeItem('token');

export async function getIngredients(q = '') {
  const data = await request(`/ingredients?q=${encodeURIComponent(q)}`);
  return data.ingredients;
}

export async function getAllergies() {
  const data = await request('/allergies', { auth: true });
  return data.allergies;
}

export const addAllergy = (ingredientId, severity) =>
  request('/allergies', { method: 'POST', auth: true, body: { ingredientId, severity } });

export const deleteAllergy = (id) => request(`/allergies/${id}`, { method: 'DELETE', auth: true });

export async function searchMedicines(q) {
  const data = await request(`/medicines/search?q=${encodeURIComponent(q)}`);
  return data.results; // each result has result.medicine.id and result.medicine.name
}

export const submitReport = ({ medicineId, description, location }) =>
  request('/reports', { method: 'POST', body: { medicineId, description, location } });
export async function hasToken() {
  return !!(await AsyncStorage.getItem('token'));
}

// Kept from Tasnim's version (used by SearchScanScreen); fixed to follow docs/API.md
export const fetchMedication = (query) =>
  request(`/medicines/search?q=${encodeURIComponent(query)}`);

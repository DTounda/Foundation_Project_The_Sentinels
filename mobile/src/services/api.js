import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

async function request(path, { method = 'GET', body, auth = false, guest = false } = {}) {
  const token = guest ? null : await AsyncStorage.getItem('token');
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
  if (data.user) await AsyncStorage.setItem('user', JSON.stringify(data.user));
  return data.user;
}

// Account info for the Profile header, saved at login/signup.
export async function getStoredUser() {
  const raw = await AsyncStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

// The id stays fixed, so changing contact details never loses the record.
export async function setStoredUser(fields) {
  const current = (await getStoredUser()) || {};
  const next = { ...current, ...fields };
  await AsyncStorage.setItem('user', JSON.stringify(next));
  return next;
}

// Sends the new fields plus fullName, so it works before and after the backend change.
export async function register({ firstName, lastName, email, phone, password }) {
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  return saveSession(
    await request('/auth/register', {
      method: 'POST',
      guest: true,
      body: { fullName, firstName, lastName, email, phone, password },
    }),
  );
}

export async function login(email, password) {
  return saveSession(await request('/auth/login', { method: 'POST', guest: true, body: { email, password } }));
}

// Clears the session plus everything the Profile screen may have cached
// locally, so a shared pilot phone never shows the next person's data.
export const logout = () =>
  AsyncStorage.multiRemove([
    'token',
    'user',
    'profile.doctor',
    'profile.pharmacy',
    'profile.medications',
  ]);

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

// Ingredients for one medicine, shown on the Result screen.
export async function getMedicineDetails(id) {
  const data = await request(`/medicines/${encodeURIComponent(id)}`);
  return {
    medicine: data.medicine ?? null,
    ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
  };
}

export const submitReport = ({ medicineId, description, location }) =>
  request('/reports', { method: 'POST', body: { medicineId, description, location } });
export async function hasToken() {
  return !!(await AsyncStorage.getItem('token'));
}

// Kept from Tasnim's version (used by SearchScanScreen); fixed to follow docs/API.md
export const fetchMedication = (query) =>
  request(`/medicines/search?q=${encodeURIComponent(query)}`);

// Profile endpoints. Not built yet, see docs/API.md.

export const getProfile = () => request('/me', { auth: true });

// Keyed by the account id on the server, never by email or phone.
export const updateAccount = ({ fullName, email, phone }) =>
  request('/me/account', { method: 'PUT', auth: true, body: { fullName, email, phone } });

export const saveDoctor = ({ name, phone, email }) =>
  request('/me/doctor', { method: 'PUT', auth: true, body: { name, phone, email } });

export const savePharmacy = ({ name, phone }) =>
  request('/me/pharmacy', { method: 'PUT', auth: true, body: { name, phone } });

export async function getMedications() {
  const data = await request('/me/medications', { auth: true });
  return Array.isArray(data.medications) ? data.medications : [];
}

export const addMedication = (name) =>
  request('/me/medications', { method: 'POST', auth: true, body: { name } });

export const deleteMedication = (id) =>
  request(`/me/medications/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true });

// Photo feature. image is a base64 JPEG string, no "data:" prefix.
// Returns { candidates: [{ medicineId, name, manufacturer, confidence }], disclaimer }.
// Throws with err.status === 422 when nothing readable was found.
export const verifyPhoto = (base64Image) =>
  request('/verify/photo', { method: 'POST', body: { image: base64Image } });

// Called after the user picks one of the photo candidates.
// Returns the same shape as verifyBarcode (status, message, medicine, allergyAlerts, disclaimer).
export const verifyMedicine = (medicineId) =>
  request('/verify/medicine', { method: 'POST', body: { medicineId } });

// Checks the medicine against what the user already takes. Not built yet.
export async function checkInteractions(medicineId) {
  if (!(await hasToken())) return [];
  try {
    const data = await request(`/medicines/${encodeURIComponent(medicineId)}/interactions`, { auth: true });
    return Array.isArray(data.interactions) ? data.interactions : [];
  } catch (e) {
    return [];
  }
}

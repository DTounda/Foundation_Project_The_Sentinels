import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getProfile,
  saveDoctor,
  savePharmacy,
  getMedications,
  addMedication,
  deleteMedication,
  updateAccount,
  setStoredUser,
} from './api';

// Profile data, falling back to this phone until /me endpoints exist.
// Returns { data, local }. local true means saved on device only.

const KEY_DOCTOR = 'profile.doctor';
const KEY_PHARMACY = 'profile.pharmacy';
const KEY_MEDICATIONS = 'profile.medications';

// A 401 means log in, not endpoint missing, so let it through.
function isAuthError(err) {
  return err?.code === 'UNAUTHORIZED' || err?.status === 401;
}

async function readLocal(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function writeLocal(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Losing a local draft is fine. Crashing the screen is not.
  }
}

export async function loadContacts() {
  try {
    const data = await getProfile();
    return { data: { doctor: data.doctor ?? null, pharmacy: data.pharmacy ?? null }, local: false };
  } catch (err) {
    if (isAuthError(err)) throw err;
    return {
      data: {
        doctor: await readLocal(KEY_DOCTOR, null),
        pharmacy: await readLocal(KEY_PHARMACY, null),
      },
      local: true,
    };
  }
}

export async function storeDoctor(doctor) {
  try {
    await saveDoctor(doctor);
    return { local: false };
  } catch (err) {
    if (isAuthError(err)) throw err;
    await writeLocal(KEY_DOCTOR, doctor);
    return { local: true };
  }
}

export async function storePharmacy(pharmacy) {
  try {
    await savePharmacy(pharmacy);
    return { local: false };
  } catch (err) {
    if (isAuthError(err)) throw err;
    await writeLocal(KEY_PHARMACY, pharmacy);
    return { local: true };
  }
}

export async function loadMedications() {
  try {
    return { data: await getMedications(), local: false };
  } catch (err) {
    if (isAuthError(err)) throw err;
    return { data: await readLocal(KEY_MEDICATIONS, []), local: true };
  }
}

export async function storeMedication(name) {
  try {
    await addMedication(name);
    return { local: false };
  } catch (err) {
    if (isAuthError(err)) throw err;
    const list = await readLocal(KEY_MEDICATIONS, []);
    // Local id only. The server assigns the real one.
    await writeLocal(KEY_MEDICATIONS, [...list, { id: `local-${Date.now()}`, name }]);
    return { local: true };
  }
}

// Same account id throughout, whatever the server call does.
export async function storeAccount(fields) {
  try {
    await updateAccount(fields);
    await setStoredUser(fields);
    return { local: false };
  } catch (err) {
    if (isAuthError(err)) throw err;
    await setStoredUser(fields);
    return { local: true };
  }
}

export async function removeMedication(id) {
  try {
    await deleteMedication(id);
    return { local: false };
  } catch (err) {
    if (isAuthError(err)) throw err;
    const list = await readLocal(KEY_MEDICATIONS, []);
    await writeLocal(KEY_MEDICATIONS, list.filter((m) => String(m.id) !== String(id)));
    return { local: true };
  }
}

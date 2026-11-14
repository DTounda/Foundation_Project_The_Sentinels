import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { hasToken, logout, getStoredUser } from '../services/api';
import {
  loadContacts,
  storeDoctor,
  storePharmacy,
  loadMedications,
  storeMedication,
  removeMedication,
} from '../services/profileStore';
import { ROUTES } from '../navigation/routes';
import { COLORS } from '../constants/colors';

function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';
}

// A row that opens into a small form, instead of showing it always.
function Disclosure({ title, summary, open, onToggle, children }) {
  return (
    <View style={styles.disclosure}>
      <Pressable style={styles.disclosureHead} onPress={onToggle} accessibilityRole="button">
        <View>
          <Text style={styles.disclosureTitle}>{title}</Text>
          <Text style={styles.disclosureSummary}>{summary}</Text>
        </View>
        <Text style={styles.chevron}>{open ? '▾' : '▸'}</Text>
      </Pressable>
      {open && <View style={styles.disclosureBody}>{children}</View>}
    </View>
  );
}

// Who to call, and what the person already takes.
export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [localOnly, setLocalOnly] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [open, setOpen] = useState(null); // 'doctor' | 'pharmacy' | null

  const [account, setAccount] = useState(null);
  const [doctor, setDoctor] = useState({ name: '', phone: '', email: '' });
  const [pharmacy, setPharmacy] = useState({ name: '', phone: '' });
  const [medications, setMedications] = useState([]);
  const [newMedication, setNewMedication] = useState('');

  function goToLogin() {
    navigation.navigate(ROUTES.LOGIN, { redirectTo: ROUTES.PROFILE });
  }

  function handleError(e) {
    if (e?.code === 'UNAUTHORIZED') goToLogin();
    else setError(e?.message || 'Something went wrong.');
  }

  async function refresh() {
    setError('');
    try {
      const user = await getStoredUser();
      const contacts = await loadContacts();
      const meds = await loadMedications();
      setAccount(user);
      setDoctor({
        name: contacts.data.doctor?.name || '',
        phone: contacts.data.doctor?.phone || '',
        email: contacts.data.doctor?.email || '',
      });
      setPharmacy({
        name: contacts.data.pharmacy?.name || '',
        phone: contacts.data.pharmacy?.phone || '',
      });
      setMedications(meds.data);
      setLocalOnly(contacts.local || meds.local);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    hasToken().then((ok) => {
      if (cancelled) return;
      if (!ok) {
        setLoading(false);
        goToLogin();
        return;
      }
      refresh();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // A contact is useless without both a name and a number.
  function validContact(c) {
    return c.name.trim().length > 0 && c.phone.trim().length > 0;
  }

  async function onSaveDoctor() {
    setError('');
    setSaved('');
    if (!validContact(doctor)) {
      setError('Your doctor needs at least a name and a phone number.');
      return;
    }
    try {
      const res = await storeDoctor({
        name: doctor.name.trim(),
        phone: doctor.phone.trim(),
        email: doctor.email.trim(),
      });
      setLocalOnly(res.local);
      setSaved('Doctor saved.');
      setOpen(null);
    } catch (e) {
      handleError(e);
    }
  }

  async function onSavePharmacy() {
    setError('');
    setSaved('');
    if (!validContact(pharmacy)) {
      setError('Your pharmacy needs at least a name and a phone number.');
      return;
    }
    try {
      const res = await storePharmacy({
        name: pharmacy.name.trim(),
        phone: pharmacy.phone.trim(),
      });
      setLocalOnly(res.local);
      setSaved('Pharmacy saved.');
      setOpen(null);
    } catch (e) {
      handleError(e);
    }
  }

  async function onAddMedication() {
    const name = newMedication.trim();
    if (!name) return;
    setError('');
    setSaved('');
    try {
      const res = await storeMedication(name);
      setLocalOnly(res.local);
      setNewMedication('');
      const meds = await loadMedications();
      setMedications(meds.data);
    } catch (e) {
      handleError(e);
    }
  }

  async function onRemoveMedication(id) {
    try {
      await removeMedication(id);
      const meds = await loadMedications();
      setMedications(meds.data);
    } catch (e) {
      handleError(e);
    }
  }

  // Clears the session and the local profile cache, then goes straight to
  // Login (not Home) and resets the stack so Back can't return to Profile.
  async function onLogout() {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: ROUTES.LOGIN }] });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const doctorSummary = doctor.name ? `${doctor.name} · ${doctor.phone}` : 'Not added yet';
  const pharmacySummary = pharmacy.name ? `${pharmacy.name} · ${pharmacy.phone}` : 'Not added yet';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(account?.fullName)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{account?.fullName || 'Your account'}</Text>
          {!!account?.email && <Text style={styles.headerLine}>{account.email}</Text>}
          {!!account?.phone && <Text style={styles.headerLine}>{account.phone}</Text>}
        </View>
      </View>

      {localOnly ? (
        <Text style={styles.notice}>
          Doctor, pharmacy and medicines are saved on this phone for now.
        </Text>
      ) : null}

      {!!error && <Text style={styles.error}>{error}</Text>}
      {!!saved && <Text style={styles.saved}>{saved}</Text>}

      <Disclosure
        title="My doctor"
        summary={doctorSummary}
        open={open === 'doctor'}
        onToggle={() => setOpen(open === 'doctor' ? null : 'doctor')}
      >
        <TextInput
          style={styles.input}
          placeholder="Doctor's name"
          value={doctor.name}
          onChangeText={(v) => setDoctor({ ...doctor, name: v })}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          keyboardType="phone-pad"
          value={doctor.phone}
          onChangeText={(v) => setDoctor({ ...doctor, phone: v })}
        />
        <TextInput
          style={styles.input}
          placeholder="Email (optional)"
          autoCapitalize="none"
          keyboardType="email-address"
          value={doctor.email}
          onChangeText={(v) => setDoctor({ ...doctor, email: v })}
        />
        <Pressable style={styles.saveButton} onPress={onSaveDoctor} accessibilityRole="button">
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </Disclosure>

      <Disclosure
        title="My pharmacy"
        summary={pharmacySummary}
        open={open === 'pharmacy'}
        onToggle={() => setOpen(open === 'pharmacy' ? null : 'pharmacy')}
      >
        <TextInput
          style={styles.input}
          placeholder="Pharmacy name"
          value={pharmacy.name}
          onChangeText={(v) => setPharmacy({ ...pharmacy, name: v })}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          keyboardType="phone-pad"
          value={pharmacy.phone}
          onChangeText={(v) => setPharmacy({ ...pharmacy, phone: v })}
        />
        <Pressable style={styles.saveButton} onPress={onSavePharmacy} accessibilityRole="button">
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </Disclosure>

      <Text style={styles.sectionTitle}>Medicines I take now</Text>
      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, styles.addInput]}
          placeholder="e.g. Metformin"
          value={newMedication}
          onChangeText={setNewMedication}
          onSubmitEditing={onAddMedication}
        />
        <Pressable style={styles.addButton} onPress={onAddMedication} accessibilityRole="button">
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>

      {medications.length === 0 ? (
        <Text style={styles.empty}>Nothing added yet.</Text>
      ) : (
        medications.map((m) => (
          <View key={String(m.id)} style={styles.medRow}>
            <Text style={styles.medName}>{m.name}</Text>
            <Pressable onPress={() => onRemoveMedication(m.id)} accessibilityRole="button">
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          </View>
        ))
      )}

      <Pressable onPress={onLogout} accessibilityRole="button">
        <Text style={styles.logout}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.primaryDark, fontSize: 18, fontWeight: '700' },
  headerInfo: { flex: 1 },
  name: { fontSize: 19, fontWeight: '700', color: COLORS.ink },
  headerLine: { fontSize: 13, color: COLORS.slate, marginTop: 1 },
  notice: { fontSize: 12, color: COLORS.muted, marginBottom: 14 },
  error: { color: COLORS.danger, marginBottom: 10, fontSize: 13 },
  saved: { color: COLORS.success, marginBottom: 10, fontSize: 13 },

  disclosure: {
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
  },
  disclosureHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  disclosureTitle: { fontSize: 15, fontWeight: '600', color: COLORS.ink },
  disclosureSummary: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  chevron: { fontSize: 14, color: COLORS.muted },
  disclosureBody: { marginTop: 12, gap: 8 },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    padding: 10,
    fontSize: 14,
    color: COLORS.ink,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
  },
  saveButtonText: { color: COLORS.white, fontWeight: '600', fontSize: 13 },

  sectionTitle: { fontSize: 15, fontWeight: '600', color: COLORS.ink, marginTop: 20, marginBottom: 8 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  addInput: { flex: 1 },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 9,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addButtonText: { color: COLORS.white, fontWeight: '600', fontSize: 13 },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
  },
  medName: { fontSize: 14, color: COLORS.slate, flex: 1 },
  remove: { color: COLORS.danger, fontSize: 13, fontWeight: '600' },
  empty: { color: COLORS.muted, fontStyle: 'italic', fontSize: 13 },
  logout: { marginTop: 28, color: COLORS.danger, fontWeight: '600', textAlign: 'center', fontSize: 14 },
});

import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { hasToken, logout, getStoredUser, deleteAccount } from '../services/api';
import {
  loadContacts,
  storeDoctor,
  storePharmacy,
  loadMedications,
  storeMedication,
  removeMedication,
} from '../services/profileStore';
import { ROUTES } from '../navigation/routes';
import { Screen, Title, Body, Button, Card, Field, Chip, SectionTitle, Notice } from '../components/ui';
import Icon from '../components/Icon';
import { COLORS, FONTS } from '../constants/theme';

function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';
}

// A row that opens into a small form, instead of showing it always.
function Disclosure({ icon, title, summary, open, onToggle, children, first }) {
  return (
    <View style={!first && styles.divider}>
      <Pressable style={styles.discHead} onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <Icon name={icon} size={22} color={COLORS.primary} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.rowLabel}>{title}</Text>
          <Text style={styles.rowValue}>{summary}</Text>
        </View>
        <Icon name="chevron" size={20} color={COLORS.muted} />
      </Pressable>
      {open && <View style={styles.discBody}>{children}</View>}
    </View>
  );
}

// Who to call, what the person already takes, and the account itself.
export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [localOnly, setLocalOnly] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [open, setOpen] = useState(null); // 'doctor' | 'pharmacy' | null
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      // Show the saved account at once, then load the rest in parallel.
      const user = await getStoredUser();
      setAccount(user);
      setLoading(false);
      const [contacts, meds] = await Promise.all([loadContacts(), loadMedications()]);
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
      const res = await storeDoctor({ name: doctor.name.trim(), phone: doctor.phone.trim(), email: doctor.email.trim() });
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
      const res = await storePharmacy({ name: pharmacy.name.trim(), phone: pharmacy.phone.trim() });
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

  // Clears the session and local cache, then resets so Back can't return here.
  async function onLogout() {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: ROUTES.LOGIN }] });
  }

  async function onDeleteAccount() {
    setError('');
    setDeleting(true);
    try {
      await deleteAccount();
      await logout();
      navigation.reset({ index: 0, routes: [{ name: ROUTES.WELCOME }] });
    } catch (e) {
      setDeleting(false);
      setError(
        e?.status === 404
          ? 'Deleting accounts is not available yet. Please try again later.'
          : e?.message || 'Could not delete your account.',
      );
    }
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </Screen>
    );
  }

  const doctorSummary = doctor.name ? `${doctor.name} · ${doctor.phone}` : 'Add your doctor';
  const pharmacySummary = pharmacy.name ? `${pharmacy.name} · ${pharmacy.phone}` : 'Add your pharmacy';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(account?.fullName)}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Title size={22}>{account?.fullName || 'Your account'}</Title>
            {!!account?.email && <Body size={14} color={COLORS.muted}>{account.email}</Body>}
            {!!account?.phone && <Body size={14} color={COLORS.muted}>{account.phone}</Body>}
          </View>
        </View>

        {localOnly ? <Notice text="Some of your details are saved on this phone only for now." tone="warn" /> : null}
        {!!error && <Notice text={error} tone="error" />}
        {!!saved && <Notice text={saved} tone="success" />}

        <Card style={{ gap: 0, paddingVertical: 8 }}>
          <SectionTitle style={{ marginVertical: 6 }}>My care team</SectionTitle>
          <Disclosure
            first
            icon="doctor"
            title="My doctor"
            summary={doctorSummary}
            open={open === 'doctor'}
            onToggle={() => setOpen(open === 'doctor' ? null : 'doctor')}
          >
            <Field label="Doctor's name" value={doctor.name} onChangeText={(v) => setDoctor({ ...doctor, name: v })} />
            <Field label="Phone number" keyboardType="phone-pad" value={doctor.phone} onChangeText={(v) => setDoctor({ ...doctor, phone: v })} />
            <Field
              label="Email (optional)"
              autoCapitalize="none"
              keyboardType="email-address"
              value={doctor.email}
              onChangeText={(v) => setDoctor({ ...doctor, email: v })}
            />
            <Button title="Save" onPress={onSaveDoctor} />
          </Disclosure>
          <Disclosure
            icon="store"
            title="My pharmacy"
            summary={pharmacySummary}
            open={open === 'pharmacy'}
            onToggle={() => setOpen(open === 'pharmacy' ? null : 'pharmacy')}
          >
            <Field label="Pharmacy name" value={pharmacy.name} onChangeText={(v) => setPharmacy({ ...pharmacy, name: v })} />
            <Field label="Phone number" keyboardType="phone-pad" value={pharmacy.phone} onChangeText={(v) => setPharmacy({ ...pharmacy, phone: v })} />
            <Button title="Save" onPress={onSavePharmacy} />
          </Disclosure>
        </Card>

        <Card style={{ padding: 16 }}>
          <SectionTitle>Medicines I take</SectionTitle>
          <View style={styles.addRow}>
            <Field
              placeholder="e.g. Metformin"
              value={newMedication}
              onChangeText={setNewMedication}
              onSubmitEditing={onAddMedication}
              style={{ flex: 1 }}
            />
            <Button title="Add" onPress={onAddMedication} style={{ paddingHorizontal: 18 }} />
          </View>
          {medications.length === 0 ? (
            <Body size={14} color={COLORS.muted}>Nothing added yet.</Body>
          ) : (
            <View style={styles.wrap}>
              {medications.map((m) => (
                <Pressable
                  key={String(m.id)}
                  onPress={() => onRemoveMedication(m.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${m.name}`}
                  style={styles.medChip}
                >
                  <Icon name="pill" size={14} color={COLORS.primaryDark} />
                  <Text style={styles.medText}>{m.name}</Text>
                  <Icon name="x" size={14} color={COLORS.primaryDark} />
                </Pressable>
              ))}
            </View>
          )}
        </Card>

        <Card style={{ gap: 0, paddingVertical: 4 }}>
          <Pressable onPress={() => navigation.navigate(ROUTES.HISTORY)} accessibilityRole="button" style={[styles.discHead, styles.divider]}>
            <Icon name="pin" size={22} color={COLORS.primary} />
            <Text style={[styles.rowValue, { flex: 1 }]}>My history</Text>
            <Icon name="chevron" size={20} color={COLORS.muted} />
          </Pressable>
          <Pressable onPress={onLogout} accessibilityRole="button" style={styles.discHead}>
            <Icon name="logout" size={22} color={COLORS.primary} />
            <Text style={[styles.rowValue, { flex: 1 }]}>Log out</Text>
            <Icon name="chevron" size={20} color={COLORS.muted} />
          </Pressable>
          <Pressable
            onPress={() => setConfirmDelete(true)}
            accessibilityRole="button"
            style={[styles.discHead, styles.divider]}
          >
            <Icon name="trash" size={22} color={COLORS.danger} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.rowValue, { color: COLORS.danger }]}>Delete my account</Text>
              <Text style={styles.rowLabel}>Permanently removes your data</Text>
            </View>
            <Icon name="chevron" size={20} color={COLORS.muted} />
          </Pressable>
          {confirmDelete && (
            <View style={styles.confirm}>
              <Body size={14} color={COLORS.ink}>
                This deletes your account, allergies, medicines, doctor and pharmacy. It cannot be undone.
              </Body>
              <View style={styles.addRow}>
                <Button title="Cancel" kind="ghost" onPress={() => setConfirmDelete(false)} style={{ flex: 1 }} />
                <Button title="Delete" kind="danger" busy={deleting} onPress={onDeleteAccount} style={{ flex: 1 }} />
              </View>
            </View>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 12, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primaryDark,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: FONTS.display, fontSize: 22, color: COLORS.white },
  divider: { borderTopWidth: 1, borderTopColor: COLORS.border },
  discHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, minHeight: 52 },
  discBody: { gap: 12, paddingBottom: 14 },
  rowLabel: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted },
  rowValue: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.ink },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  medChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, minHeight: 36,
    borderRadius: 999, backgroundColor: COLORS.primarySoft,
  },
  medText: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.primaryDark },
  confirm: { gap: 12, padding: 14, marginBottom: 12, borderRadius: 14, backgroundColor: COLORS.dangerBg },
});

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Screen, Title, Body, Button, Logo } from '../components/ui';
import Icon from '../components/Icon';
import { saveConsent } from '../services/api';
import { ROUTES } from '../navigation/routes';
import { COLORS, FONTS } from '../constants/theme';

const POINTS = [
  ['camera', 'Snap the box or search the name'],
  ['shieldCheck', 'See if it is on the Rwanda FDA list'],
  ['allergy', 'Get warned about your allergies and medicines'],
];

export default function WelcomeScreen({ navigation }) {
  const [agreed, setAgreed] = useState(false);

  async function go(route) {
    await saveConsent();
    navigation.replace(route);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <Logo size={40} />
          <Text style={styles.brandText}>MediCheck</Text>
        </View>

        <View style={styles.art}>
          <View style={[styles.ring, { width: 260, height: 260, left: -60, top: -40 }]} />
          <View style={[styles.ring, { width: 180, height: 180, right: -40, bottom: -60 }]} />
          <View style={styles.seal}>
            <Icon name="shieldCheck" size={62} color={COLORS.primary} />
          </View>
          <View style={styles.sunDot} />
        </View>

        <Title size={28}>Know your medicine before you take it</Title>

        <View style={{ gap: 12 }}>
          {POINTS.map(([icon, text]) => (
            <View key={text} style={styles.point}>
              <Icon name={icon} size={22} color={COLORS.primary} />
              <Body>{text}</Body>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => setAgreed((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          style={[styles.consent, agreed && styles.consentOn]}
        >
          <View style={[styles.box, agreed && styles.boxOn]}>
            {agreed ? <Icon name="check" size={16} color={COLORS.white} /> : null}
          </View>
          <Text style={styles.consentText}>
            I understand MediCheck gives information only and does not replace my doctor or pharmacist.
            Photos are read, then deleted.
          </Text>
        </Pressable>

        <View style={{ gap: 6 }}>
          <Button title="Get started" disabled={!agreed} onPress={() => go(ROUTES.SIGN_UP)} />
          <Pressable
            disabled={!agreed}
            onPress={() => go(ROUTES.LOGIN)}
            accessibilityRole="button"
            style={[styles.link, !agreed && { opacity: 0.5 }]}
          >
            <Text style={styles.linkText}>I already have an account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 20 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8 },
  brandText: { fontFamily: FONTS.display, fontSize: 20, color: COLORS.ink },
  art: {
    height: 200, borderRadius: 28, backgroundColor: COLORS.primaryDark, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)' },
  seal: {
    width: 112, height: 112, borderRadius: 34, backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
  },
  sunDot: { position: 'absolute', right: 28, top: 30, width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.sun },
  point: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  consent: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14, borderRadius: 16,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
  },
  consentOn: { borderColor: COLORS.primary },
  box: {
    width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: COLORS.muted,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  boxOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  consentText: { flex: 1, fontFamily: FONTS.regular, fontSize: 13, lineHeight: 19, color: COLORS.slate },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkText: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.primary },
});

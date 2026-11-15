import React from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from './Icon';
import { COLORS, FONTS, RADIUS } from '../constants/theme';
import { STATUS_STYLES, FALLBACK_STATUS } from '../constants/statusStyles';

export function Screen({ children, dark = false, style }) {
  return (
    <SafeAreaView
      edges={['top']}
      style={[{ flex: 1, backgroundColor: dark ? COLORS.night : COLORS.background }, style]}
    >
      {children}
    </SafeAreaView>
  );
}

export function Header({ title, onBack, dark = false, right = null }) {
  const color = dark ? COLORS.white : COLORS.ink;
  return (
    <View style={s.header}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={[s.backBtn, dark && s.backBtnDark]}
        >
          <Icon name="back" color={color} />
        </Pressable>
      ) : null}
      <Text style={[s.headerTitle, { color }]} numberOfLines={1}>{title}</Text>
      {right}
    </View>
  );
}

export function Title({ children, size = 26, style }) {
  return <Text style={[s.title, { fontSize: size }, style]}>{children}</Text>;
}

export function SectionTitle({ children, style }) {
  return <Text style={[s.section, style]}>{children}</Text>;
}

export function Body({ children, size = 15, color = COLORS.slate, style }) {
  return <Text style={[s.body, { fontSize: size, color }, style]}>{children}</Text>;
}

export function Logo({ size = 44 }) {
  return (
    <View style={[s.logo, { width: size, height: size, borderRadius: size * 0.3 }]}>
      <Icon name="shieldCheck" size={size * 0.6} color={COLORS.white} />
    </View>
  );
}

const BUTTON = {
  primary: { bg: COLORS.primary, fg: COLORS.white, border: COLORS.primary },
  ghost: { bg: COLORS.white, fg: COLORS.ink, border: COLORS.border },
  soft: { bg: COLORS.primarySoft, fg: COLORS.primaryDark, border: COLORS.primarySoft },
  danger: { bg: COLORS.danger, fg: COLORS.white, border: COLORS.danger },
  dangerGhost: { bg: COLORS.white, fg: COLORS.danger, border: COLORS.dangerBorder },
};

export function Button({ title, onPress, kind = 'primary', icon, busy = false, disabled = false, style }) {
  const c = BUTTON[kind];
  const off = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy }}
      style={({ pressed }) => [
        s.button,
        { backgroundColor: c.bg, borderColor: c.border, opacity: off ? 0.55 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {busy ? <ActivityIndicator color={c.fg} /> : icon ? <Icon name={icon} size={20} color={c.fg} /> : null}
      <Text style={[s.buttonText, { color: c.fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, icon, style, inputStyle, multiline, ...props }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={s.inputWrap}>
        {icon ? (
          <View style={s.inputIcon}>
            <Icon name={icon} size={20} color={COLORS.muted} />
          </View>
        ) : null}
        <TextInput
          placeholderTextColor={COLORS.muted}
          accessibilityLabel={label || props.placeholder}
          multiline={multiline}
          style={[
            s.input,
            icon && { paddingLeft: 44 },
            multiline && { height: 104, paddingTop: 12, textAlignVertical: 'top' },
            inputStyle,
          ]}
          {...props}
        />
      </View>
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Chip({ label, color = COLORS.slate, background = COLORS.neutralBg, icon, style }) {
  return (
    <View style={[s.chip, { backgroundColor: background }, style]}>
      {icon ? <Icon name={icon} size={14} color={color} /> : null}
      <Text style={[s.chipText, { color }]}>{label}</Text>
    </View>
  );
}

// A selectable pill: filters, severities, report reasons.
export function Toggle({ label, on, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={[s.toggle, on && s.toggleOn]}
    >
      <Text style={[s.toggleText, on && s.toggleTextOn]}>{label}</Text>
    </Pressable>
  );
}

export function statusOf(status) {
  return STATUS_STYLES[status] ?? { ...FALLBACK_STATUS, label: String(status || 'Unknown') };
}

export function StatusChip({ status }) {
  const st = statusOf(status);
  return <Chip label={st.label} color={st.color} background={st.background} icon={st.icon} />;
}

export function StatusHero({ status, message }) {
  const st = statusOf(status);
  return (
    <View
      style={[s.hero, { backgroundColor: st.background }]}
      accessible
      accessibilityLabel={`Status: ${st.label}. ${message || ''}`}
      testID="status-card"
    >
      <View style={[s.heroSeal, { borderColor: st.color }]}>
        <Icon name={st.icon} size={34} color={st.color} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[s.heroLabel, { color: st.color }]}>{st.label}</Text>
        {message ? <Text style={s.heroMessage}>{message}</Text> : null}
      </View>
    </View>
  );
}

const ROW = {
  ok: [COLORS.success, 'check'],
  warn: [COLORS.warning, 'alert'],
  bad: [COLORS.danger, 'alert'],
  na: [COLORS.neutral, 'help'],
};

// One line of the "Your safety check" card.
export function SafetyRow({ icon, label, value, state = 'na', first = false }) {
  const [color, mark] = ROW[state];
  return (
    <View style={[s.safetyRow, !first && s.rowDivider]}>
      <Icon name={icon} size={22} color={COLORS.slate} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowValue}>{value}</Text>
      </View>
      <Icon name={mark} size={22} color={color} />
    </View>
  );
}

export function ListRow({ icon, iconColor = COLORS.primary, label, value, valueColor, onPress, first = false }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[s.safetyRow, !first && s.rowDivider]}>
      <Icon name={icon} size={22} color={iconColor} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={[s.rowValue, valueColor && { color: valueColor }]}>{value}</Text>
      </View>
      <Icon name="chevron" size={20} color={COLORS.muted} />
    </Pressable>
  );
}

export function Notice({ text, tone = 'info', style }) {
  const t = {
    info: [COLORS.primaryDark, COLORS.primarySoft, 'info'],
    warn: [COLORS.warning, COLORS.warningBg, 'info'],
    error: [COLORS.danger, COLORS.dangerBg, 'alert'],
    success: [COLORS.success, COLORS.successBg, 'checkCircle'],
  }[tone];
  return (
    <View style={[s.notice, { backgroundColor: t[1] }, style]} accessibilityLiveRegion="polite">
      <Icon name={t[2]} size={18} color={t[0]} />
      <Text style={[s.noticeText, { color: t[0] }]}>{text}</Text>
    </View>
  );
}

export const ui = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 32, gap: 16 },
  row: { flexDirection: 'row', gap: 10 },
});

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  backBtnDark: { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'transparent' },
  headerTitle: { flex: 1, fontFamily: FONTS.heading, fontSize: 18 },
  title: { fontFamily: FONTS.display, color: COLORS.ink, letterSpacing: -0.4, lineHeight: 34 },
  section: { fontFamily: FONTS.heading, fontSize: 16, color: COLORS.ink },
  body: { fontFamily: FONTS.regular, lineHeight: 22 },
  logo: { backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  button: {
    minHeight: 52, borderRadius: RADIUS.md, borderWidth: 1.5, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  buttonText: { fontFamily: FONTS.semibold, fontSize: 16 },
  label: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.slate },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 14, top: 15, zIndex: 1 },
  input: {
    minHeight: 50, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.white, paddingHorizontal: 14, fontFamily: FONTS.regular,
    fontSize: 16, color: COLORS.ink,
  },
  card: {
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: 18, gap: 12,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill,
  },
  chipText: { fontFamily: FONTS.bold, fontSize: 12 },
  toggle: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: RADIUS.pill,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white,
  },
  toggleOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  toggleText: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.slate },
  toggleTextOn: { color: COLORS.primaryDark },
  hero: { borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroSeal: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.white, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  heroLabel: { fontFamily: FONTS.display, fontSize: 24 },
  heroMessage: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 20, color: COLORS.ink },
  safetyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowDivider: { borderTopWidth: 1, borderTopColor: COLORS.border },
  rowLabel: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted },
  rowValue: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.ink },
  notice: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 12, borderRadius: 14 },
  noticeText: { flex: 1, fontFamily: FONTS.regular, fontSize: 13, lineHeight: 19 },
});

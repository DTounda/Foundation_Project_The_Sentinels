import React from 'react';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const MAP = {
  home: ['f', 'home'],
  allergy: ['m', 'shield-plus-outline'],
  pin: ['f', 'map-pin'],
  user: ['f', 'user'],
  camera: ['f', 'camera'],
  search: ['f', 'search'],
  shieldCheck: ['m', 'shield-check-outline'],
  alert: ['f', 'alert-triangle'],
  info: ['f', 'info'],
  phone: ['f', 'phone'],
  chevron: ['f', 'chevron-right'],
  back: ['f', 'arrow-left'],
  flag: ['f', 'flag'],
  help: ['f', 'help-circle'],
  pill: ['m', 'pill'],
  check: ['f', 'check'],
  checkCircle: ['f', 'check-circle'],
  lock: ['f', 'lock'],
  trash: ['f', 'trash-2'],
  logout: ['f', 'log-out'],
  sun: ['f', 'sun'],
  frame: ['f', 'maximize'],
  hand: ['m', 'hand-back-right-outline'],
  x: ['f', 'x'],
  doctor: ['m', 'doctor'],
  store: ['m', 'storefront-outline'],
  hospital: ['m', 'hospital-building'],
  interact: ['m', 'vector-intersection'],
  plus: ['f', 'plus'],
  edit: ['f', 'edit-2'],
};

export default function Icon({ name, size = 22, color = COLORS.ink }) {
  const [set, glyph] = MAP[name] || MAP.help;
  const Set = set === 'f' ? Feather : MaterialCommunityIcons;
  return <Set name={glyph} size={size} color={color} />;
}

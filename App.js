import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Animated,
  PanResponder,
  SafeAreaView,
  Image,
  BackHandler,
  Share,
  ActivityIndicator,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { Pedometer } from 'expo-sensors';
import AuthScreen from './AuthScreen';


// ---------- GRADIENT ENGINE (zero external dependencies) ----------
// Real multi-stop linear gradients built by interpolating between hex colors
// across a stack of thin strips. Works inside Expo Snack with no extra package.
function _hexToRgb(hex) {
  let h = String(hex).replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function _rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
function _colorAt(colors, t) {
  const seg = colors.length - 1;
  const scaled = t * seg;
  const i = Math.min(Math.floor(scaled), seg - 1);
  const lt = scaled - i;
  const a = _hexToRgb(colors[i]);
  const b = _hexToRgb(colors[i + 1]);
  return _rgbToHex(a.r + (b.r - a.r) * lt, a.g + (b.g - a.g) * lt, a.b + (b.b - a.b) * lt);
}

// Style keys that describe how *children* are laid out (stay on the inner layer),
// everything else (size, radius, margins, shadow…) stays on the clipping container.
const _INNER_KEYS = [
  'flexDirection', 'alignItems', 'justifyContent', 'alignContent', 'gap', 'rowGap', 'columnGap',
  'padding', 'paddingHorizontal', 'paddingVertical', 'paddingTop', 'paddingBottom',
  'paddingLeft', 'paddingRight', 'paddingStart', 'paddingEnd',
];

function Grad({ colors, style, children, start, end }) {
  const list = Array.isArray(colors) && colors.length ? colors : ['#5B4FE9'];

  // Safety: if any stop isn't a hex string, fall back to a solid fill.
  const allHex = list.every((c) => typeof c === 'string' && c[0] === '#');
  if (!allHex || list.length === 1) {
    return <View style={[style, { backgroundColor: list[0] }]}>{children}</View>;
  }

  const sx = start?.x ?? 0, sy = start?.y ?? 0;
  const ex = end?.x ?? 0, ey = end?.y ?? 1;
  const horizontal = Math.abs(ex - sx) > Math.abs(ey - sy);
  const reversed = horizontal ? ex < sx : ey < sy;

  const STEPS = 22;
  const strips = [];
  for (let i = 0; i < STEPS; i++) {
    const t = i / (STEPS - 1);
    strips.push(_colorAt(list, reversed ? 1 - t : t));
  }

  const flat = StyleSheet.flatten(style) || {};
  const inner = {};
  const container = {};
  Object.keys(flat).forEach((k) => {
    if (_INNER_KEYS.includes(k)) inner[k] = flat[k];
    else container[k] = flat[k];
  });

  // Only stretch the content layer to fill the container when the container itself has an
  // explicit size to fill (avatars, banners, tab icons…). Without this guard, buttons that are
  // sized purely by their content (padding + text, e.g. s.startBtn) end up with a content layer
  // that has nothing definite to size against — on real devices this collapses to zero height,
  // so the button shows its gradient background but the label text never renders.
  const hasExplicitSize = ['width', 'height', 'minWidth', 'minHeight', 'flex'].some((k) => k in flat);

  return (
    <View style={[container, { overflow: 'hidden', backgroundColor: strips[0] }]}>
      <View style={[StyleSheet.absoluteFill, { flexDirection: horizontal ? 'row' : 'column' }]} pointerEvents="none">
        {strips.map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>
      <View style={[hasExplicitSize ? { flex: 1 } : null, inner]}>{children}</View>
    </View>
  );
}

// ---------- THEME ----------
const C = {
  primary: '#5B4FE9',
  primaryDark: '#4338CA',
  accent: '#22D3EE',
  // Richer, more energetic gradients for a sports app
  gradPurple: ['#6D5DF6', '#9333EA'],
  gradBlue: ['#3B9CF6', '#5B7CF6'],
  gradOrangePink: ['#FF7A45', '#EC4899'],
  gradGreen: ['#22C55E', '#10B981'],
  gradDark: ['#232748', '#0B0B14'],
  gradEnergy: ['#5B4FE9', '#22D3EE'],
  bg: '#F4F5FB',
  card: '#FFFFFF',
  dark: '#141726',
  gray: '#6B7280',
  light: '#9CA3AF',
  border: '#E9EBF2',
  danger: '#EF4444',
  chip: '#EEF0FF',
  white: '#FFFFFF',
  // Reusable soft shadow for elevated surfaces (cards, header, tab bar)
  shadow: {
    shadowColor: '#1B1C57',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
};

// ---------- MOCK DATA ----------
const SPORTS_TEAM = [
  { key: 'football', label: 'Football', emoji: '⚽' },
  { key: 'basket', label: 'Basket', emoji: '🏀' },
  { key: 'handball', label: 'Handball', emoji: '🤾' },
  { key: 'volleyball', label: 'Volleyball', emoji: '🏐' },
  { key: 'beachvolley', label: 'Beach-volley', emoji: '🏖️' },
  { key: 'rugby', label: 'Rugby', emoji: '🏈' },
  { key: 'footus', label: 'Football américain', emoji: '🏈' },
  { key: 'hockey', label: 'Hockey', emoji: '🏒' },
  { key: 'baseball', label: 'Baseball', emoji: '⚾' },
  { key: 'cricket', label: 'Cricket', emoji: '🏏' },
  { key: 'waterpolo', label: 'Water-polo', emoji: '🤽' },
  { key: 'ultimate', label: 'Ultimate', emoji: '🥏' },
  { key: 'futsal', label: 'Futsal', emoji: '⚽' },
  { key: 'tennis', label: 'Tennis', emoji: '🎾' },
  { key: 'padel', label: 'Padel', emoji: '🎾' },
  { key: 'badminton', label: 'Badminton', emoji: '🏸' },
  { key: 'pingpong', label: 'Ping-pong', emoji: '🏓' },
  { key: 'squash', label: 'Squash', emoji: '🎾' },
  { key: 'beachtennis', label: 'Beach tennis', emoji: '🏖️' },
  { key: 'pickleball', label: 'Pickleball', emoji: '🏓' },
];

const SPORTS_SOLO = [
  { key: 'course', label: 'Course à pied', emoji: '🏃' },
  { key: 'trail', label: 'Trail', emoji: '⛰️' },
  { key: 'marche', label: 'Marche', emoji: '🚶' },
  { key: 'marchenordique', label: 'Marche nordique', emoji: '🚶' },
  { key: 'randonnee', label: 'Randonnée', emoji: '🥾' },
  { key: 'triathlon', label: 'Triathlon', emoji: '🏊' },
  { key: 'velo', label: 'Vélo', emoji: '🚴' },
  { key: 'vtt', label: 'VTT', emoji: '🚵' },
  { key: 'bmx', label: 'BMX', emoji: '🚲' },
  { key: 'roller', label: 'Roller', emoji: '🛼' },
  { key: 'skate', label: 'Skate', emoji: '🛹' },
  { key: 'trottinette', label: 'Trottinette', emoji: '🛴' },
  { key: 'musculation', label: 'Musculation', emoji: '🏋️' },
  { key: 'pushup', label: 'Push-up', emoji: '💪' },
  { key: 'crossfit', label: 'Crossfit', emoji: '🤸' },
  { key: 'streetworkout', label: 'Street workout', emoji: '💪' },
  { key: 'fitness', label: 'Fitness', emoji: '💪' },
  { key: 'hiit', label: 'HIIT', emoji: '🔥' },
  { key: 'cardio', label: 'Cardio', emoji: '❤️' },
  { key: 'calisthenics', label: 'Calisthenics', emoji: '🤸' },
  { key: 'yoga', label: 'Yoga', emoji: '🧘' },
  { key: 'pilates', label: 'Pilates', emoji: '🧘' },
  { key: 'stretching', label: 'Stretching', emoji: '🤸' },
  { key: 'meditation', label: 'Méditation', emoji: '🧘' },
  { key: 'natation', label: 'Natation', emoji: '🏊' },
  { key: 'aquagym', label: 'Aquagym', emoji: '🌊' },
  { key: 'kayak', label: 'Kayak', emoji: '🛶' },
  { key: 'aviron', label: 'Aviron', emoji: '🚣' },
  { key: 'voile', label: 'Voile', emoji: '⛵' },
  { key: 'surf', label: 'Surf', emoji: '🏄' },
  { key: 'paddle', label: 'Paddle', emoji: '🏄' },
  { key: 'plongee', label: 'Plongée', emoji: '🤿' },
  { key: 'escalade', label: 'Escalade', emoji: '🧗' },
  { key: 'parcours', label: 'Parcours', emoji: '🏃' },
  { key: 'ski', label: 'Ski', emoji: '⛷️' },
  { key: 'snowboard', label: 'Snowboard', emoji: '🏂' },
  { key: 'skidefond', label: 'Ski de fond', emoji: '⛷️' },
  { key: 'patinage', label: 'Patinage', emoji: '⛸️' },
  { key: 'boxe', label: 'Boxe', emoji: '🥊' },
  { key: 'kickboxing', label: 'Kick-boxing', emoji: '🥊' },
  { key: 'mma', label: 'MMA', emoji: '🥊' },
  { key: 'judo', label: 'Judo', emoji: '🥋' },
  { key: 'karate', label: 'Karaté', emoji: '🥋' },
  { key: 'taekwondo', label: 'Taekwondo', emoji: '🥋' },
  { key: 'jiujitsu', label: 'Jiu-jitsu', emoji: '🥋' },
  { key: 'capoeira', label: 'Capoeira', emoji: '🤸' },
  { key: 'danse', label: 'Danse', emoji: '💃' },
  { key: 'zumba', label: 'Zumba', emoji: '💃' },
  { key: 'hiphop', label: 'Hip-hop', emoji: '🕺' },
  { key: 'equitation', label: 'Équitation', emoji: '🐴' },
  { key: 'golf', label: 'Golf', emoji: '⛳' },
  { key: 'trampoline', label: 'Trampoline', emoji: '🤸' },
  { key: 'gymnastique', label: 'Gymnastique', emoji: '🤸' },
  { key: 'tiralarc', label: "Tir à l'arc", emoji: '🏹' },
  { key: 'peche', label: 'Pêche', emoji: '🎣' },
  { key: 'bowling', label: 'Bowling', emoji: '🎳' },
  { key: 'billard', label: 'Billard', emoji: '🎱' },
  { key: 'flechettes', label: 'Fléchettes', emoji: '🎯' },
  { key: 'petanque', label: 'Pétanque', emoji: '🎯' },
  { key: 'parkour', label: 'Parkour', emoji: '🏃' },
];

const ALL_SPORTS = [...SPORTS_TEAM, ...SPORTS_SOLO];

const EVENTS = [
  { id: 'e1', sport: 'handball', emoji: '🤾', title: 'Match interne handball', host: 'Alice Runner', when: 'dans 2j', date: '15 juil., 20:00', loc: 'Gymnase Bercy', lat: 48.8384, lon: 2.3785, p: 3, max: 3 },
  { id: 'e2', sport: 'rugby', emoji: '🏈', title: 'Rencontre de rugby 2', host: 'King on Set', when: 'dans 7j', date: '20 juil., 10:00', loc: 'Parc des sports Perpignan', lat: 42.6887, lon: 2.8948, p: 1, max: 12 },
  { id: 'e3', sport: 'course', emoji: '🏃', title: 'Sortie matinale', host: 'Alice Runner', when: 'dans 3j', date: '21 juil., 08:00', loc: 'Paris', lat: 48.8566, lon: 2.3522, p: 1, max: 10 },
  { id: 'e4', sport: 'boxe', emoji: '🥊', title: 'Séance de boxe individuelle', host: 'Coach Mike', when: 'dans 1j', date: '16 juil., 18:00', loc: 'Boxing Club Paris', lat: 48.8566, lon: 2.3522, p: 0, max: 1, isCoachSession: true, coachBadge: 'CF-A1B2C3', coachPrice: 35, enableComments: true, enableLikes: true },
  { id: 'e5', sport: 'jiujitsu', emoji: '🥋', title: 'Cours de Jiu-Jitsu', host: 'Coach Sarah', when: 'dans 5j', date: '22 juil., 19:00', loc: 'Dojo Lyon Centre', lat: 45.7640, lon: 4.8357, p: 0, max: 2, isCoachSession: true, coachBadge: 'CF-D4E5F6', coachPrice: 40, enableComments: false, enableLikes: true },
];
// ---------- STORIES D'ACTIVITÉ ----------
const STORIES = [
  { id: 's1', userId: 'f1', name: 'Alice Runner', emoji: '🏃', type: 'run', data: '5.2 km', time: '2h', viewed: false, color: '#22C55E', friendsOnly: true },
  { id: 's2', userId: 'f2', name: 'Marc', emoji: '🏀', type: 'basket', data: '12 pts', time: '4h', viewed: false, color: '#F59E0B', friendsOnly: true },
  { id: 's3', userId: 'f3', name: 'Sofia', emoji: '🧘', type: 'yoga', data: '45 min', time: '6h', viewed: true, color: '#EC4899', friendsOnly: true },
  { id: 's4', userId: 'f4', name: 'Cal Tester', emoji: '⚡', type: 'hiit', data: '320 kcal', time: '8h', viewed: false, color: '#EF4444', friendsOnly: false },
  { id: 's5', userId: 'me', name: 'Moi', emoji: '👤', type: 'personal', data: 'Ajouter', time: '', viewed: true, color: C.primary, isMine: true },
];



// ---------- PROFILS RENCONTRES (BATTLE & DATE) ----------
const PROFILES = [
  { id: 'p1', name: 'Léa', age: 24, gender: 'female', city: 'Paris', sport: 'course', emoji: '🏃', bio: 'Marathonienne en quête de challenge !', ageMin: 22, ageMax: 30, mode: 'battle', photo: '👩' },
  { id: 'p2', name: 'Thomas', age: 28, gender: 'male', city: 'Lyon', sport: 'basket', emoji: '🏀', bio: 'Meneur de jeu, toujours partant pour un 1v1', ageMin: 24, ageMax: 32, mode: 'battle', photo: '👨' },
  { id: 'p3', name: 'Sophie', age: 26, gender: 'female', city: 'Marseille', sport: 'tennis', emoji: '🎾', bio: 'Recherche partenaire de tennis régulier', ageMin: 24, ageMax: 35, mode: 'battle', photo: '👩' },
  { id: 'p4', name: 'Marc', age: 30, gender: 'male', city: 'Bordeaux', sport: 'football', emoji: '⚽', bio: 'Attaquant rapide, niveau confirmé', ageMin: 25, ageMax: 35, mode: 'battle', photo: '👨' },
  { id: 'p5', name: 'Emma', age: 22, gender: 'female', city: 'Paris', sport: 'yoga', emoji: '🧘', bio: 'Prof de yoga, cherche partenaire de méditation', ageMin: 20, ageMax: 30, mode: 'battle', photo: '👩' },
  { id: 'p6', name: 'Julie', age: 25, gender: 'female', city: 'Nice', sport: 'course', emoji: '🏃', bio: 'Courir au lever du soleil sur la Promenade', ageMin: 23, ageMax: 32, mode: 'date', photo: '👩' },
  { id: 'p7', name: 'Alex', age: 27, gender: 'male', city: 'Paris', sport: 'velo', emoji: '🚴', bio: 'Cycliste urbain, amateur de café et de balades', ageMin: 22, ageMax: 30, mode: 'date', photo: '👨' },
  { id: 'p8', name: 'Chloé', age: 29, gender: 'female', city: 'Lille', sport: 'escalade', emoji: '🧗', bio: 'Grimpeuse passionnée, cherche complice', ageMin: 25, ageMax: 35, mode: 'date', photo: '👩' },
  { id: 'p9', name: 'Lucas', age: 26, gender: 'male', city: 'Toulouse', sport: 'rugby', emoji: '🏈', bio: 'Rugbyman gentil, cherche aventure sportive', ageMin: 22, ageMax: 30, mode: 'date', photo: '👨' },
  { id: 'p10', name: 'Camille', age: 23, gender: 'female', city: 'Rennes', sport: 'danse', emoji: '💃', bio: 'Danseuse classique, rêve de duo parfait', ageMin: 21, ageMax: 28, mode: 'date', photo: '👩' },
];

// Simule le profil utilisateur connecté (remplacé par le genre choisi à l'inscription si disponible)
const CURRENT_USER = { gender: 'male', age: 27 }; // Valeur par défaut si pas de compte connecté

function filterProfilesByGender(profiles, userGender) {
  // On ne filtre plus uniquement sur le genre opposé : les demandes de
  // battle/entraînement doivent aussi être possibles entre personnes du
  // même genre (homme-homme, femme-femme). Le genre opposé n'est plus
  // une restriction d'affichage — voir isSameGender() pour le floutage.
  return profiles;
}

// Indique si un profil est du même genre que l'utilisateur courant.
// Utilisé pour flouter la photo par défaut entre personnes de même genre.
function isSameGender(profile, userGender) {
  return profile.gender === userGender;
}

function filterProfilesByAge(profiles, userAge) {
  // Ne montre que les profils dont la tranche d'âge inclut l'âge de l'utilisateur
  return profiles.filter((p) => userAge >= p.ageMin && userAge <= p.ageMax);
}


// Inscriptions aux événements partagées (AsyncStorage) entre "Trouver une rencontre"
// (swipe) et "Trouver un événement" (liste), pour que les deux écrans restent cohérents.
async function getJoinedEventIds() {
  try {
    const raw = await AsyncStorage.getItem('joined_events_v1');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

async function setEventJoined(eventId, joined) {
  const current = await getJoinedEventIds();
  const next = joined ? Array.from(new Set([...current, eventId])) : current.filter((id) => id !== eventId);
  try {
    await AsyncStorage.setItem('joined_events_v1', JSON.stringify(next));
  } catch (e) {}
  return next;
}

const VENUES = [
  { id: 'v1', emoji: '⚽', name: 'Five — Paris Centre', tags: ['FOOTBALL', 'BASKET'], addr: '15 rue de Rivoli, Paris', price: '80€' },
  { id: 'v2', emoji: '🎾', name: 'Padel Lab Bercy', tags: ['PADEL', 'TENNIS'], addr: '40 quai de Bercy, Paris', price: '40€' },
  { id: 'v3', emoji: '🤸', name: 'Iron Gym Box', tags: ['CROSSFIT', 'BOXE'], addr: '44 rue de la Pompe, Paris', price: '25€' },
];

// Coordonnées approximatives (niveau ville), utilisées pour trier les terrains publics
// du plus proche au plus loin de la position de l'utilisateur.
const CITY_COORDS = {
  'Paris': [48.8566, 2.3522],
  'Saint-Denis': [48.9362, 2.3574],
  'Lyon': [45.7640, 4.8357],
  'Décines-Charpieu (Lyon)': [45.7719, 4.9506],
  'Marseille': [43.2965, 5.3698],
  'Lille': [50.6292, 3.0573],
  'Villeneuve-d’Ascq (Lille)': [50.6278, 3.1425],
  'Rennes': [48.1173, -1.6778],
  'Nice': [43.7102, 7.2620],
  'Bordeaux': [44.8378, -0.5792],
  'Saint-Étienne': [45.4397, 4.3872],
  'Toulouse': [43.6047, 1.4442],
  'Nantes': [47.2184, -1.5536],
  'Lens': [50.4322, 2.8312],
  'Le Mans': [48.0061, 0.1996],
  'Le Havre': [49.4944, 0.1079],
  'Reims': [49.2583, 4.0317],
  'Montpellier': [43.6108, 3.8767],
  'Brest': [48.3904, -4.4861],
  'Nancy': [48.6921, 6.1844],
  'Dijon': [47.3220, 5.0415],
  'Angers': [47.4784, -0.5632],
  'Troyes': [48.2973, 4.0744],
  'Lorient': [47.7482, -3.3660],
  'Caen': [49.1829, -0.3707],
  'Metz': [49.1193, 6.1757],
  'Rouen': [49.4431, 1.0993],
  'Auxerre': [47.7982, 3.5738],
  'Grenoble': [45.1885, 5.7245],
  'Valenciennes': [50.3574, 3.5233],
  'Clermont-Ferrand': [45.7772, 3.0870],
  'Bayonne': [43.4933, -1.4748],
  'Perpignan': [42.6887, 2.8948],
  'Aubervilliers': [48.9145, 2.3833],
  'Colombes': [48.9231, 2.2536],
  'La Courneuve': [48.9356, 2.3897],
  'Wattignies': [50.5975, 3.0575],
  'Créteil': [48.7904, 2.4556],
  'Rodez': [44.3506, 2.5734],
  'Amiens': [49.8942, 2.2957],
  'Boulogne-Billancourt': [48.8352, 2.2412],
  'Saint-Quentin-en-Yvelines': [48.7833, 2.0500],
  'Strasbourg': [48.5734, 7.7521],
  'Nîmes': [43.8367, 4.3601],
  'Avignon': [43.9493, 4.8055],
  'Tours': [47.3941, 0.6848],
  'Orléans': [47.9029, 1.9093],
  'Limoges': [45.8336, 1.2611],
  'Poitiers': [46.5802, 0.3404],
  'Pau': [43.2951, -0.3708],
  'Annecy': [45.8992, 6.1294],
  'Besançon': [47.2378, 6.0241],
  'Mulhouse': [47.7508, 7.3359],
  'Toulon': [43.1242, 5.9280],
  'Saint-Nazaire': [47.2733, -2.2137],
  'Chambéry': [45.5646, 5.9178],
  'La Rochelle': [46.1603, -1.1511],
  'Béziers': [43.3442, 3.2158],
  'Calais': [50.9513, 1.8587],
  'Dunkerque': [51.0343, 2.3768],
  'Vannes': [47.6582, -2.7608],
  'Quimper': [47.9960, -4.1024],
  'Cannes': [43.5528, 7.0174],
  'Antibes': [43.5804, 7.1251],
  'Ajaccio': [41.9192, 8.7386],
  'Bastia': [42.7028, 9.4508],
  'Saint-Malo': [48.6493, -1.9995],
  'Biarritz': [43.4832, -1.5586],
  'Aix-en-Provence': [43.5297, 5.4474],
  'Angoulême': [45.6486, 0.1562],
  'Niort': [46.3239, -0.4585],
  'Bourges': [47.081, 2.3987],
  'Châteauroux': [46.8106, 1.6911],
  'Blois': [47.5861, 1.3359],
  'Chartres': [48.4439, 1.4894],
  'Compiègne': [49.418, 2.826],
  'Beauvais': [49.4295, 2.0807],
  'Laval': [48.0733, -0.7708],
  'Cholet': [47.0605, -0.8794],
  'Saint-Brieuc': [48.514, -2.7654],
  'Douai': [50.3714, 3.0797],
  'Béthune': [50.5297, 2.6382],
  'Arras': [50.291, 2.777],
  'Cambrai': [50.1763, 3.2358],
  'Charleville-Mézières': [49.7738, 4.7196],
  'Épinal': [48.1739, 6.4497],
  'Belfort': [47.6386, 6.8631],
  'Chalon-sur-Saône': [46.7806, 4.8524],
  'Mâcon': [46.3067, 4.8283],
  'Bourg-en-Bresse': [46.2054, 5.2258],
  'Roanne': [46.0333, 4.0667],
  'Vichy': [46.1273, 3.4265],
  'Montluçon': [46.3403, 2.6039],
  'Aurillac': [44.9282, 2.446],
  'Le Puy-en-Velay': [45.043, 3.885],
  'Albi': [43.9297, 2.148],
  'Castres': [43.6047, 2.241],
  'Montauban': [44.018, 1.355],
  'Agen': [44.2049, 0.6188],
  'Carcassonne': [43.213, 2.3491],
  'Narbonne': [43.1839, 3.0038],
  'Sète': [43.4028, 3.6967],
  'Alès': [44.125, 4.0833],
  'Gap': [44.5594, 6.079],
  'Fréjus': [43.4331, 6.737],
  'Hyères': [43.1204, 6.1286],
  'Martigues': [43.4055, 5.0473],
  'Salon-de-Provence': [43.6403, 5.0972],
  'Arles': [43.6767, 4.6278],
  'Valence': [44.9334, 4.8924],
  'Villeurbanne': [45.7667, 4.8794],
  'Thonon-les-Bains': [46.3706, 6.4778],
  'Épernay': [49.0447, 3.96],
  'Évreux': [49.027, 1.151],
  'Saint-Lô': [49.1147, -1.09],
  'Cherbourg-en-Cotentin': [49.6337, -1.6222],
  'Alençon': [48.43, 0.0919],
  'La Roche-sur-Yon': [46.67, -1.4267],
};

// Grands stades publics français, utilisés pour l'autocomplétion du champ "Lieu"
// dans la création d'événement.
const FRENCH_STADIUMS = [
  { name: 'Stade de France', city: 'Saint-Denis' },
  { name: 'Parc des Princes', city: 'Paris' },
  { name: 'Stade Jean-Bouin', city: 'Paris' },
  { name: 'Orange Vélodrome', city: 'Marseille' },
  { name: 'Groupama Stadium', city: 'Décines-Charpieu (Lyon)' },
  { name: 'Stade Pierre-Mauroy', city: 'Villeneuve-d’Ascq (Lille)' },
  { name: 'Roazhon Park', city: 'Rennes' },
  { name: 'Allianz Riviera', city: 'Nice' },
  { name: 'Matmut Atlantique', city: 'Bordeaux' },
  { name: 'Stade Geoffroy-Guichard', city: 'Saint-Étienne' },
  { name: 'Stadium de Toulouse', city: 'Toulouse' },
  { name: 'Stade de la Beaujoire', city: 'Nantes' },
  { name: 'Stade Bollaert-Delelis', city: 'Lens' },
  { name: 'MMArena', city: 'Le Mans' },
  { name: 'Stade Océane', city: 'Le Havre' },
  { name: 'Stade Auguste-Delaune', city: 'Reims' },
  { name: 'Stade de la Mosson', city: 'Montpellier' },
  { name: 'Stade Francis-Le Blé', city: 'Brest' },
  { name: 'Stade Marcel-Picot', city: 'Nancy' },
  { name: 'Stade Gaston-Gérard', city: 'Dijon' },
  { name: 'Stade Chaban-Delmas', city: 'Bordeaux' },
  { name: 'Stade Raymond-Kopa', city: 'Angers' },
  { name: 'Stade de l’Aube', city: 'Troyes' },
  { name: 'Stade du Moustoir', city: 'Lorient' },
  { name: 'Stade Michel-d’Ornano', city: 'Caen' },
  { name: 'Stade Saint-Symphorien', city: 'Metz' },
  { name: 'Stade Charléty', city: 'Paris' },
  { name: 'Vélodrome Jacques-Anquetil', city: 'Paris' },
  { name: 'Stade Robert-Diochon', city: 'Rouen' },
  { name: 'Stade de l’Abbé-Deschamps', city: 'Auxerre' },
  { name: 'Stade Marcel-Verchère', city: 'Grenoble' },
  { name: 'Stade des Alpes', city: 'Grenoble' },
  { name: 'Stade Nungesser', city: 'Valenciennes' },
  { name: 'Stade Léon-Bollée', city: 'Le Mans' },
  { name: 'Stade Rugby Marcel-Michelin', city: 'Clermont-Ferrand' },
  { name: 'Stade Ernest-Wallon', city: 'Toulouse' },
  { name: 'Stade Jean-Dauger', city: 'Bayonne' },
  { name: 'Stade Aimé-Giral', city: 'Perpignan' },
  { name: 'Stade Chaban-Delmas Rugby', city: 'Bordeaux' },
  { name: 'Parc des Sports Perpignan', city: 'Perpignan' },
  { name: 'Stade Municipal', city: 'Aubervilliers' },
  { name: 'Stade Pierre-de-Coubertin', city: 'Paris' },
  { name: 'Stade Sébastien-Charléty', city: 'Paris' },
  { name: 'Stade Yves-du-Manoir', city: 'Colombes' },
  { name: 'Stade Marville', city: 'La Courneuve' },
  { name: 'Stade Delaune', city: 'Reims' },
  { name: 'Stade Ferdinand-Bracke', city: 'Wattignies' },
  { name: 'Complexe Sportif Duvauchelle', city: 'Créteil' },
  { name: 'Stade Municipal de Rodez', city: 'Rodez' },
  { name: 'Stade de l’Est', city: 'Amiens' },

  // ---- Terrains & complexes sportifs de proximité (tous sports) ----
  { name: 'Tennis Club de Paris', city: 'Paris' },
  { name: 'Roland-Garros', city: 'Paris' },
  { name: 'Tennis Club de Boulogne-Billancourt', city: 'Boulogne-Billancourt' },
  { name: 'Complexe Sportif Carpentier', city: 'Paris' },
  { name: 'Gymnase Japy', city: 'Paris' },
  { name: 'Palais des Sports de Paris', city: 'Paris' },
  { name: 'Halle Georges-Carpentier', city: 'Paris' },
  { name: 'Piscine Joséphine-Baker', city: 'Paris' },
  { name: 'Piscine Molitor', city: 'Paris' },
  { name: 'Piscine Pontoise', city: 'Paris' },
  { name: 'Bois de Vincennes — Pistes de course', city: 'Paris' },
  { name: 'Bois de Boulogne — Pistes de course', city: 'Paris' },
  { name: 'Parc Monceau', city: 'Paris' },
  { name: 'Parc des Buttes-Chaumont', city: 'Paris' },
  { name: 'Bercy Arena (Accor Arena)', city: 'Paris' },
  { name: 'Vélodrome National de Saint-Quentin', city: 'Saint-Quentin-en-Yvelines' },
  { name: 'Salle Pierre-de-Coubertin (Basket)', city: 'Paris' },
  { name: 'Dojo Paris Budokan', city: 'Paris' },
  { name: 'Climbing District', city: 'Paris' },
  { name: 'Arkose Nation (Escalade)', city: 'Paris' },
  { name: 'Vertical Art Bastille (Escalade)', city: 'Paris' },
  { name: 'Basket Hall des Halles', city: 'Paris' },
  { name: 'Studio Danse Le Central', city: 'Paris' },

  { name: 'Tennis Club de Lyon', city: 'Lyon' },
  { name: 'Halle Tony-Garnier', city: 'Lyon' },
  { name: 'Piscine du Rhône', city: 'Lyon' },
  { name: 'Parc de la Tête d’Or — Pistes de course', city: 'Lyon' },
  { name: 'Arkose Confluence (Escalade)', city: 'Lyon' },
  { name: 'Gymnase Mermoz', city: 'Lyon' },

  { name: 'Plage du Prado — Beach Sports', city: 'Marseille' },
  { name: 'Parc Borély — Pistes de course', city: 'Marseille' },
  { name: 'Palais Omnisports Marseille Grand-Est', city: 'Marseille' },
  { name: 'Piscine du Vallon Régny', city: 'Marseille' },
  { name: 'Tennis Club de Marseille', city: 'Marseille' },

  { name: 'Tennis Club de Toulouse', city: 'Toulouse' },
  { name: 'Piscine Nakache', city: 'Toulouse' },
  { name: 'Prairie des Filtres — Pistes de course', city: 'Toulouse' },

  { name: 'Promenade des Anglais — Piste cyclable/course', city: 'Nice' },
  { name: 'Palais des Sports Jean-Bouin', city: 'Nice' },
  { name: 'Tennis Club de Nice', city: 'Nice' },

  { name: 'Île de Nantes — Complexe sportif', city: 'Nantes' },
  { name: 'Piscine Léo-Lagrange', city: 'Nantes' },
  { name: 'Parc de Procé', city: 'Nantes' },

  { name: 'Parc de l’Orangerie — Pistes de course', city: 'Strasbourg' },
  { name: 'Rhénus Sport', city: 'Strasbourg' },
  { name: 'Piscine du Wacken', city: 'Strasbourg' },

  { name: 'Parc du Château de la Mogère', city: 'Montpellier' },
  { name: 'Arena Sud de France', city: 'Montpellier' },
  { name: 'Piscine Olympique d’Antigone', city: 'Montpellier' },

  { name: 'Jardin Public — Pistes de course', city: 'Bordeaux' },
  { name: 'Piscine Judaïque', city: 'Bordeaux' },
  { name: 'Arkose Bordeaux (Escalade)', city: 'Bordeaux' },

  { name: 'Stade Pierre-Mauroy — Espace Fitness', city: 'Lille' },
  { name: 'Piscine Marx-Dormoy', city: 'Lille' },
  { name: 'Parc de la Citadelle — Pistes de course', city: 'Lille' },

  // ---- Rennes ----
  { name: 'Piscine Bréquigny', city: 'Rennes' },
  { name: 'Tennis Club de Rennes', city: 'Rennes' },
  { name: 'Parc du Thabor', city: 'Rennes' },
  { name: 'Gymnase Vern-Poterie', city: 'Rennes' },

  // ---- Reims ----
  { name: 'Complexe Sportif René-Tys', city: 'Reims' },
  { name: 'Piscine Château-d’Eau', city: 'Reims' },
  { name: 'Parc de Champagne', city: 'Reims' },

  // ---- Nancy ----
  { name: 'Piscine Nancy-Thermal', city: 'Nancy' },
  { name: 'Parc de la Pépinière', city: 'Nancy' },
  { name: 'Gymnase Poincaré', city: 'Nancy' },

  // ---- Metz ----
  { name: 'Piscine Olympique de Metz', city: 'Metz' },
  { name: 'Parc de la Seille', city: 'Metz' },
  { name: 'Les Arènes de Metz', city: 'Metz' },

  // ---- Dijon ----
  { name: 'Piscine Olympique de Dijon', city: 'Dijon' },
  { name: 'Parc de la Colombière', city: 'Dijon' },
  { name: 'Palais des Sports Jean-Michel-Geoffroy', city: 'Dijon' },

  // ---- Angers ----
  { name: 'Piscine du Lac de Maine', city: 'Angers' },
  { name: 'Complexe Sportif Jean-Bouin', city: 'Angers' },
  { name: 'Lac de Maine — Base de plein air', city: 'Angers' },

  // ---- Le Mans ----
  { name: 'Piscine Jean-Boiteux', city: 'Le Mans' },
  { name: 'Antarès (Salle omnisports)', city: 'Le Mans' },

  // ---- Le Havre ----
  { name: 'Piscine des Bains des Docks', city: 'Le Havre' },
  { name: 'Plage du Havre — Beach Sports', city: 'Le Havre' },

  // ---- Caen ----
  { name: 'Piscine Aqua Vikings', city: 'Caen' },
  { name: 'Zénith de Caen — Espace sportif', city: 'Caen' },
  { name: 'Parc de la Colline aux Oiseaux', city: 'Caen' },

  // ---- Grenoble ----
  { name: 'Piscine Iris', city: 'Grenoble' },
  { name: 'Tennis Club de Grenoble', city: 'Grenoble' },
  { name: 'Parc Paul-Mistral', city: 'Grenoble' },

  // ---- Clermont-Ferrand ----
  { name: 'Piscine Océanide', city: 'Clermont-Ferrand' },
  { name: 'Parc Montjuzet', city: 'Clermont-Ferrand' },
  { name: 'Complexe Sportif Georges-Pompidou', city: 'Clermont-Ferrand' },

  // ---- Saint-Étienne ----
  { name: 'Piscine Marius-Patinaud', city: 'Saint-Étienne' },
  { name: 'Parc de l’Europe', city: 'Saint-Étienne' },

  // ---- Toulouse (complément) ----
  { name: 'Palais des Sports André-Brouat', city: 'Toulouse' },
  { name: 'Complexe Sportif du Grand Rond', city: 'Toulouse' },

  // ---- Nice (complément) ----
  { name: 'Piscine Nikaïa', city: 'Nice' },
  { name: 'Parc Chambrun', city: 'Nice' },
  { name: 'Arkose Nice (Escalade)', city: 'Nice' },

  // ---- Bordeaux (complément) ----
  { name: 'Piscine Galin', city: 'Bordeaux' },
  { name: 'Parc Bordelais', city: 'Bordeaux' },
  { name: 'Palais des Sports de Bordeaux', city: 'Bordeaux' },

  // ---- Nantes (complément) ----
  { name: 'Piscine Petit Port', city: 'Nantes' },
  { name: 'Tennis Club de Nantes', city: 'Nantes' },
  { name: 'Arkose Nantes (Escalade)', city: 'Nantes' },

  // ---- Marseille (complément) ----
  { name: 'Dojo Marseille Provence', city: 'Marseille' },
  { name: 'Complexe Sportif du Roucas Blanc', city: 'Marseille' },
  { name: 'Arkose Marseille (Escalade)', city: 'Marseille' },

  // ---- Lyon (complément) ----
  { name: 'Piscine du Rhône (bassin extérieur)', city: 'Lyon' },
  { name: 'Palais des Sports de Lyon (Gerland)', city: 'Lyon' },
  { name: 'Parc de Gerland', city: 'Lyon' },

  // ---- Paris (complément) ----
  { name: 'Piscine Georges-Vallerey', city: 'Paris' },
  { name: 'Piscine Keller', city: 'Paris' },
  { name: 'Stade Suzanne-Lenglen', city: 'Paris' },
  { name: 'Stade Emile-Anthoine', city: 'Paris' },
  { name: 'Palais des Sports Paris (Porte de Versailles)', city: 'Paris' },
  { name: 'Skatepark de Bercy', city: 'Paris' },
  { name: 'Piste d’Athlétisme du Stade Charléty', city: 'Paris' },

  // ---- Strasbourg (complément) ----
  { name: 'Piscine de Kehl (frontalière)', city: 'Strasbourg' },
  { name: 'Tennis Club de Strasbourg', city: 'Strasbourg' },
  { name: 'Parc de Pourtalès', city: 'Strasbourg' },

  // ---- Montpellier (complément) ----
  { name: 'Piscine Antigone (bassin extérieur)', city: 'Montpellier' },
  { name: 'Parc du Lunaret', city: 'Montpellier' },

  // ---- Lille (complément) ----
  { name: 'Piscine Marx-Dormoy (bassin sportif)', city: 'Lille' },
  { name: 'Tennis Club de Lille', city: 'Lille' },

  // ---- Nouvelles villes ----
  { name: 'Stade des Costières', city: 'Nîmes' },
  { name: 'Piscine Aquatropic', city: 'Nîmes' },

  { name: 'Stade Léo-Lagrange', city: 'Avignon' },
  { name: 'Piscine de la Barbière', city: 'Avignon' },

  { name: 'Stade de la Vallée du Cher', city: 'Tours' },
  { name: 'Piscine du Lac', city: 'Tours' },

  { name: 'Stade Omnisports d’Orléans', city: 'Orléans' },
  { name: 'Piscine de la Source', city: 'Orléans' },

  { name: 'Stade de Beaublanc', city: 'Limoges' },
  { name: 'Piscine Aquapolis', city: 'Limoges' },

  { name: 'Stade Rébeilleau', city: 'Poitiers' },
  { name: 'Piscine des Ilots', city: 'Poitiers' },

  { name: 'Stade du Hameau', city: 'Pau' },
  { name: 'Piscine Municipale de Pau', city: 'Pau' },

  { name: 'Piscine des Marquisats', city: 'Annecy' },
  { name: 'Lac d’Annecy — Base sportive', city: 'Annecy' },

  { name: 'Stade Léo-Lagrange (Besançon)', city: 'Besançon' },
  { name: 'Piscine Mallarmé', city: 'Besançon' },

  { name: 'Stade de l’Ill', city: 'Mulhouse' },
  { name: 'Piscine des Sports de Mulhouse', city: 'Mulhouse' },

  { name: 'Stade Mayol', city: 'Toulon' },
  { name: 'Plage du Mourillon — Beach Sports', city: 'Toulon' },

  { name: 'Stade Marcel-Saupin', city: 'Saint-Nazaire' },
  { name: 'Piscine Aquasport', city: 'Saint-Nazaire' },

  { name: 'Stade de Chambéry', city: 'Chambéry' },
  { name: 'Piscine Chambéry Métropole', city: 'Chambéry' },

  { name: 'Stade Marcel-Deflandre', city: 'La Rochelle' },
  { name: 'Plage de La Rochelle — Beach Sports', city: 'La Rochelle' },

  { name: 'Stade de la Méditerranée', city: 'Béziers' },
  { name: 'Piscine de Béziers', city: 'Béziers' },

  { name: 'Stade de l’Épopée', city: 'Calais' },
  { name: 'Plage de Calais — Beach Sports', city: 'Calais' },

  { name: 'Stade Paul-Guerre', city: 'Dunkerque' },
  { name: 'Piscine Paul-Asseman', city: 'Dunkerque' },

  { name: 'Stade de la Rabine', city: 'Vannes' },
  { name: 'Piscine de Vannes', city: 'Vannes' },

  { name: 'Stade de Penvillers', city: 'Quimper' },
  { name: 'Piscine Aquarive', city: 'Quimper' },

  { name: 'Stade Pierre-de-Coubertin (Cannes)', city: 'Cannes' },
  { name: 'Plage de Cannes — Beach Sports', city: 'Cannes' },

  { name: 'Stade du Fort Carré', city: 'Antibes' },
  { name: 'Plage d’Antibes — Beach Sports', city: 'Antibes' },

  { name: 'Stade Ange-Susini', city: 'Ajaccio' },
  { name: 'Plage d’Ajaccio — Beach Sports', city: 'Ajaccio' },

  { name: 'Stade Armand-Cesari', city: 'Bastia' },
  { name: 'Plage de Bastia — Beach Sports', city: 'Bastia' },

  { name: 'Stade Marville de Saint-Malo', city: 'Saint-Malo' },
  { name: 'Plage du Sillon — Beach Sports', city: 'Saint-Malo' },

  { name: 'Stade Aguilera', city: 'Biarritz' },
  { name: 'Plage de Biarritz — Beach Sports', city: 'Biarritz' },

  { name: 'Stade Carcassonne (Aix)', city: 'Aix-en-Provence' },
  { name: 'Piscine Yves-Blanc', city: 'Aix-en-Provence' },

  // ---- Terrains municipaux & équipements de proximité (extension) ----
  { name: 'Stade Chanzy', city: 'Angoulême' },
  { name: 'Stade René-Gaillard', city: 'Niort' },
  { name: 'Stade Jacques-Duclos', city: 'Bourges' },
  { name: 'Stade Gaston-Petit', city: 'Châteauroux' },
  { name: 'Stade Fournier', city: 'Blois' },
  { name: 'Stade Jacques-Couvret', city: 'Chartres' },
  { name: 'Stade Municipal de Compiègne', city: 'Compiègne' },
  { name: 'Stade Pierre-Brisson', city: 'Beauvais' },
  { name: 'Stade Francis-Le Basser', city: 'Laval' },
  { name: 'Stade Bonnin', city: 'Cholet' },
  { name: 'Stade Fred-Aubert', city: 'Saint-Brieuc' },
  { name: 'Stade Pierre-Bayenet', city: 'Douai' },
  { name: 'Stade Coutaud', city: 'Béthune' },
  { name: 'Stade Michelin', city: 'Arras' },
  { name: 'Stade Alfred-Danel', city: 'Cambrai' },
  { name: 'Stade Charles-Jaeger', city: 'Charleville-Mézières' },
  { name: 'Stade Colombière', city: 'Épinal' },
  { name: 'Stade Serzian', city: 'Belfort' },
  { name: 'Stade Léo-Lagrange (Chalon-sur-Saône)', city: 'Chalon-sur-Saône' },
  { name: 'Stade Léo-Lagrange (Mâcon)', city: 'Mâcon' },
  { name: 'Stade Marcel-Verchère (Bourg-en-Bresse)', city: 'Bourg-en-Bresse' },
  { name: 'Stade André-Champavier', city: 'Roanne' },
  { name: 'Stade Darragon', city: 'Vichy' },
  { name: 'Stade Le Bourru', city: 'Montluçon' },
  { name: 'Stade Jean-Alric', city: 'Aurillac' },
  { name: 'Stade Massot', city: 'Le Puy-en-Velay' },
  { name: 'Stadium Municipal d’Albi', city: 'Albi' },
  { name: 'Stade Pierre-Antoine', city: 'Castres' },
  { name: 'Stade Sapiac', city: 'Montauban' },
  { name: 'Stade Armandie', city: 'Agen' },
  { name: 'Stade Albert-Domec', city: 'Carcassonne' },
  { name: 'Parc des Sports et de l’Amitié', city: 'Narbonne' },
  { name: 'Stade Louis-Michel', city: 'Sète' },
  { name: 'Stade Pierre-Pibarot', city: 'Alès' },
  { name: 'Stade Guy-Nublat', city: 'Gap' },
  { name: 'Stade Marcel-Sembat', city: 'Fréjus' },
  { name: 'Stade des Salins', city: 'Hyères' },
  { name: 'Stade Francis-Turcan', city: 'Martigues' },
  { name: 'Stade Roger-Couderc', city: 'Salon-de-Provence' },
  { name: 'Stade Fernand-Fournier', city: 'Arles' },
  { name: 'Stade Georges-Pompidou', city: 'Valence' },
  { name: 'Stade Georges-Lyvet', city: 'Villeurbanne' },
  { name: 'Complexe Sportif de Thonon', city: 'Thonon-les-Bains' },
  { name: 'Stade Pierre-Bertholat', city: 'Épernay' },
  { name: 'Stade Jean-Marin', city: 'Évreux' },
  { name: 'Stade Calmette', city: 'Saint-Lô' },
  { name: 'Stade Claude-Herzog', city: 'Cherbourg-en-Cotentin' },
  { name: 'Stade Marcel-Bertrand', city: 'Alençon' },
  { name: 'Stade Henri-Desgrange', city: 'La Roche-sur-Yon' },
  { name: 'Complexe Sportif Municipal de Paris', city: 'Paris' },
  { name: 'Gymnase Municipal de Paris', city: 'Paris' },
  { name: 'Piscine Municipale de Paris', city: 'Paris' },
  { name: 'City Stade de Paris', city: 'Paris' },
  { name: 'Complexe Sportif Municipal de Lyon', city: 'Lyon' },
  { name: 'Gymnase Municipal de Lyon', city: 'Lyon' },
  { name: 'Piscine Municipale de Lyon', city: 'Lyon' },
  { name: 'City Stade de Lyon', city: 'Lyon' },
  { name: 'Complexe Sportif Municipal de Marseille', city: 'Marseille' },
  { name: 'Gymnase Municipal de Marseille', city: 'Marseille' },
  { name: 'Piscine Municipale de Marseille', city: 'Marseille' },
  { name: 'City Stade de Marseille', city: 'Marseille' },
  { name: 'Complexe Sportif Municipal de Lille', city: 'Lille' },
  { name: 'Gymnase Municipal de Lille', city: 'Lille' },
  { name: 'Piscine Municipale de Lille', city: 'Lille' },
  { name: 'City Stade de Lille', city: 'Lille' },
  { name: 'Complexe Sportif Municipal de Toulouse', city: 'Toulouse' },
  { name: 'Gymnase Municipal de Toulouse', city: 'Toulouse' },
  { name: 'Piscine Municipale de Toulouse', city: 'Toulouse' },
  { name: 'City Stade de Toulouse', city: 'Toulouse' },
  { name: 'Complexe Sportif Municipal de Nice', city: 'Nice' },
  { name: 'Gymnase Municipal de Nice', city: 'Nice' },
  { name: 'Piscine Municipale de Nice', city: 'Nice' },
  { name: 'City Stade de Nice', city: 'Nice' },
  { name: 'Complexe Sportif Municipal de Bordeaux', city: 'Bordeaux' },
  { name: 'Gymnase Municipal de Bordeaux', city: 'Bordeaux' },
  { name: 'Piscine Municipale de Bordeaux', city: 'Bordeaux' },
  { name: 'City Stade de Bordeaux', city: 'Bordeaux' },
  { name: 'Complexe Sportif Municipal de Nantes', city: 'Nantes' },
  { name: 'Gymnase Municipal de Nantes', city: 'Nantes' },
  { name: 'Piscine Municipale de Nantes', city: 'Nantes' },
  { name: 'City Stade de Nantes', city: 'Nantes' },
  { name: 'Complexe Sportif Municipal de Strasbourg', city: 'Strasbourg' },
  { name: 'Gymnase Municipal de Strasbourg', city: 'Strasbourg' },
  { name: 'Piscine Municipale de Strasbourg', city: 'Strasbourg' },
  { name: 'City Stade de Strasbourg', city: 'Strasbourg' },
  { name: 'Complexe Sportif Municipal de Rennes', city: 'Rennes' },
  { name: 'Gymnase Municipal de Rennes', city: 'Rennes' },
  { name: 'Piscine Municipale de Rennes', city: 'Rennes' },
  { name: 'City Stade de Rennes', city: 'Rennes' },
  { name: 'Complexe Sportif Municipal de Montpellier', city: 'Montpellier' },
  { name: 'Gymnase Municipal de Montpellier', city: 'Montpellier' },
  { name: 'Piscine Municipale de Montpellier', city: 'Montpellier' },
  { name: 'City Stade de Montpellier', city: 'Montpellier' },
  { name: 'Complexe Sportif Municipal de Grenoble', city: 'Grenoble' },
  { name: 'Gymnase Municipal de Grenoble', city: 'Grenoble' },
  { name: 'Piscine Municipale de Grenoble', city: 'Grenoble' },
  { name: 'City Stade de Grenoble', city: 'Grenoble' },
  { name: 'Complexe Sportif Municipal de Reims', city: 'Reims' },
  { name: 'Gymnase Municipal de Reims', city: 'Reims' },
  { name: 'Piscine Municipale de Reims', city: 'Reims' },
  { name: 'City Stade de Reims', city: 'Reims' },
  { name: 'Complexe Sportif Municipal de Le Havre', city: 'Le Havre' },
  { name: 'Gymnase Municipal de Le Havre', city: 'Le Havre' },
  { name: 'Piscine Municipale de Le Havre', city: 'Le Havre' },
  { name: 'City Stade de Le Havre', city: 'Le Havre' },
  { name: 'Complexe Sportif Municipal de Rouen', city: 'Rouen' },
  { name: 'Gymnase Municipal de Rouen', city: 'Rouen' },
  { name: 'Piscine Municipale de Rouen', city: 'Rouen' },
  { name: 'City Stade de Rouen', city: 'Rouen' },
  { name: 'Complexe Sportif Municipal de Nancy', city: 'Nancy' },
  { name: 'Gymnase Municipal de Nancy', city: 'Nancy' },
  { name: 'Piscine Municipale de Nancy', city: 'Nancy' },
  { name: 'City Stade de Nancy', city: 'Nancy' },
  { name: 'Complexe Sportif Municipal de Metz', city: 'Metz' },
  { name: 'Gymnase Municipal de Metz', city: 'Metz' },
  { name: 'Piscine Municipale de Metz', city: 'Metz' },
  { name: 'City Stade de Metz', city: 'Metz' },
  { name: 'Complexe Sportif Municipal de Dijon', city: 'Dijon' },
  { name: 'Gymnase Municipal de Dijon', city: 'Dijon' },
  { name: 'Piscine Municipale de Dijon', city: 'Dijon' },
  { name: 'City Stade de Dijon', city: 'Dijon' },
  { name: 'Complexe Sportif Municipal de Angers', city: 'Angers' },
  { name: 'Gymnase Municipal de Angers', city: 'Angers' },
  { name: 'Piscine Municipale de Angers', city: 'Angers' },
  { name: 'City Stade de Angers', city: 'Angers' },
  { name: 'Complexe Sportif Municipal de Caen', city: 'Caen' },
  { name: 'Gymnase Municipal de Caen', city: 'Caen' },
  { name: 'Piscine Municipale de Caen', city: 'Caen' },
  { name: 'City Stade de Caen', city: 'Caen' },
  { name: 'Complexe Sportif Municipal de Brest', city: 'Brest' },
  { name: 'Gymnase Municipal de Brest', city: 'Brest' },
  { name: 'Piscine Municipale de Brest', city: 'Brest' },
  { name: 'City Stade de Brest', city: 'Brest' },
  { name: 'Complexe Sportif Municipal de Toulon', city: 'Toulon' },
  { name: 'Gymnase Municipal de Toulon', city: 'Toulon' },
  { name: 'Piscine Municipale de Toulon', city: 'Toulon' },
  { name: 'City Stade de Toulon', city: 'Toulon' },
  { name: 'Complexe Sportif Municipal de Clermont-Ferrand', city: 'Clermont-Ferrand' },
  { name: 'Gymnase Municipal de Clermont-Ferrand', city: 'Clermont-Ferrand' },
  { name: 'Piscine Municipale de Clermont-Ferrand', city: 'Clermont-Ferrand' },
  { name: 'City Stade de Clermont-Ferrand', city: 'Clermont-Ferrand' },
  { name: 'Complexe Sportif Municipal de Perpignan', city: 'Perpignan' },
  { name: 'Gymnase Municipal de Perpignan', city: 'Perpignan' },
  { name: 'Piscine Municipale de Perpignan', city: 'Perpignan' },
  { name: 'City Stade de Perpignan', city: 'Perpignan' },
  { name: 'Complexe Sportif Municipal de Amiens', city: 'Amiens' },
  { name: 'Gymnase Municipal de Amiens', city: 'Amiens' },
  { name: 'Piscine Municipale de Amiens', city: 'Amiens' },
  { name: 'City Stade de Amiens', city: 'Amiens' },
  { name: 'Complexe Sportif Municipal de Limoges', city: 'Limoges' },
  { name: 'Gymnase Municipal de Limoges', city: 'Limoges' },
  { name: 'Piscine Municipale de Limoges', city: 'Limoges' },
  { name: 'City Stade de Limoges', city: 'Limoges' },
  { name: 'Complexe Sportif Municipal de Tours', city: 'Tours' },
  { name: 'Gymnase Municipal de Tours', city: 'Tours' },
  { name: 'Piscine Municipale de Tours', city: 'Tours' },
  { name: 'City Stade de Tours', city: 'Tours' },
  { name: 'Complexe Sportif Municipal de Orléans', city: 'Orléans' },
  { name: 'Gymnase Municipal de Orléans', city: 'Orléans' },
  { name: 'Piscine Municipale de Orléans', city: 'Orléans' },
  { name: 'City Stade de Orléans', city: 'Orléans' },
  { name: 'Complexe Sportif Municipal de Besançon', city: 'Besançon' },
  { name: 'Gymnase Municipal de Besançon', city: 'Besançon' },
  { name: 'Piscine Municipale de Besançon', city: 'Besançon' },
  { name: 'City Stade de Besançon', city: 'Besançon' },
  { name: 'Complexe Sportif Municipal de Mulhouse', city: 'Mulhouse' },
  { name: 'Gymnase Municipal de Mulhouse', city: 'Mulhouse' },
  { name: 'Piscine Municipale de Mulhouse', city: 'Mulhouse' },
  { name: 'City Stade de Mulhouse', city: 'Mulhouse' },
  { name: 'Complexe Sportif Municipal de Saint-Étienne', city: 'Saint-Étienne' },
  { name: 'Gymnase Municipal de Saint-Étienne', city: 'Saint-Étienne' },
  { name: 'Piscine Municipale de Saint-Étienne', city: 'Saint-Étienne' },
  { name: 'City Stade de Saint-Étienne', city: 'Saint-Étienne' },
  { name: 'Complexe Sportif Municipal de Annecy', city: 'Annecy' },
  { name: 'Gymnase Municipal de Annecy', city: 'Annecy' },
  { name: 'Piscine Municipale de Annecy', city: 'Annecy' },
  { name: 'City Stade de Annecy', city: 'Annecy' },
  { name: 'Complexe Sportif Municipal de Pau', city: 'Pau' },
  { name: 'Gymnase Municipal de Pau', city: 'Pau' },
  { name: 'Piscine Municipale de Pau (Pau)', city: 'Pau' },
  { name: 'City Stade de Pau', city: 'Pau' },
  { name: 'Complexe Sportif Municipal de Bayonne', city: 'Bayonne' },
  { name: 'Gymnase Municipal de Bayonne', city: 'Bayonne' },
  { name: 'Piscine Municipale de Bayonne', city: 'Bayonne' },
  { name: 'City Stade de Bayonne', city: 'Bayonne' },
  { name: 'Complexe Sportif Municipal de La Rochelle', city: 'La Rochelle' },
  { name: 'Gymnase Municipal de La Rochelle', city: 'La Rochelle' },
  { name: 'Piscine Municipale de La Rochelle', city: 'La Rochelle' },
  { name: 'City Stade de La Rochelle', city: 'La Rochelle' },
  { name: 'Complexe Sportif Municipal de Béziers', city: 'Béziers' },
  { name: 'Gymnase Municipal de Béziers', city: 'Béziers' },
  { name: 'Piscine Municipale de Béziers', city: 'Béziers' },
  { name: 'City Stade de Béziers', city: 'Béziers' },
  { name: 'Complexe Sportif Municipal de Nîmes', city: 'Nîmes' },
  { name: 'Gymnase Municipal de Nîmes', city: 'Nîmes' },
  { name: 'Piscine Municipale de Nîmes', city: 'Nîmes' },
  { name: 'City Stade de Nîmes', city: 'Nîmes' },
  { name: 'Complexe Sportif Municipal de Avignon', city: 'Avignon' },
  { name: 'Gymnase Municipal de Avignon', city: 'Avignon' },
  { name: 'Piscine Municipale de Avignon', city: 'Avignon' },
  { name: 'City Stade de Avignon', city: 'Avignon' },
  { name: 'Complexe Sportif Municipal de Troyes', city: 'Troyes' },
  { name: 'Gymnase Municipal de Troyes', city: 'Troyes' },
  { name: 'Piscine Municipale de Troyes', city: 'Troyes' },
  { name: 'City Stade de Troyes', city: 'Troyes' },
  { name: 'Complexe Sportif Municipal de Valenciennes', city: 'Valenciennes' },
  { name: 'Gymnase Municipal de Valenciennes', city: 'Valenciennes' },
  { name: 'Piscine Municipale de Valenciennes', city: 'Valenciennes' },
  { name: 'City Stade de Valenciennes', city: 'Valenciennes' },
  { name: 'Complexe Sportif Municipal de Dunkerque', city: 'Dunkerque' },
  { name: 'Gymnase Municipal de Dunkerque', city: 'Dunkerque' },
  { name: 'Piscine Municipale de Dunkerque', city: 'Dunkerque' },
  { name: 'City Stade de Dunkerque', city: 'Dunkerque' },
  { name: 'Complexe Sportif Municipal de Calais', city: 'Calais' },
  { name: 'Gymnase Municipal de Calais', city: 'Calais' },
  { name: 'Piscine Municipale de Calais', city: 'Calais' },
  { name: 'City Stade de Calais', city: 'Calais' },
  { name: 'Complexe Sportif Municipal de Vannes', city: 'Vannes' },
  { name: 'Gymnase Municipal de Vannes', city: 'Vannes' },
  { name: 'Piscine Municipale de Vannes', city: 'Vannes' },
  { name: 'City Stade de Vannes', city: 'Vannes' },
  { name: 'Complexe Sportif Municipal de Quimper', city: 'Quimper' },
  { name: 'Gymnase Municipal de Quimper', city: 'Quimper' },
  { name: 'Piscine Municipale de Quimper', city: 'Quimper' },
  { name: 'City Stade de Quimper', city: 'Quimper' },
  { name: 'Complexe Sportif Municipal de Cannes', city: 'Cannes' },
  { name: 'Gymnase Municipal de Cannes', city: 'Cannes' },
  { name: 'Piscine Municipale de Cannes', city: 'Cannes' },
  { name: 'City Stade de Cannes', city: 'Cannes' },
  { name: 'Complexe Sportif Municipal de Antibes', city: 'Antibes' },
  { name: 'Gymnase Municipal de Antibes', city: 'Antibes' },
  { name: 'Piscine Municipale de Antibes', city: 'Antibes' },
  { name: 'City Stade de Antibes', city: 'Antibes' },
  { name: 'Complexe Sportif Municipal de Biarritz', city: 'Biarritz' },
  { name: 'Gymnase Municipal de Biarritz', city: 'Biarritz' },
  { name: 'Piscine Municipale de Biarritz', city: 'Biarritz' },
  { name: 'City Stade de Biarritz', city: 'Biarritz' },
  { name: 'Complexe Sportif Municipal de Saint-Malo', city: 'Saint-Malo' },
  { name: 'Gymnase Municipal de Saint-Malo', city: 'Saint-Malo' },
  { name: 'Piscine Municipale de Saint-Malo', city: 'Saint-Malo' },
  { name: 'City Stade de Saint-Malo', city: 'Saint-Malo' },
  { name: 'Complexe Sportif Municipal de Chambéry', city: 'Chambéry' },
  { name: 'Gymnase Municipal de Chambéry', city: 'Chambéry' },
  { name: 'Piscine Municipale de Chambéry', city: 'Chambéry' },
  { name: 'City Stade de Chambéry', city: 'Chambéry' },
  { name: 'Complexe Sportif Municipal de Créteil', city: 'Créteil' },
  { name: 'Gymnase Municipal de Créteil', city: 'Créteil' },
  { name: 'Piscine Municipale de Créteil', city: 'Créteil' },
  { name: 'City Stade de Créteil', city: 'Créteil' },
  { name: 'Complexe Sportif Municipal de Colombes', city: 'Colombes' },
  { name: 'Gymnase Municipal de Colombes', city: 'Colombes' },
  { name: 'Piscine Municipale de Colombes', city: 'Colombes' },
  { name: 'City Stade de Colombes', city: 'Colombes' },
  { name: 'Complexe Sportif Municipal de Villeurbanne', city: 'Villeurbanne' },
  { name: 'Gymnase Municipal de Villeurbanne', city: 'Villeurbanne' },
  { name: 'Piscine Municipale de Villeurbanne', city: 'Villeurbanne' },
  { name: 'City Stade de Villeurbanne', city: 'Villeurbanne' },
  { name: 'Complexe Sportif Municipal de Valence', city: 'Valence' },
  { name: 'Gymnase Municipal de Valence', city: 'Valence' },
  { name: 'Piscine Municipale de Valence', city: 'Valence' },
  { name: 'City Stade de Valence', city: 'Valence' },
  { name: 'Complexe Sportif Municipal de Angoulême', city: 'Angoulême' },
  { name: 'Gymnase Municipal de Angoulême', city: 'Angoulême' },
  { name: 'Piscine Municipale de Angoulême', city: 'Angoulême' },
  { name: 'City Stade de Angoulême', city: 'Angoulême' },
  { name: 'Complexe Sportif Municipal de Niort', city: 'Niort' },
  { name: 'Gymnase Municipal de Niort', city: 'Niort' },
  { name: 'Piscine Municipale de Niort', city: 'Niort' },
  { name: 'City Stade de Niort', city: 'Niort' },
  { name: 'Complexe Sportif Municipal de Bourges', city: 'Bourges' },
  { name: 'Gymnase Municipal de Bourges', city: 'Bourges' },
  { name: 'Piscine Municipale de Bourges', city: 'Bourges' },
  { name: 'City Stade de Bourges', city: 'Bourges' },
  { name: 'Complexe Sportif Municipal de Châteauroux', city: 'Châteauroux' },
  { name: 'Gymnase Municipal de Châteauroux', city: 'Châteauroux' },
  { name: 'Piscine Municipale de Châteauroux', city: 'Châteauroux' },
  { name: 'City Stade de Châteauroux', city: 'Châteauroux' },
  { name: 'Complexe Sportif Municipal de Blois', city: 'Blois' },
  { name: 'Gymnase Municipal de Blois', city: 'Blois' },
  { name: 'Piscine Municipale de Blois', city: 'Blois' },
  { name: 'City Stade de Blois', city: 'Blois' },
  { name: 'Complexe Sportif Municipal de Chartres', city: 'Chartres' },
  { name: 'Gymnase Municipal de Chartres', city: 'Chartres' },
  { name: 'Piscine Municipale de Chartres', city: 'Chartres' },
  { name: 'City Stade de Chartres', city: 'Chartres' },
  { name: 'Complexe Sportif Municipal de Compiègne', city: 'Compiègne' },
  { name: 'Gymnase Municipal de Compiègne', city: 'Compiègne' },
  { name: 'Piscine Municipale de Compiègne', city: 'Compiègne' },
  { name: 'City Stade de Compiègne', city: 'Compiègne' },
  { name: 'Complexe Sportif Municipal de Beauvais', city: 'Beauvais' },
  { name: 'Gymnase Municipal de Beauvais', city: 'Beauvais' },
  { name: 'Piscine Municipale de Beauvais', city: 'Beauvais' },
  { name: 'City Stade de Beauvais', city: 'Beauvais' },
  { name: 'Complexe Sportif Municipal de Laval', city: 'Laval' },
  { name: 'Gymnase Municipal de Laval', city: 'Laval' },
  { name: 'Piscine Municipale de Laval', city: 'Laval' },
  { name: 'City Stade de Laval', city: 'Laval' },
  { name: 'Complexe Sportif Municipal de Cholet', city: 'Cholet' },
  { name: 'Gymnase Municipal de Cholet', city: 'Cholet' },
  { name: 'Piscine Municipale de Cholet', city: 'Cholet' },
  { name: 'City Stade de Cholet', city: 'Cholet' },
  { name: 'Complexe Sportif Municipal de Saint-Brieuc', city: 'Saint-Brieuc' },
  { name: 'Gymnase Municipal de Saint-Brieuc', city: 'Saint-Brieuc' },
  { name: 'Piscine Municipale de Saint-Brieuc', city: 'Saint-Brieuc' },
  { name: 'City Stade de Saint-Brieuc', city: 'Saint-Brieuc' },
  { name: 'Complexe Sportif Municipal de Douai', city: 'Douai' },
  { name: 'Gymnase Municipal de Douai', city: 'Douai' },
  { name: 'Piscine Municipale de Douai', city: 'Douai' },
  { name: 'City Stade de Douai', city: 'Douai' },
  { name: 'Complexe Sportif Municipal de Béthune', city: 'Béthune' },
  { name: 'Gymnase Municipal de Béthune', city: 'Béthune' },
  { name: 'Piscine Municipale de Béthune', city: 'Béthune' },
  { name: 'City Stade de Béthune', city: 'Béthune' },
  { name: 'Complexe Sportif Municipal de Arras', city: 'Arras' },
  { name: 'Gymnase Municipal de Arras', city: 'Arras' },
  { name: 'Piscine Municipale de Arras', city: 'Arras' },
  { name: 'City Stade de Arras', city: 'Arras' },
  { name: 'Complexe Sportif Municipal de Cambrai', city: 'Cambrai' },
  { name: 'Gymnase Municipal de Cambrai', city: 'Cambrai' },
  { name: 'Piscine Municipale de Cambrai', city: 'Cambrai' },
  { name: 'City Stade de Cambrai', city: 'Cambrai' },
  { name: 'Complexe Sportif Municipal de Charleville-Mézières', city: 'Charleville-Mézières' },
  { name: 'Gymnase Municipal de Charleville-Mézières', city: 'Charleville-Mézières' },
  { name: 'Piscine Municipale de Charleville-Mézières', city: 'Charleville-Mézières' },
  { name: 'City Stade de Charleville-Mézières', city: 'Charleville-Mézières' },
  { name: 'Complexe Sportif Municipal de Épinal', city: 'Épinal' },
  { name: 'Gymnase Municipal de Épinal', city: 'Épinal' },
  { name: 'Piscine Municipale de Épinal', city: 'Épinal' },
  { name: 'City Stade de Épinal', city: 'Épinal' },
  { name: 'Complexe Sportif Municipal de Belfort', city: 'Belfort' },
  { name: 'Gymnase Municipal de Belfort', city: 'Belfort' },
  { name: 'Piscine Municipale de Belfort', city: 'Belfort' },
  { name: 'City Stade de Belfort', city: 'Belfort' },
  { name: 'Complexe Sportif Municipal de Chalon-sur-Saône', city: 'Chalon-sur-Saône' },
  { name: 'Gymnase Municipal de Chalon-sur-Saône', city: 'Chalon-sur-Saône' },
  { name: 'Piscine Municipale de Chalon-sur-Saône', city: 'Chalon-sur-Saône' },
  { name: 'City Stade de Chalon-sur-Saône', city: 'Chalon-sur-Saône' },
  { name: 'Complexe Sportif Municipal de Mâcon', city: 'Mâcon' },
  { name: 'Gymnase Municipal de Mâcon', city: 'Mâcon' },
  { name: 'Piscine Municipale de Mâcon', city: 'Mâcon' },
  { name: 'City Stade de Mâcon', city: 'Mâcon' },
  { name: 'Complexe Sportif Municipal de Bourg-en-Bresse', city: 'Bourg-en-Bresse' },
  { name: 'Gymnase Municipal de Bourg-en-Bresse', city: 'Bourg-en-Bresse' },
  { name: 'Piscine Municipale de Bourg-en-Bresse', city: 'Bourg-en-Bresse' },
  { name: 'City Stade de Bourg-en-Bresse', city: 'Bourg-en-Bresse' },
  { name: 'Complexe Sportif Municipal de Roanne', city: 'Roanne' },
  { name: 'Gymnase Municipal de Roanne', city: 'Roanne' },
  { name: 'Piscine Municipale de Roanne', city: 'Roanne' },
  { name: 'City Stade de Roanne', city: 'Roanne' },
  { name: 'Complexe Sportif Municipal de Vichy', city: 'Vichy' },
  { name: 'Gymnase Municipal de Vichy', city: 'Vichy' },
  { name: 'Piscine Municipale de Vichy', city: 'Vichy' },
  { name: 'City Stade de Vichy', city: 'Vichy' },
  { name: 'Complexe Sportif Municipal de Montluçon', city: 'Montluçon' },
  { name: 'Gymnase Municipal de Montluçon', city: 'Montluçon' },
  { name: 'Piscine Municipale de Montluçon', city: 'Montluçon' },
  { name: 'City Stade de Montluçon', city: 'Montluçon' },
  { name: 'Complexe Sportif Municipal de Aurillac', city: 'Aurillac' },
  { name: 'Gymnase Municipal de Aurillac', city: 'Aurillac' },
  { name: 'Piscine Municipale de Aurillac', city: 'Aurillac' },
  { name: 'City Stade de Aurillac', city: 'Aurillac' },
  { name: 'Complexe Sportif Municipal de Le Puy-en-Velay', city: 'Le Puy-en-Velay' },
  { name: 'Gymnase Municipal de Le Puy-en-Velay', city: 'Le Puy-en-Velay' },
  { name: 'Piscine Municipale de Le Puy-en-Velay', city: 'Le Puy-en-Velay' },
  { name: 'City Stade de Le Puy-en-Velay', city: 'Le Puy-en-Velay' },
  { name: 'Complexe Sportif Municipal de Albi', city: 'Albi' },
  { name: 'Gymnase Municipal de Albi', city: 'Albi' },
  { name: 'Piscine Municipale de Albi', city: 'Albi' },
  { name: 'City Stade de Albi', city: 'Albi' },
  { name: 'Complexe Sportif Municipal de Castres', city: 'Castres' },
  { name: 'Gymnase Municipal de Castres', city: 'Castres' },
  { name: 'Piscine Municipale de Castres', city: 'Castres' },
  { name: 'City Stade de Castres', city: 'Castres' },
  { name: 'Complexe Sportif Municipal de Montauban', city: 'Montauban' },
  { name: 'Gymnase Municipal de Montauban', city: 'Montauban' },
  { name: 'Piscine Municipale de Montauban', city: 'Montauban' },
  { name: 'City Stade de Montauban', city: 'Montauban' },
  { name: 'Complexe Sportif Municipal de Agen', city: 'Agen' },
  { name: 'Gymnase Municipal de Agen', city: 'Agen' },
  { name: 'Piscine Municipale de Agen', city: 'Agen' },
  { name: 'City Stade de Agen', city: 'Agen' },
  { name: 'Complexe Sportif Municipal de Carcassonne', city: 'Carcassonne' },
  { name: 'Gymnase Municipal de Carcassonne', city: 'Carcassonne' },
  { name: 'Piscine Municipale de Carcassonne', city: 'Carcassonne' },
  { name: 'City Stade de Carcassonne', city: 'Carcassonne' },
  { name: 'Complexe Sportif Municipal de Narbonne', city: 'Narbonne' },
  { name: 'Gymnase Municipal de Narbonne', city: 'Narbonne' },
  { name: 'Piscine Municipale de Narbonne', city: 'Narbonne' },
  { name: 'City Stade de Narbonne', city: 'Narbonne' },
  { name: 'Complexe Sportif Municipal de Sète', city: 'Sète' },
  { name: 'Gymnase Municipal de Sète', city: 'Sète' },
  { name: 'Piscine Municipale de Sète', city: 'Sète' },
  { name: 'City Stade de Sète', city: 'Sète' },
  { name: 'Complexe Sportif Municipal de Alès', city: 'Alès' },
  { name: 'Gymnase Municipal de Alès', city: 'Alès' },
  { name: 'Piscine Municipale de Alès', city: 'Alès' },
  { name: 'City Stade de Alès', city: 'Alès' },
  { name: 'Complexe Sportif Municipal de Gap', city: 'Gap' },
  { name: 'Gymnase Municipal de Gap', city: 'Gap' },
  { name: 'Piscine Municipale de Gap', city: 'Gap' },
  { name: 'City Stade de Gap', city: 'Gap' },
  { name: 'Complexe Sportif Municipal de Fréjus', city: 'Fréjus' },
  { name: 'Gymnase Municipal de Fréjus', city: 'Fréjus' },
  { name: 'Piscine Municipale de Fréjus', city: 'Fréjus' },
  { name: 'City Stade de Fréjus', city: 'Fréjus' },
  { name: 'Complexe Sportif Municipal de Hyères', city: 'Hyères' },
  { name: 'Gymnase Municipal de Hyères', city: 'Hyères' },
  { name: 'Piscine Municipale de Hyères', city: 'Hyères' },
  { name: 'City Stade de Hyères', city: 'Hyères' },
  { name: 'Complexe Sportif Municipal de Martigues', city: 'Martigues' },
  { name: 'Gymnase Municipal de Martigues', city: 'Martigues' },
  { name: 'Piscine Municipale de Martigues', city: 'Martigues' },
  { name: 'City Stade de Martigues', city: 'Martigues' },
  { name: 'Complexe Sportif Municipal de Salon-de-Provence', city: 'Salon-de-Provence' },
  { name: 'Gymnase Municipal de Salon-de-Provence', city: 'Salon-de-Provence' },
  { name: 'Piscine Municipale de Salon-de-Provence', city: 'Salon-de-Provence' },
  { name: 'City Stade de Salon-de-Provence', city: 'Salon-de-Provence' },
  { name: 'Complexe Sportif Municipal de Arles', city: 'Arles' },
  { name: 'Gymnase Municipal de Arles', city: 'Arles' },
  { name: 'Piscine Municipale de Arles', city: 'Arles' },
  { name: 'City Stade de Arles', city: 'Arles' },
  { name: 'Complexe Sportif Municipal de Thonon-les-Bains', city: 'Thonon-les-Bains' },
  { name: 'Gymnase Municipal de Thonon-les-Bains', city: 'Thonon-les-Bains' },
  { name: 'Piscine Municipale de Thonon-les-Bains', city: 'Thonon-les-Bains' },
  { name: 'City Stade de Thonon-les-Bains', city: 'Thonon-les-Bains' },
  { name: 'Complexe Sportif Municipal de Épernay', city: 'Épernay' },
  { name: 'Gymnase Municipal de Épernay', city: 'Épernay' },
  { name: 'Piscine Municipale de Épernay', city: 'Épernay' },
  { name: 'City Stade de Épernay', city: 'Épernay' },
  { name: 'Complexe Sportif Municipal de Évreux', city: 'Évreux' },
  { name: 'Gymnase Municipal de Évreux', city: 'Évreux' },
  { name: 'Piscine Municipale de Évreux', city: 'Évreux' },
  { name: 'City Stade de Évreux', city: 'Évreux' },
  { name: 'Complexe Sportif Municipal de Saint-Lô', city: 'Saint-Lô' },
  { name: 'Gymnase Municipal de Saint-Lô', city: 'Saint-Lô' },
  { name: 'Piscine Municipale de Saint-Lô', city: 'Saint-Lô' },
  { name: 'City Stade de Saint-Lô', city: 'Saint-Lô' },
  { name: 'Complexe Sportif Municipal de Cherbourg-en-Cotentin', city: 'Cherbourg-en-Cotentin' },
  { name: 'Gymnase Municipal de Cherbourg-en-Cotentin', city: 'Cherbourg-en-Cotentin' },
  { name: 'Piscine Municipale de Cherbourg-en-Cotentin', city: 'Cherbourg-en-Cotentin' },
  { name: 'City Stade de Cherbourg-en-Cotentin', city: 'Cherbourg-en-Cotentin' },
  { name: 'Complexe Sportif Municipal de Alençon', city: 'Alençon' },
  { name: 'Gymnase Municipal de Alençon', city: 'Alençon' },
  { name: 'Piscine Municipale de Alençon', city: 'Alençon' },
  { name: 'City Stade de Alençon', city: 'Alençon' },
  { name: 'Complexe Sportif Municipal de La Roche-sur-Yon', city: 'La Roche-sur-Yon' },
  { name: 'Gymnase Municipal de La Roche-sur-Yon', city: 'La Roche-sur-Yon' },
  { name: 'Piscine Municipale de La Roche-sur-Yon', city: 'La Roche-sur-Yon' },
  { name: 'City Stade de La Roche-sur-Yon', city: 'La Roche-sur-Yon' },
];

const PARTNERS = [
  { id: 'p1', cat: 'CAFÉ', name: 'Café du Coureur', addr: '12 rue de Rivoli, Paris', offer: '-15% sur les boissons après un run' },
  { id: 'p2', cat: 'BOUTIQUE', name: 'Marathon Shop Paris', addr: '5 Rue de Rivoli, Paris', offer: '-10% sur les chaussures running' },
  { id: 'p3', cat: 'GYM', name: 'Iron Gym', addr: '44 rue de la Pompe, Paris', offer: '1 séance gratuite avec NutriSport' },
];

const FRIENDS = [
  { id: 'f1', name: 'Alice Runner', pseudo: '@alice_r', emoji: '🏃' },
  { id: 'f2', name: 'Marc', pseudo: '@marc_b', emoji: '🏀' },
  { id: 'f3', name: 'Sofia', pseudo: '@sofia_y', emoji: '🧘' },
  { id: 'f4', name: 'Cal Tester', pseudo: '@cal_t', emoji: '⚡' },
];

// Simule l'envoi d'un record à un ami/pseudo : pas de vrai backend multi-comptes ici,
// donc on journalise localement l'envoi (utile pour un historique "envoyés") plutôt que
// de prétendre livrer réellement le record sur le téléphone d'un autre utilisateur.
async function sendRecordToFriend(recordLabel, recipientLabel) {
  const entry = { id: String(Date.now()), record: recordLabel, to: recipientLabel, date: new Date().toISOString() };
  try {
    const raw = await AsyncStorage.getItem('sent_records_log');
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    await AsyncStorage.setItem('sent_records_log', JSON.stringify(list.slice(0, 50)));
  } catch (e) {}
  return entry;
}

// ---------- NUTRITION IA ----------
const DIET_PRESETS = ['OMAD', 'Keto', 'Méditerranéen', 'Jeûne intermittent'];

// Déduit un nom de régime à partir du nombre de repas/jour et de l'objectif calorique.
// Heuristique simple (pas de calcul BMR personnalisé) : à affiner plus tard avec poids/taille/âge/genre.
function suggestDietName(mealsPerDay, targetKcal) {
  const kcal = Number(targetKcal) || 0;

  let intensity; // catégorie liée aux calories
  if (kcal > 0 && kcal < 1500) intensity = 'Perte de poids stricte';
  else if (kcal < 1800) intensity = 'Perte de poids';
  else if (kcal < 2200) intensity = 'Maintenance';
  else if (kcal < 2800) intensity = 'Prise de masse légère';
  else intensity = 'Prise de masse';

  if (mealsPerDay === 1) return 'OMAD';
  if (mealsPerDay === 2) return `Jeûne intermittent — ${intensity}`;
  if (mealsPerDay === 3) return intensity;
  return `Fractionné (${mealsPerDay} repas) — ${intensity}`;
}

function tipForDiet(name) {
  const key = (name || '').trim().toLowerCase();
  if (key.includes('omad')) {
    return "Puisque vous suivez le régime OMAD, assurez-vous d'inclure une densité nutritionnelle élevée dans votre unique repas pour couvrir l'ensemble de vos besoins en vitamines et minéraux.";
  }
  if (key.includes('keto') || key.includes('cétogène') || key.includes('cetogene')) {
    return "En Keto, privilégiez les lipides de qualité (huile d'olive, avocat, oléagineux) et limitez les glucides sous 50g/jour pour rester en cétose.";
  }
  if (key.includes('méditerran') || key.includes('mediterran')) {
    return "Le régime méditerranéen mise sur les légumes, l'huile d'olive, le poisson et les légumineuses — variez les couleurs dans votre assiette.";
  }
  if (key.includes('fractionné') || key.includes('fractionne')) {
    return 'En alimentation fractionnée, répartis tes protéines équitablement entre chaque repas pour optimiser la satiété et la récupération musculaire.';
  }
  if (key.includes('stricte')) {
    return 'En perte de poids stricte, priorise les protéines maigres et les fibres à chaque repas pour préserver ta masse musculaire malgré le déficit calorique important.';
  }
  if (key.includes('perte de poids')) {
    return 'En perte de poids, vise un déficit calorique modéré et progressif — les changements brusques sont rarement tenables sur la durée.';
  }
  if (key.includes('prise de masse')) {
    return 'En prise de masse, associe ton surplus calorique à un entraînement en force régulier pour orienter les gains vers le muscle plutôt que la graisse.';
  }
  if (key.includes('maintenance')) {
    return "En maintenance, garde un apport stable et régulier — c'est la phase idéale pour stabiliser de bonnes habitudes alimentaires sur le long terme.";
  }
  if (key.includes('intermittent') || key.includes('jeûne') || key.includes('jeune')) {
    return 'En jeûne intermittent, concentre tes apports caloriques sur ta fenêtre de repas et priorise les protéines pour préserver ta masse musculaire.';
  }
  if (!key) return null;
  return "Adaptez vos portions à votre objectif calorique quotidien et privilégiez des aliments non transformés pour de meilleurs résultats.";
}

// Appelle l'API Gemini 1.5 Flash (Google AI Studio) pour analyser une photo de plat.
// Nécessite une clé API personnelle stockée localement (jamais partagée ailleurs).

// ---------- CACHE LOCAL DE PLATS ----------
// Pas de vrai serveur multi-utilisateurs derrière cette app : le cache est local à l'appareil.
// Un plat identifié une fois (par toi ou via une recherche) devient réutilisable instantanément
// et gratuitement, sans nouvel appel à l'IA, tant qu'il reste dans ce cache.
function normalizeDishKey(name) {
  return (name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}




// ---------- SYSTÈME D'AMIS & QR CODE ----------
// Génère un ID unique utilisateur basé sur un hash simple
function generateUserId(email) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'user_' + Math.abs(hash).toString(36).toUpperCase();
}

// Génère un QR code visuel simple (pattern de points basé sur l'ID)
function generateQRPattern(userId) {
  const pattern = [];
  const size = 7; // 7x7 grid
  let seed = 0;
  for (let i = 0; i < userId.length; i++) seed += userId.charCodeAt(i);

  for (let row = 0; row < size; row++) {
    const rowPattern = [];
    for (let col = 0; col < size; col++) {
      // Position markers (corners)
      if ((row < 2 && col < 2) || (row < 2 && col >= size - 2) || (row >= size - 2 && col < 2)) {
        rowPattern.push(1); // Fixed markers
      } else {
        // Pseudo-random based on userId
        const val = Math.sin(seed * (row + 1) * (col + 1)) * 10000;
        rowPattern.push(Math.abs(val) % 2 === 0 ? 1 : 0);
      }
    }
    pattern.push(rowPattern);
  }
  return pattern;
}

// AsyncStorage keys for friends
async function getFriendsList() {
  try {
    const raw = await AsyncStorage.getItem('friends_list_v1');
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

async function addFriend(friendData) {
  const friends = await getFriendsList();
  // Check if already exists
  if (friends.find(f => f.id === friendData.id)) return friends;
  const updated = [...friends, { ...friendData, addedAt: new Date().toISOString() }];
  try {
    await AsyncStorage.setItem('friends_list_v1', JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

async function removeFriend(friendId) {
  const friends = await getFriendsList();
  const updated = friends.filter(f => f.id !== friendId);
  try {
    await AsyncStorage.setItem('friends_list_v1', JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

// ---------- SCANNER CODE-BARRES ALIMENTAIRE (historique + Open Food Facts) ----------
const PRODUCT_HISTORY_KEY = 'product_history_v1';

// Historique des produits déjà scannés, trié du plus récent au plus ancien.
async function getProductHistory() {
  try {
    const raw = await AsyncStorage.getItem(PRODUCT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

// Ajoute (ou met à jour) un produit dans l'historique local après un scan réussi.
async function saveProductToHistory(product) {
  try {
    const history = await getProductHistory();
    const existing = history.find((p) => p.barcode === product.barcode);
    const entry = {
      barcode: product.barcode,
      name: product.dish,
      brand: product.brand,
      portion_g: product.portion_g,
      kcal: product.kcal,
      protein_g: product.protein_g,
      carbs_g: product.carbs_g,
      fat_g: product.fat_g,
      scanCount: existing ? (existing.scanCount || 1) + 1 : 1,
      lastScannedAt: new Date().toISOString(),
    };
    const updated = [entry, ...history.filter((p) => p.barcode !== product.barcode)].slice(0, 100);
    await AsyncStorage.setItem(PRODUCT_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {}
}

// Récupère les infos nutritionnelles d'un produit à partir de son code-barres.
// 1) Regarde d'abord dans l'historique local (évite un appel réseau inutile).
// 2) Sinon interroge l'API publique et gratuite Open Food Facts.
async function fetchProductFromBarcode(barcode) {
  // 1) Cache local
  try {
    const history = await getProductHistory();
    const cached = history.find((p) => p.barcode === barcode);
    if (cached) {
      const cachedProduct = {
        barcode: cached.barcode,
        dish: cached.name,
        brand: cached.brand,
        portion_g: cached.portion_g,
        kcal: cached.kcal,
        protein_g: cached.protein_g,
        carbs_g: cached.carbs_g,
        fat_g: cached.fat_g,
        fromCache: true,
      };
      await saveProductToHistory(cachedProduct);
      return cachedProduct;
    }
  } catch (e) {}

  // 2) Open Food Facts (API publique, sans clé requise)
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    const data = await res.json();
    if (!data || data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n = p.nutriments || {};
    const kcal100 = Math.round(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0);
    const protein100 = Math.round((n['proteins_100g'] ?? 0) * 10) / 10;
    const carbs100 = Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10;
    const fat100 = Math.round((n['fat_100g'] ?? 0) * 10) / 10;

    // Portion : utilise la taille de portion déclarée si dispo, sinon 100g par défaut.
    const servingG = parseFloat(n['serving_quantity']) || 100;
    const ratio = servingG / 100;

    const product = {
      barcode,
      dish: p.product_name || p.generic_name || 'Produit inconnu',
      brand: p.brands || '',
      image_url: p.image_url || p.image_front_url || null,
      portion_g: Math.round(servingG),
      kcal: Math.round(kcal100 * ratio),
      protein_g: Math.round(protein100 * ratio * 10) / 10,
      carbs_g: Math.round(carbs100 * ratio * 10) / 10,
      fat_g: Math.round(fat100 * ratio * 10) / 10,
      kcal_per_100g: kcal100,
      protein_per_100g: protein100,
      carbs_per_100g: carbs100,
      fat_per_100g: fat100,
      fromCache: false,
    };
    await saveProductToHistory(product);
    return product;
  } catch (e) {
    return null;
  }
}

const BLOCKED_LIST_KEY = 'blocked_friends_v1';

async function getBlockedList() {
  try {
    const raw = await AsyncStorage.getItem(BLOCKED_LIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

async function blockFriend(friendId) {
  await removeFriend(friendId);
  const blocked = await getBlockedList();
  if (blocked.find(b => b.id === friendId)) return blocked;
  const updated = [...blocked, { id: friendId, blockedAt: new Date().toISOString() }];
  try {
    await AsyncStorage.setItem(BLOCKED_LIST_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

async function unblockFriend(friendId) {
  const blocked = await getBlockedList();
  const updated = blocked.filter(b => b.id !== friendId);
  try {
    await AsyncStorage.setItem(BLOCKED_LIST_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

async function isBlocked(friendId) {
  const blocked = await getBlockedList();
  return blocked.some(b => b.id === friendId);
}

async function getCurrentUser() {
  try {
    const raw = await AsyncStorage.getItem('current_user_v1');
    if (raw) return JSON.parse(raw);
    // Default user
    const defaultUser = { email: 'runner@example.com', pseudo: '@runner_default', name: 'Runner', emoji: '🏃' };
    await AsyncStorage.setItem('current_user_v1', JSON.stringify(defaultUser));
    return defaultUser;
  } catch (e) {
    return { email: 'runner@example.com', pseudo: '@runner_default', name: 'Runner', emoji: '🏃' };
  }
}

async function saveCurrentUser(user) {
  try {
    await AsyncStorage.setItem('current_user_v1', JSON.stringify(user));
  } catch (e) {}
}

// Envoi de record vers un ami (amélioré avec vrai système d'amis)
async function sendRecordToFriendEnhanced(recordLabel, recipientId, recipientName) {
  const entry = { 
    id: String(Date.now()), 
    record: recordLabel, 
    toId: recipientId,
    toName: recipientName,
    date: new Date().toISOString(),
    status: 'sent'
  };
  try {
    const raw = await AsyncStorage.getItem('sent_records_log');
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    await AsyncStorage.setItem('sent_records_log', JSON.stringify(list.slice(0, 50)));
  } catch (e) {}
  return entry;
}

// Composant QR Code visuel
function VisualQRCode({ userId, size = 120 }) {
  const pattern = generateQRPattern(userId);
  const cellSize = size / 7;
  return (
    <View style={{ width: size, height: size, backgroundColor: '#fff', padding: 4 }}>
      {pattern.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row' }}>
          {row.map((cell, colIndex) => (
            <View 
              key={colIndex} 
              style={{ 
                width: cellSize - 1, 
                height: cellSize - 1, 
                backgroundColor: cell ? '#000' : '#fff',
                margin: 0.5
              }} 
            />
          ))}
        </View>
      ))}
    </View>
  );
}



// ---------- SYSTÈME DE COÉQUIPIERS RÉGULIERS ----------
// Permet de marquer des amis comme "coéquipiers réguliers" pour créer
// rapidement des événements en équipe avec eux.

const TEAMMATES_STORAGE_KEY = 'teammates_v1';

async function getTeammatesList() {
  try {
    const raw = await AsyncStorage.getItem(TEAMMATES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

async function addTeammate(friendId) {
  const teammates = await getTeammatesList();
  if (teammates.find(t => t.friendId === friendId)) return teammates;
  const updated = [...teammates, { 
    friendId, 
    addedAt: new Date().toISOString(),
    sport: null, // sport préféré partagé, à définir plus tard
    notes: ''
  }];
  try {
    await AsyncStorage.setItem(TEAMMATES_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

async function removeTeammate(friendId) {
  const teammates = await getTeammatesList();
  const updated = teammates.filter(t => t.friendId !== friendId);
  try {
    await AsyncStorage.setItem(TEAMMATES_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

async function isTeammate(friendId) {
  const teammates = await getTeammatesList();
  return teammates.some(t => t.friendId === friendId);
}

async function toggleTeammate(friendId) {
  const isTeamm = await isTeammate(friendId);
  if (isTeamm) {
    return await removeTeammate(friendId);
  } else {
    return await addTeammate(friendId);
  }
}

async function updateTeammateSport(friendId, sport) {
  const teammates = await getTeammatesList();
  const updated = teammates.map(t => 
    t.friendId === friendId ? { ...t, sport } : t
  );
  try {
    await AsyncStorage.setItem(TEAMMATES_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

async function updateTeammateNotes(friendId, notes) {
  const teammates = await getTeammatesList();
  const updated = teammates.map(t => 
    t.friendId === friendId ? { ...t, notes } : t
  );
  try {
    await AsyncStorage.setItem(TEAMMATES_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

// ---------- COMMENTAIRES & LIKES SUR ÉVÉNEMENTS ----------
const EVENT_COMMENTS_KEY = 'event_comments_v1';
const EVENT_LIKES_KEY = 'event_likes_v1';

async function getEventComments(eventId) {
  try {
    const raw = await AsyncStorage.getItem(EVENT_COMMENTS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return all[eventId] || [];
  } catch (e) { return []; }
}

async function addEventComment(eventId, text, author) {
  try {
    const raw = await AsyncStorage.getItem(EVENT_COMMENTS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    const comments = all[eventId] || [];
    const newComment = {
      id: String(Date.now()),
      text,
      author: author || 'Moi',
      date: new Date().toISOString(),
    };
    comments.push(newComment);
    all[eventId] = comments;
    await AsyncStorage.setItem(EVENT_COMMENTS_KEY, JSON.stringify(all));
    return newComment;
  } catch (e) { return null; }
}

async function getEventLikes(eventId) {
  try {
    const raw = await AsyncStorage.getItem(EVENT_LIKES_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return all[eventId] || { count: 0, userLiked: false };
  } catch (e) { return { count: 0, userLiked: false }; }
}

async function toggleEventLike(eventId) {
  try {
    const raw = await AsyncStorage.getItem(EVENT_LIKES_KEY);
    const all = raw ? JSON.parse(raw) : {};
    const current = all[eventId] || { count: 0, userLiked: false };
    const updated = {
      count: current.userLiked ? Math.max(0, current.count - 1) : current.count + 1,
      userLiked: !current.userLiked,
    };
    all[eventId] = updated;
    await AsyncStorage.setItem(EVENT_LIKES_KEY, JSON.stringify(all));
    return updated;
  } catch (e) { return { count: 0, userLiked: false }; }
}

// Récupère les données complètes des coéquipiers (fusionne avec la liste d'amis)
async function getTeammatesWithDetails() {
  const teammates = await getTeammatesList();
  const friends = await getFriendsList();
  return teammates.map(t => {
    const friend = friends.find(f => f.id === t.friendId);
    return friend ? { ...t, ...friend } : t;
  }).filter(t => t.name); // garde seulement ceux dont on a les détails
}

// ---------- SYSTÈME D'ABONNEMENT PREMIUM ----------
const PREMIUM_PRICE = '13.99€/mois';
const FREE_EVENT_LIMIT = 3;
const PAY_PER_EVENT_PRICE = 1; // 1€ par événement (création ou participation)

async function getSubscriptionStatus() {
  try {
    const raw = await AsyncStorage.getItem('premium_subscription_v1');
    if (!raw) return { isPremium: false, eventsCreated: 0, eventsJoined: 0, paidEvents: [], trialUsed: 0 };
    return JSON.parse(raw);
  } catch (e) {
    return { isPremium: false, eventsCreated: 0, eventsJoined: 0, paidEvents: [], trialUsed: 0 };
  }
}

async function setSubscriptionStatus(status) {
  try {
    await AsyncStorage.setItem('premium_subscription_v1', JSON.stringify(status));
  } catch (e) {}
}

async function incrementEventCount() {
  const sub = await getSubscriptionStatus();
  sub.eventsCreated = (sub.eventsCreated || 0) + 1;
  await setSubscriptionStatus(sub);
  return sub;
}

async function incrementJoinCount() {
  const sub = await getSubscriptionStatus();
  sub.eventsJoined = (sub.eventsJoined || 0) + 1;
  await setSubscriptionStatus(sub);
  return sub;
}

async function canCreateEvent() {
  const sub = await getSubscriptionStatus();
  if (sub.isPremium) return { allowed: true, remaining: -1, needPayment: false };
  const used = sub.eventsCreated || 0;
  const remaining = Math.max(0, FREE_EVENT_LIMIT - used);
  return { allowed: true, remaining, needPayment: remaining <= 0 };
}

async function canJoinEvent(eventId) {
  const sub = await getSubscriptionStatus();
  if (sub.isPremium) return { allowed: true, needPayment: false };
  // Vérifier si déjà payé pour cet événement
  const paidEvents = sub.paidEvents || [];
  if (paidEvents.includes(eventId)) return { allowed: true, needPayment: false };
  const used = sub.eventsJoined || 0;
  const remaining = Math.max(0, FREE_EVENT_LIMIT - used);
  return { allowed: true, remaining, needPayment: remaining <= 0 };
}

async function payForEvent(eventId) {
  const sub = await getSubscriptionStatus();
  const paidEvents = sub.paidEvents || [];
  if (!paidEvents.includes(eventId)) {
    paidEvents.push(eventId);
    sub.paidEvents = paidEvents;
    await setSubscriptionStatus(sub);
  }
  return sub;
}

async function activatePremium() {
  const sub = await getSubscriptionStatus();
  sub.isPremium = true;
  sub.activatedAt = new Date().toISOString();
  await setSubscriptionStatus(sub);
  return sub;
}

async function cancelPremium() {
  const sub = await getSubscriptionStatus();
  sub.isPremium = false;
  sub.cancelledAt = new Date().toISOString();
  await setSubscriptionStatus(sub);
  return sub;
}

// ---------- SETTINGS HISTORIQUE DE PRATIQUE ----------
const PRACTICE_HISTORY_SETTINGS_KEY = 'practice_history_settings_v1';

async function getPracticeHistorySettings() {
  try {
    const raw = await AsyncStorage.getItem(PRACTICE_HISTORY_SETTINGS_KEY);
    if (!raw) return { enableComments: true, enableLikes: true };
    return JSON.parse(raw);
  } catch (e) {
    return { enableComments: true, enableLikes: true };
  }
}

async function setPracticeHistorySettings(settings) {
  try {
    await AsyncStorage.setItem(PRACTICE_HISTORY_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}
}

const PRACTICE_HISTORY_KEY = 'practice_history_v1';

async function getPracticeHistory() {
  try {
    const raw = await AsyncStorage.getItem(PRACTICE_HISTORY_KEY);
    if (raw) return JSON.parse(raw);
    // Données d'exemple pour la première utilisation
    return [
      {
        id: 'demo_1',
        sport: 'course',
        date: new Date(Date.now() - 86400000).toISOString(), // hier
        distanceKm: 5.2,
        duration: '32:15',
        calories: 312,
        isRecord: true,
        notes: "Bonne sensation aujourd'hui, allure régulière.",
        likes: { count: 3, userLiked: false },
        comments: [
          { id: 'c1', text: 'Bravo pour la régularité ! 💪', author: 'Marc', date: new Date(Date.now() - 3600000).toISOString() },
        ],
      },
      {
        id: 'demo_2',
        sport: 'pushup',
        date: new Date(Date.now() - 172800000).toISOString(), // avant-hier
        reps: 45,
        duration: '8:30',
        calories: 85,
        isRecord: false,
        notes: 'Série de 15-15-15, prochain objectif 50.',
        likes: { count: 1, userLiked: true },
        comments: [],
      },
      {
        id: 'demo_3',
        sport: 'velo',
        date: new Date(Date.now() - 259200000).toISOString(), // il y a 3 jours
        distanceKm: 18.5,
        duration: '52:00',
        calories: 420,
        isRecord: false,
        notes: 'Sortie vélo en famille le long de la Seine.',
        likes: { count: 5, userLiked: false },
        comments: [
          { id: 'c2', text: 'Quel parcours as-tu suivi ?', author: 'Sofia', date: new Date(Date.now() - 180000000).toISOString() },
          { id: 'c3', text: 'Super initiative ! 🚴', author: 'Alice', date: new Date(Date.now() - 170000000).toISOString() },
        ],
      },
    ];
  } catch (e) { return []; }
}

async function addPracticeEntry(entry) {
  try {
    const history = await getPracticeHistory();
    const newEntry = {
      id: String(Date.now()),
      ...entry,
      date: new Date().toISOString(),
      likes: { count: 0, userLiked: false },
      comments: [],
    };
    history.unshift(newEntry);
    await AsyncStorage.setItem(PRACTICE_HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
    return newEntry;
  } catch (e) { return null; }
}

async function togglePracticeLike(entryId) {
  try {
    const history = await getPracticeHistory();
    const idx = history.findIndex(h => h.id === entryId);
    if (idx >= 0) {
      const current = history[idx].likes || { count: 0, userLiked: false };
      history[idx].likes = {
        count: current.userLiked ? Math.max(0, current.count - 1) : current.count + 1,
        userLiked: !current.userLiked,
      };
      await AsyncStorage.setItem(PRACTICE_HISTORY_KEY, JSON.stringify(history));
    }
    return history;
  } catch (e) { return []; }
}

async function addPracticeComment(entryId, text, author) {
  try {
    const history = await getPracticeHistory();
    const idx = history.findIndex(h => h.id === entryId);
    if (idx >= 0) {
      const newComment = {
        id: String(Date.now()),
        text,
        author: author || 'Moi',
        date: new Date().toISOString(),
      };
      history[idx].comments = [...(history[idx].comments || []), newComment];
      await AsyncStorage.setItem(PRACTICE_HISTORY_KEY, JSON.stringify(history));
    }
    return history;
  } catch (e) { return []; }
}

// Supprime définitivement une entrée de l'historique de pratique sportive.
async function deletePracticeEntry(entryId) {
  try {
    const history = await getPracticeHistory();
    const updated = history.filter((h) => h.id !== entryId);
    await AsyncStorage.setItem(PRACTICE_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) { return []; }
}

// Ajoute une séance à l'historique de pratique sportive à partir d'un événement rejoint.
// Idempotent : si une entrée existe déjà pour cet événement, on ne la duplique pas.
async function addPracticeEntryFromEvent(event) {
  try {
    const history = await getPracticeHistory();
    if (history.some((h) => h.sourceEventId === event.id)) return null;
    return await addPracticeEntry({
      sport: event.sport,
      notes: `Séance rejointe : ${event.title} — ${event.loc}`,
      sourceType: 'event',
      sourceEventId: event.id,
    });
  } catch (e) { return null; }
}

// ---------- SYSTÈME DE PROFILS COACH (identité NON vérifiée à ce stade) ----------
const COACH_CERTIFICATION_KEY = 'coach_certification_v1';
const COMMISSION_RATE = 0.10; // 10% de commission

const COMBAT_SPORTS = ['boxe', 'kickboxing', 'mma', 'judo', 'karate', 'taekwondo', 'jiujitsu', 'capoeira'];

async function getCoachCertification() {
  try {
    const raw = await AsyncStorage.getItem(COACH_CERTIFICATION_KEY);
    if (!raw) return { isCertified: false, phone: null, verifiedAt: null, badgeNumber: null, sports: [] };
    return JSON.parse(raw);
  } catch (e) {
    return { isCertified: false, phone: null, verifiedAt: null, badgeNumber: null, sports: [] };
  }
}

async function setCoachCertification(cert) {
  try {
    await AsyncStorage.setItem(COACH_CERTIFICATION_KEY, JSON.stringify(cert));
  } catch (e) {}
}

// Crée un profil coach à partir d'un numéro de téléphone.
// ⚠️ Aucune vérification d'identité réelle n'est effectuée ici (pas d'API SMS ni de
// contrôle de diplôme) — le champ `isCertified` sert uniquement en interne à savoir si
// un profil coach existe, il ne doit jamais être présenté à l'utilisateur comme une
// certification. Voir le disclaimer affiché dans CoachCertificationScreen.
async function verifyCoachPhone(phone, sports) {
  const badgeNumber = 'CF-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  const cert = {
    isCertified: true,
    phone: phone,
    verifiedAt: new Date().toISOString(),
    badgeNumber: badgeNumber,
    sports: sports || [],
  };
  await setCoachCertification(cert);
  return cert;
}



// ---------- SYSTÈME DE PROGRESSION NIVEAU JOUEUR ----------
const PLAYER_LEVEL_KEY = 'player_level_v1';
const PLAYER_STATS_KEY = 'player_stats_v1';

const LEVEL_THRESHOLDS = [
  { key: 'debutant', label: 'Débutant', emoji: '🌱', minEvents: 0, minMatches: 0, minSessions: 0 },
  { key: 'intermediate', label: 'Intermédiaire', emoji: '⭐', minEvents: 3, minMatches: 5, minSessions: 5 },
  { key: 'confirme', label: 'Confirmé', emoji: '🔥', minEvents: 10, minMatches: 20, minSessions: 15 },
  { key: 'expert', label: 'Expert', emoji: '💎', minEvents: 25, minMatches: 50, minSessions: 40 },
];

async function getPlayerStats() {
  try {
    const raw = await AsyncStorage.getItem(PLAYER_STATS_KEY);
    if (!raw) return { eventsJoined: 0, eventsCreated: 0, matchesSwiped: 0, trackSessions: 0, totalKm: 0 };
    return JSON.parse(raw);
  } catch (e) {
    return { eventsJoined: 0, eventsCreated: 0, matchesSwiped: 0, trackSessions: 0, totalKm: 0 };
  }
}

async function setPlayerStats(stats) {
  try {
    await AsyncStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(stats));
  } catch (e) {}
}

async function incrementStat(statName, value = 1) {
  const stats = await getPlayerStats();
  stats[statName] = (stats[statName] || 0) + value;
  await setPlayerStats(stats);
  return stats;
}

async function getPlayerLevel() {
  const stats = await getPlayerStats();
  const totalEvents = (stats.eventsJoined || 0) + (stats.eventsCreated || 0);
  const totalMatches = stats.matchesSwiped || 0;
  const totalSessions = stats.trackSessions || 0;

  // Déterminer le niveau selon les seuils (le plus haut atteint)
  let currentLevel = LEVEL_THRESHOLDS[0];
  for (const lvl of LEVEL_THRESHOLDS) {
    if (totalEvents >= lvl.minEvents && totalMatches >= lvl.minMatches && totalSessions >= lvl.minSessions) {
      currentLevel = lvl;
    }
  }
  return { ...currentLevel, stats: { totalEvents, totalMatches, totalSessions, totalKm: stats.totalKm || 0 } };
}

async function getNextLevelProgress() {
  const level = await getPlayerLevel();
  const stats = await getPlayerStats();
  const totalEvents = (stats.eventsJoined || 0) + (stats.eventsCreated || 0);
  const totalMatches = stats.matchesSwiped || 0;
  const totalSessions = stats.trackSessions || 0;

  const currentIdx = LEVEL_THRESHOLDS.findIndex(l => l.key === level.key);
  const nextLevel = LEVEL_THRESHOLDS[currentIdx + 1];

  if (!nextLevel) return null; // Déjà au niveau max

  const progressEvents = Math.min(1, totalEvents / nextLevel.minEvents);
  const progressMatches = Math.min(1, totalMatches / nextLevel.minMatches);
  const progressSessions = Math.min(1, totalSessions / nextLevel.minSessions);
  const overallProgress = Math.round(((progressEvents + progressMatches + progressSessions) / 3) * 100);

  return {
    nextLevel: nextLevel.label,
    nextEmoji: nextLevel.emoji,
    progress: overallProgress,
    remainingEvents: Math.max(0, nextLevel.minEvents - totalEvents),
    remainingMatches: Math.max(0, nextLevel.minMatches - totalMatches),
    remainingSessions: Math.max(0, nextLevel.minSessions - totalSessions),
  };
}

async function isCoachForSport(sportKey) {
  const cert = await getCoachCertification();
  if (!cert.isCertified) return false;
  return cert.sports.includes(sportKey);
}

function isCombatSport(sportKey) {
  return COMBAT_SPORTS.includes(sportKey);
}

// ---------- SYSTÈME DE DEMANDES DE RENCONTRE ----------
const MATCH_REQUESTS_KEY = 'match_requests_v1';
const MATCH_CONVERSATIONS_KEY = 'match_conversations_v1';

async function getMatchRequests() {
  try {
    const raw = await AsyncStorage.getItem(MATCH_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

async function saveMatchRequest(request) {
  try {
    const requests = await getMatchRequests();
    requests.unshift(request);
    await AsyncStorage.setItem(MATCH_REQUESTS_KEY, JSON.stringify(requests));
    return requests;
  } catch (e) { return []; }
}

async function updateMatchRequest(requestId, updates) {
  try {
    const requests = await getMatchRequests();
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx >= 0) {
      requests[idx] = { ...requests[idx], ...updates };
      await AsyncStorage.setItem(MATCH_REQUESTS_KEY, JSON.stringify(requests));
    }
    return requests;
  } catch (e) { return []; }
}

async function getMatchConversations() {
  try {
    const raw = await AsyncStorage.getItem(MATCH_CONVERSATIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

async function addMessageToConversation(requestId, message) {
  try {
    const convs = await getMatchConversations();
    if (!convs[requestId]) convs[requestId] = [];
    convs[requestId].push({
      ...message,
      id: String(Date.now()),
      timestamp: new Date().toISOString(),
    });
    await AsyncStorage.setItem(MATCH_CONVERSATIONS_KEY, JSON.stringify(convs));
    return convs[requestId];
  } catch (e) { return []; }
}

async function getConversationMessages(requestId) {
  try {
    const convs = await getMatchConversations();
    return convs[requestId] || [];
  } catch (e) { return []; }
}


// ---------- SMALL COMPONENTS ----------
function Chip({ label, emoji, selected, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, selected && s.chipOn]}>
      <Text style={[s.chipText, selected && s.chipTextOn]}>
        {emoji ? emoji + ' ' : ''}
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Header({ title, onBack, right }) {
  return (
    <View style={s.header}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={s.headerSide}>
          <Ionicons name="chevron-back" size={26} color={C.dark} />
        </TouchableOpacity>
      ) : (
        <View style={s.headerSide} />
      )}
      <Text style={s.headerTitle}>{title}</Text>
      <View style={s.headerSide}>{right}</View>
    </View>
  );
}

function EmptyState({ icon, title, subtitle, cta, onCta }) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Ionicons name={icon} size={40} color={C.primary} />
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={s.emptySub}>{subtitle}</Text> : null}
      {cta ? (
        <TouchableOpacity style={s.emptyCta} onPress={onCta}>
          <Text style={s.emptyCtaText}>{cta}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function Banner({ icon, eyebrow, title, subtitle, colors = C.gradPurple, badge }) {
  return (
    <Grad colors={colors} style={s.banner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={s.bannerIcon}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={s.bannerEyebrow}>{eyebrow}</Text> : null}
        <Text style={s.bannerTitle}>{title}</Text>
        {subtitle ? <Text style={s.bannerSub}>{subtitle}</Text> : null}
      </View>
      {badge ? (
        <View style={s.bannerBadge}>
          <Text style={s.bannerBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </Grad>
  );
}

// Panneau réutilisable pour envoyer un record à un ami (liste réelle) ou par pseudo (recherche libre).
function SendRecordPanel({ visible, onClose, recordLabel, recordType }) {
  const [pseudoInput, setPseudoInput] = useState('');
  const [sentTo, setSentTo] = useState(null);
  const [friends, setFriends] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    (async () => {
      const f = await getFriendsList();
      const blocked = await getBlockedList();
      const blockedIds = blocked.map(b => b.id);
      // Filtrer les amis bloqués
      const filtered = f.filter(friend => !blockedIds.includes(friend.id));
      setFriends(filtered);
      const u = await getCurrentUser();
      setCurrentUser(u);
    })();
  }, [visible]);

  const reset = () => {
    setPseudoInput('');
    setSentTo(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const doSend = async (recipient) => {
    await sendRecordToFriendEnhanced(recordLabel, recipient.id || recipient.pseudo, recipient.name || recipient.pseudo);
    setSentTo(recipient.name || recipient.pseudo);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <View style={s.modalHeaderRow}>
            <Text style={s.modalTitle}>Envoyer le record</Text>
            <TouchableOpacity onPress={close} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={C.gray} />
            </TouchableOpacity>
          </View>
          <View style={s.modalRecordChip}>
            <Ionicons name={recordType === 'personal' ? "trophy" : "fitness"} size={14} color={recordType === 'personal' ? '#22C55E' : C.primary} />
            <Text style={[s.modalRecordText, { color: recordType === 'personal' ? '#22C55E' : C.primary }]}>
              {recordType === 'personal' ? '🏆 RECORD PERSO' : '💪 EXERCICE'} — {recordLabel}
            </Text>
          </View>

          {sentTo ? (
            <View style={s.sentConfirm}>
              <Ionicons name="checkmark-circle" size={40} color="#15803D" />
              <Text style={s.sentConfirmText}>Envoyé à {sentTo} !</Text>
              <TouchableOpacity style={[s.joinBtn, { marginTop: 16 }]} onPress={close}>
                <Text style={s.joinBtnText}>FERMER</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={s.subLabel}>MES AMIS ({friends.length})</Text>
              {friends.length === 0 ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Ionicons name="people-outline" size={32} color={C.light} />
                  <Text style={{ color: C.gray, marginTop: 8, textAlign: 'center' }}>Aucun ami pour le moment.</Text>
                  <Text style={{ color: C.primary, fontWeight: '700', fontSize: 12, marginTop: 4 }}>Scanne un QR code dans ton profil pour ajouter des amis !</Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 220 }}>
                  {friends.map((f) => (
                    <TouchableOpacity key={f.id} style={s.friendRow} onPress={() => doSend(f)}>
                      <View style={s.friendAvatar}>
                        <Text style={{ fontSize: 18 }}>{f.emoji || '👤'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.friendName}>{f.name}</Text>
                        <Text style={s.friendPseudo}>{f.pseudo}</Text>
                      </View>
                      <Ionicons name="send" size={16} color={C.primary} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <View style={s.orDivider}>
                <View style={s.orLine} />
                <Text style={s.orText}>OU</Text>
                <View style={s.orLine} />
              </View>

              <Text style={s.subLabel}>ENVOYER PAR PSEUDO / ID</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="@pseudo ou ID utilisateur"
                  autoCapitalize="none"
                  value={pseudoInput}
                  onChangeText={setPseudoInput}
                />
                <TouchableOpacity
                  style={[s.joinBtn, !pseudoInput.trim() && { opacity: 0.4 }]}
                  disabled={!pseudoInput.trim()}
                  onPress={() => doSend({ id: pseudoInput.trim(), name: pseudoInput.trim(), pseudo: pseudoInput.trim() })}
                >
                  <Text style={s.joinBtnText}>ENVOYER</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// Ouvre l'app de plans native (Apple Plans sur iOS, Google Maps sur Android) avec
// l'itinéraire jusqu'aux coordonnées données. Repli sur Google Maps web si l'app native
// ne répond pas (ex: dans la preview web de Snack).
function openDirectionsTo(lat, lon, label) {
  const encodedLabel = encodeURIComponent(label || 'Lieu de rencontre');
  const nativeUrl =
    Platform.OS === 'ios' ? `maps://app?daddr=${lat},${lon}&q=${encodedLabel}` : `google.navigation:q=${lat},${lon}`;
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  Linking.openURL(nativeUrl).catch(() => Linking.openURL(webUrl));
}

// Variante par adresse texte (utilisée pour les terrains publics dont on ne connaît
// que le nom/la ville, sans coordonnées GPS précises).
function openDirectionsToAddress(address) {
  const encoded = encodeURIComponent(address);
  const nativeUrl = Platform.OS === 'ios' ? `maps://?daddr=${encoded}` : `google.navigation:q=${encoded}`;
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
  Linking.openURL(nativeUrl).catch(() => Linking.openURL(webUrl));
}

// Carte "Itinéraire" réutilisable : affiche la distance restante jusqu'au lieu d'un événement
// et propose d'ouvrir l'itinéraire dans l'app de plans. Utilisée à l'inscription à un
// événement ET depuis le chat du groupe correspondant.
function EventDirectionsCard({ event }) {
  const [userCoords, setUserCoords] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshPosition = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission GPS refusée — impossible de calculer la distance.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setUserCoords(loc.coords);
    } catch (e) {
      setErrorMsg("Impossible de récupérer ta position pour l'instant.");
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshPosition();
    // eslint-disable-next-line
  }, []);

  if (!event || event.lat == null || event.lon == null) return null;

  const distanceKm = userCoords ? haversineKm(userCoords.latitude, userCoords.longitude, event.lat, event.lon) : null;

  return (
    <View style={s.directionsCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Ionicons name="navigate-circle" size={20} color={C.primary} />
        <Text style={s.directionsTitle}>Itinéraire vers {event.loc}</Text>
      </View>

      {loading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
          <ActivityIndicator size="small" color={C.primary} />
          <Text style={{ color: C.gray, fontSize: 12 }}>Localisation en cours…</Text>
        </View>
      ) : errorMsg ? (
        <Text style={s.directionsError}>{errorMsg}</Text>
      ) : distanceKm != null ? (
        <Text style={s.directionsDistance}>
          📍 <Text style={{ fontWeight: '800' }}>{distanceKm.toFixed(1)} km</Text> restants jusqu’au lieu de rencontre
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <TouchableOpacity style={s.directionsBtn} onPress={() => openDirectionsTo(event.lat, event.lon, event.loc)}>
          <Ionicons name="navigate" size={14} color="#fff" />
          <Text style={s.directionsBtnText}>OUVRIR L’ITINÉRAIRE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.directionsRefreshBtn} onPress={refreshPosition}>
          <Ionicons name="refresh" size={16} color={C.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}


function CoachCertificationScreen({ go, goBack, params }) {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('phone'); // phone | success
  const [loading, setLoading] = useState(false);
  const [cert, setCert] = useState(null);
  const sport = params?.sport;

  const createProfile = async () => {
    if (!phone || phone.length < 10) {
      alert('Veuillez entrer un numéro de téléphone valide.');
      return;
    }
    setLoading(true);
    const newCert = await verifyCoachPhone(phone, sport ? [sport] : []);
    setCert(newCert);
    setLoading(false);
    setStep('success');
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title="Profil Coach" onBack={goBack} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>

        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(91,79,233,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Ionicons name="person-circle-outline" size={40} color={C.primary} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: C.dark, textAlign: 'center' }}>
            Créer mon profil coach
          </Text>
          <Text style={{ color: C.gray, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
            {sport ? `Propose des séances de ${ALL_SPORTS.find(s => s.key === sport)?.label || sport}` : 'Propose des séances en tant que coach'}
          </Text>
        </View>

        {/* Avertissement : identité non vérifiée */}
        <View style={{ flexDirection: 'row', gap: 10, backgroundColor: '#FEF3C7', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#F59E0B' }}>
          <Ionicons name="warning-outline" size={20} color="#92400E" />
          <Text style={{ color: '#92400E', fontSize: 12, flex: 1, lineHeight: 17 }}>
            La vérification d'identité et de diplôme n'est pas encore disponible. Ce profil n'est donc pas certifié — informe-en clairement les personnes qui rejoignent tes séances.
          </Text>
        </View>

        {step === 'phone' ? (
          <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ fontWeight: '800', fontSize: 14, color: C.dark, marginBottom: 12 }}>📱 Coordonnées de contact</Text>
            <Text style={{ color: C.gray, fontSize: 12, marginBottom: 16, lineHeight: 18 }}>
              Ce numéro sera utilisé pour te contacter au sujet de tes séances.
            </Text>
            <Text style={s.label}>NUMÉRO DE TÉLÉPHONE</Text>
            <TextInput
              style={s.input}
              placeholder="06 12 34 56 78"
              placeholderTextColor={C.light}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={14}
            />
            <TouchableOpacity 
              style={[s.submitBtn, { marginTop: 20 }]} 
              onPress={createProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.submitText}>CRÉER MON PROFIL</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ backgroundColor: C.chip, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border, alignItems: 'center' }}>
            <Ionicons name="person-circle" size={48} color={C.primary} />
            <Text style={{ fontSize: 20, fontWeight: '900', color: C.dark, marginTop: 16 }}>
              Profil coach créé
            </Text>
            <Text style={{ color: C.gray, fontSize: 13, marginTop: 8, textAlign: 'center' }}>
              Non vérifié — visible comme tel par les personnes qui te contactent.
            </Text>
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 16, width: '100%' }}>
              <Text style={{ fontWeight: '800', fontSize: 13, color: C.dark, marginBottom: 8 }}>📋 Vos informations</Text>
              <Text style={{ color: C.gray, fontSize: 12 }}>Identifiant: <Text style={{ fontWeight: '800', color: C.primary }}>{cert?.badgeNumber}</Text></Text>
              <Text style={{ color: C.gray, fontSize: 12, marginTop: 4 }}>Téléphone: {cert?.phone}</Text>
              <Text style={{ color: C.gray, fontSize: 12, marginTop: 4 }}>Sport(s): {cert?.sports.map(s => ALL_SPORTS.find(sp => sp.key === s)?.label || s).join(', ')}</Text>
            </View>
            <TouchableOpacity 
              style={[s.submitBtn, { marginTop: 20, width: '100%' }]} 
              onPress={goBack}
            >
              <Text style={s.submitText}>CONTINUER</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ marginTop: 20, backgroundColor: C.chip, borderRadius: 14, padding: 14 }}>
          <Text style={{ fontWeight: '800', fontSize: 12, color: C.dark, marginBottom: 8 }}>ℹ️ Informations</Text>
          <Text style={{ color: C.gray, fontSize: 11, lineHeight: 18 }}>
            {`• Un profil coach est requis pour les sports de combat et arts martiaux
• Vous pouvez fixer vos prix librement
• NutriSport prélève une commission de 10% sur chaque séance
• L'identité n'est pas encore vérifiée à ce stade`}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- BARRE DE PROGRESSION NIVEAU ----------
function LevelProgressBar() {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    (async () => {
      const prog = await getNextLevelProgress();
      setProgress(prog);
    })();
  }, []);

  if (!progress) return null;

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: C.gray }}>PROGRESSION VERS {progress.nextEmoji} {progress.nextLevel.toUpperCase()}</Text>
        <Text style={{ fontSize: 11, fontWeight: '800', color: C.primary }}>{progress.progress}%</Text>
      </View>
      <View style={{ height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ height: 8, backgroundColor: C.primary, borderRadius: 4, width: `${progress.progress}%` }} />
      </View>
      <Text style={{ color: C.gray, fontSize: 10, marginTop: 6 }}>
        Encore {progress.remainingEvents} événements, {progress.remainingMatches} matches et {progress.remainingSessions} séances
      </Text>
    </View>
  );
}

// ---------- SCREENS ----------
// ---------- BARRE LIKE & COMMENTAIRES (EVENT) ----------
function EventLikeCommentBar({ eventId, eventTitle }) {
  const [likes, setLikes] = useState({ count: 0, userLiked: false });
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    (async () => {
      const l = await getEventLikes(eventId);
      const c = await getEventComments(eventId);
      setLikes(l);
      setCommentCount(c.length);
    })();
  }, [eventId]);

  const handleLike = async () => {
    const updated = await toggleEventLike(eventId);
    setLikes(updated);
  };

  return (
    <>
      <View style={{ flexDirection: 'row', gap: 8, flex: 1 }}>
        <TouchableOpacity 
          onPress={handleLike}
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            gap: 5,
            backgroundColor: likes.userLiked ? '#FCE7F3' : C.chip, 
            paddingHorizontal: 12, 
            paddingVertical: 8, 
            borderRadius: 999,
            borderWidth: 1,
            borderColor: likes.userLiked ? '#EC4899' : C.border,
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <Ionicons name={likes.userLiked ? "heart" : "heart-outline"} size={16} color={likes.userLiked ? '#EC4899' : C.gray} />
          <Text style={{ color: likes.userLiked ? '#EC4899' : C.dark, fontWeight: '700', fontSize: 12 }}>
            {likes.count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setShowComments(true)}
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            gap: 5,
            backgroundColor: C.chip, 
            paddingHorizontal: 12, 
            paddingVertical: 8, 
            borderRadius: 999,
            borderWidth: 1,
            borderColor: C.border,
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chatbubble-outline" size={16} color={C.primary} />
          <Text style={{ color: C.dark, fontWeight: '700', fontSize: 12 }}>
            {commentCount > 0 ? `${commentCount} commentaire${commentCount > 1 ? 's' : ''}` : 'Commenter'}
          </Text>
        </TouchableOpacity>
      </View>

      <EventCommentsModal 
        visible={showComments} 
        onClose={() => setShowComments(false)} 
        eventId={eventId} 
        eventTitle={eventTitle}
      />
    </>
  );
}

// ---------- MODAL COMMENTAIRES ÉVÉNEMENT ----------
function EventCommentsModal({ visible, onClose, eventId, eventTitle }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likes, setLikes] = useState({ count: 0, userLiked: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && eventId) {
      loadData();
    }
  }, [visible, eventId]);

  const loadData = async () => {
    setLoading(true);
    const c = await getEventComments(eventId);
    const l = await getEventLikes(eventId);
    setComments(c);
    setLikes(l);
    setLoading(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addEventComment(eventId, newComment.trim());
    setNewComment('');
    await loadData();
  };

  const handleToggleLike = async () => {
    const updated = await toggleEventLike(eventId);
    setLikes(updated);
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={[s.modalCard, { maxHeight: '90%' }]}>
          <View style={s.modalHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.modalTitle}>💬 {eventTitle || 'Commentaires'}</Text>
              <Text style={{ color: C.gray, fontSize: 12, marginTop: 2 }}>
                {likes.count} like{likes.count > 1 ? 's' : ''} · {comments.length} commentaire{comments.length > 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={C.gray} />
            </TouchableOpacity>
          </View>

          {/* Bouton Like */}
          <TouchableOpacity 
            onPress={handleToggleLike}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              gap: 8, 
              alignSelf: 'flex-start',
              backgroundColor: likes.userLiked ? '#FCE7F3' : C.chip, 
              paddingHorizontal: 16, 
              paddingVertical: 10, 
              borderRadius: 999,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: likes.userLiked ? '#EC4899' : C.border,
            }}
          >
            <Ionicons name={likes.userLiked ? "heart" : "heart-outline"} size={18} color={likes.userLiked ? '#EC4899' : C.gray} />
            <Text style={{ color: likes.userLiked ? '#EC4899' : C.dark, fontWeight: '800', fontSize: 13 }}>
              {likes.userLiked ? "❤️ J'aime" : "🤍 J'aime"} ({likes.count})
            </Text>
          </TouchableOpacity>

          {/* Liste des commentaires */}
          {loading ? (
            <ActivityIndicator color={C.primary} style={{ marginVertical: 20 }} />
          ) : comments.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 30 }}>
              <Ionicons name="chatbubbles-outline" size={40} color={C.light} />
              <Text style={{ color: C.gray, marginTop: 8, textAlign: 'center' }}>Aucun commentaire encore.</Text>
              <Text style={{ color: C.light, fontSize: 12, marginTop: 4 }}>Sois le premier à commenter !</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              {comments.map((c) => (
                <View key={c.id} style={{ 
                  backgroundColor: C.chip, 
                  borderRadius: 14, 
                  padding: 12, 
                  marginBottom: 8,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontWeight: '800', fontSize: 13, color: C.primary }}>{c.author}</Text>
                    <Text style={{ color: C.light, fontSize: 10 }}>{formatDate(c.date)}</Text>
                  </View>
                  <Text style={{ color: C.dark, fontSize: 13, lineHeight: 18 }}>{c.text}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Input nouveau commentaire */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'flex-end' }}>
            <TextInput
              style={[s.input, { flex: 1, maxHeight: 80 }]}
              placeholder="Écrire un commentaire..."
              placeholderTextColor={C.light}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity 
              style={[s.joinBtn, !newComment.trim() && { opacity: 0.4 }]} 
              disabled={!newComment.trim()}
              onPress={handleAddComment}
            >
              <Ionicons name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------- STORY BUBBLE COMPONENT ----------
function StoryBubble({ story, onPress }) {
  const isViewed = story.viewed && !story.isMine;
  return (
    <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', marginRight: 14 }}>
      <View style={{
        width: 72,
        height: 72,
        borderRadius: 36,
        padding: 3,
        backgroundColor: isViewed ? C.border : 'transparent',
        borderWidth: isViewed ? 0 : 2.5,
        borderColor: story.isMine ? C.light : story.color,
      }}>
        <View style={{
          flex: 1,
          borderRadius: 33,
          backgroundColor: story.isMine ? 'rgba(91,79,233,0.1)' : C.card,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: story.isMine ? 1 : 0,
          borderColor: C.primary,
        }}>
          <Text style={{ fontSize: 28 }}>{story.isMine ? '+' : story.emoji}</Text>
        </View>
      </View>
      <Text style={{
        fontSize: 11,
        fontWeight: '700',
        marginTop: 6,
        color: isViewed ? C.light : C.dark,
        maxWidth: 72,
        textAlign: 'center',
      }} numberOfLines={1}>
        {story.name}
      </Text>
      {story.data && !story.isMine ? (
        <Text style={{ fontSize: 9, color: story.color, fontWeight: '800', marginTop: 2 }}>{story.data}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

function HomeScreen({ go, goBack }) {
  const [filter, setFilter] = useState(null);
  const [sportSearch, setSportSearch] = useState('');
  const [visibleStories, setVisibleStories] = useState(STORIES);
  const [friendsList, setFriendsList] = useState([]);
  const [maxDistance, setMaxDistance] = useState(50); // Distance max en km (50 par défaut, jusqu'à 100)

  // Charge la liste d'amis et filtre les stories visibles
  useEffect(() => {
    (async () => {
      const friends = await getFriendsList();
      setFriendsList(friends);
      const friendIds = friends.map((f) => f.id);
      // Une story est visible si : c'est la mienne, ou friendsOnly=false, ou l'auteur est dans mes amis
      const filtered = STORIES.filter((story) => {
        if (story.isMine) return true;
        if (!story.friendsOnly) return true;
        return friendIds.includes(story.userId);
      });
      setVisibleStories(filtered);
    })();
  }, []);

  // Filtrer les sports selon la recherche
  const filteredSports = sportSearch.trim()
    ? ALL_SPORTS.filter((sp) => 
        sp.label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(
          sportSearch.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        ) || sp.key.toLowerCase().includes(sportSearch.toLowerCase())
      )
    : ALL_SPORTS;

  // Filtrer les événements selon le sport sélectionné
  const filteredEvents = filter 
    ? EVENTS.filter((e) => e.sport === filter)
    : EVENTS;

  const sportLabel = filter 
    ? ALL_SPORTS.find((sp) => sp.key === filter)?.label 
    : null;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={s.brandRow}>
        <Text style={s.brand}>
          NUTRI <Text style={{ color: C.primary }}>• SPORT</Text>
        </Text>
        <Ionicons name="notifications-outline" size={22} color={C.primary} />
      </View>

      {/* STORIES D'ACTIVITE */}
      <View style={{ marginTop: 8, marginBottom: 4 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 8, paddingVertical: 8 }}
        >
          {STORIES.map((story) => (
            <StoryBubble
              key={story.id}
              story={story}
              onPress={() => story.isMine ? null : go('stories', { startIndex: STORIES.indexOf(story) })}
            />
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity onPress={() => go('practiceHistory')}>
        <Banner icon="📊" eyebrow="HISTORIQUE SPORTIF" title="Mon historique de pratique sportive" subtitle={`Retrouve tes sessions et partage tes performances`} />
      </TouchableOpacity>

      {/* DÉFILEMENT DES SPORTS — FILTRE + RECHERCHE */}
      <View style={{ marginTop: 16 }}>
        <Text style={[s.sectionTitle, { paddingHorizontal: 16, marginBottom: 10 }]}>
          {filter ? `🏆 ${sportLabel.toUpperCase()} — ${filteredEvents.length} ÉVÉNEMENT` + (filteredEvents.length > 1 ? 'S' : '') : '🏆 TOUS LES SPORTS'}
        </Text>

        {/* Barre de recherche de sport */}
        <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
            <Ionicons name="search" size={18} color={C.light} />
            <TextInput
              style={{ flex: 1, marginLeft: 10, fontSize: 14, color: C.dark }}
              placeholder="Rechercher un sport..."
              placeholderTextColor={C.light}
              value={sportSearch}
              onChangeText={setSportSearch}
            />
            {sportSearch ? (
              <TouchableOpacity onPress={() => setSportSearch('')}>
                <Ionicons name="close-circle" size={18} color={C.light} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Réglage de la distance max */}
        <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="location-outline" size={16} color={C.primary} />
              <Text style={{ fontWeight: '700', fontSize: 12, color: C.dark }}>RAYON DE RECHERCHE</Text>
            </View>
            <Text style={{ fontWeight: '800', fontSize: 14, color: C.primary }}>{maxDistance} km</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 11, color: C.light, fontWeight: '700' }}>5km</Text>
            <View style={{ flex: 1, height: 6, backgroundColor: C.border, borderRadius: 3 }}>
              <View style={{ 
                height: 6, 
                backgroundColor: C.primary, 
                borderRadius: 3,
                width: `${((maxDistance - 5) / 95) * 100}%`,
              }} />
            </View>
            <Text style={{ fontSize: 11, color: C.light, fontWeight: '700' }}>100km</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            {[5, 10, 25, 50, 75, 100].map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setMaxDistance(d)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 999,
                  backgroundColor: maxDistance === d ? C.primary : C.chip,
                }}
              >
                <Text style={{ 
                  fontWeight: '800', 
                  fontSize: 11, 
                  color: maxDistance === d ? '#fff' : C.gray 
                }}>
                  {d}km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true}
          nestedScrollEnabled={true}
          style={{ height: 52 }}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 16, alignItems: 'center' }}
        >
          <Chip 
            label="Tous" 
            emoji="🌐" 
            selected={filter === null} 
            onPress={() => setFilter(null)} 
          />
          {filteredSports.map((sp) => (
            <Chip key={sp.key} label={sp.label} emoji={sp.emoji} selected={filter === sp.key} onPress={() => setFilter(filter === sp.key ? null : sp.key)} />
          ))}
        </ScrollView>
      </View>

      {/* ÉVÉNEMENTS FILTRÉS */}
      <View style={s.sectionRow}>
        <Text style={s.sectionTitle}>📅 {filter ? `ÉVÉNEMENTS ${sportLabel.toUpperCase()}` : 'ÉVÉNEMENTS À VENIR'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => go('newEvent')}>
            <Ionicons name="add-circle" size={24} color={C.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => go('events')}>
            <Text style={s.link}>VOIR TOUT ›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {filteredEvents.length === 0 ? (
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View style={{ backgroundColor: C.card, borderRadius: 18, padding: 20, alignItems: 'center' }}>
            <Ionicons name="calendar-outline" size={32} color={C.light} />
            <Text style={{ fontWeight: '800', marginTop: 8, color: C.dark }}>Aucun événement {sportLabel ? sportLabel.toLowerCase() : ''}</Text>
            <Text style={{ color: C.gray, fontSize: 12, marginTop: 4 }}>Sélectionne un autre sport ou crée le tien !</Text>
            <TouchableOpacity style={[s.primaryBtn, { marginTop: 12, width: '100%' }]} onPress={() => go('newEvent')}>
              <Text style={s.primaryBtnText}>+ CRÉER UN ÉVÉNEMENT</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, marginBottom: 16 }}>
          {filteredEvents.map((ev) => (
            <TouchableOpacity key={ev.id} onPress={() => go('events')}>
              <Grad colors={C.gradBlue} style={[s.eventCard, s.eventCardShadow, { marginRight: 12 }]}>
                <Text style={{ fontSize: 22 }}>{ev.emoji}</Text>
                <Text style={s.eventCardTitle}>{ev.title}</Text>
                <Text style={s.eventCardLoc}>📍 {ev.loc}</Text>
                <View style={s.eventCardFooter}>
                  <Text style={s.eventCardBadge}>
                    {ev.p}/{ev.max}
                  </Text>
                  <Text style={s.eventCardVoir}>VOIR ›</Text>
                </View>
              </Grad>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={s.actionsRow}>
        <TouchableOpacity style={s.primaryBtn} onPress={() => go('practiceHistory')}>
          <Text style={s.primaryBtnText}>HISTORIQUE DE PRATIQUE SPORTIVE</Text>
        </TouchableOpacity>
      </View>

      <View style={{ padding: 16 }}>
        <TouchableOpacity style={s.runnerCard} onPress={() => go('contacts')}>
          <View style={s.avatar}>
            <Text style={{ fontWeight: '800', color: C.primary, fontSize: 18 }}>A</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.runnerName}>Alice Runner</Text>
            <Text style={s.runnerMeta}>📍 Paris</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={C.light} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function EventsScreen({ go, goBack }) {
  const [filter, setFilter] = useState('tous');
  const [joinedIds, setJoinedIds] = useState({});
  const filtered = filter === 'tous' ? EVENTS : EVENTS.filter((e) => e.sport === filter);

  useEffect(() => {
    (async () => {
      const ids = await getJoinedEventIds();
      setJoinedIds(Object.fromEntries(ids.map((id) => [id, true])));
    })();
  }, []);

  const [showJoinPaymentModal, setShowJoinPaymentModal] = useState(false);
  const [pendingJoinEvent, setPendingJoinEvent] = useState(null);

  const toggleJoin = async (id) => {
    const nowJoined = !joinedIds[id];
    if (nowJoined) {
      // Vérifier si paiement nécessaire pour rejoindre
      const can = await canJoinEvent(id);
      if (can.needPayment) {
        setPendingJoinEvent(id);
        setShowJoinPaymentModal(true);
        return;
      }
      await incrementJoinCount();
      await incrementStat('eventsJoined');
      const ev = EVENTS.find((e) => e.id === id);
      if (ev) await addPracticeEntryFromEvent(ev);
    }
    setJoinedIds((prev) => ({ ...prev, [id]: nowJoined }));
    await setEventJoined(id, nowJoined);
  };

  const handleJoinPayment = async () => {
    if (!pendingJoinEvent) return;
    await payForEvent(pendingJoinEvent);
    await incrementJoinCount();
    setJoinedIds((prev) => ({ ...prev, [pendingJoinEvent]: true }));
    await setEventJoined(pendingJoinEvent, true);
    const ev = EVENTS.find((e) => e.id === pendingJoinEvent);
    if (ev) await addPracticeEntryFromEvent(ev);
    setShowJoinPaymentModal(false);
    setPendingJoinEvent(null);
    alert(`✅ Paiement de ${PAY_PER_EVENT_PRICE}€ confirmé !\nVous êtes inscrit à l'événement ! 🎉`);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title="Événement à venir" onBack={goBack} right={<Ionicons name="add-circle" size={24} color={C.primary} onPress={() => go('newEvent')} />} />
      <Banner icon="📅" eyebrow="TOUS SPORTS" title={`${EVENTS.length} événements à venir`} />

      <Text style={s.filterLabel}>FILTRER PAR SPORT</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, marginBottom: 8, maxHeight: 52 }}>
        <Chip label="Tous" emoji="🌐" selected={filter === 'tous'} onPress={() => setFilter('tous')} />
        {ALL_SPORTS.map((sp) => (
          <Chip key={sp.key} label={sp.label} emoji={sp.emoji} selected={filter === sp.key} onPress={() => setFilter(sp.key)} />
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        ListEmptyComponent={<EmptyState icon="calendar-outline" title="Aucun événement" subtitle="Aucun événement ne correspond à ce sport pour le moment." />}
        renderItem={({ item }) => {
          const full = item.p >= item.max;
          const joined = !!joinedIds[item.id];
          return (
            <View style={s.eventListCard}>
              <View style={{ flexDirection: 'row' }}>
                <View style={s.eventListIcon}>
                  <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.eventListTitle}>{item.title}</Text>
                    {item.isCoachSession ? (
                      <View style={{ backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1, borderColor: '#22C55E' }}>
                        <Text style={{ color: '#15803D', fontWeight: '800', fontSize: 9 }}>🥋 COACH</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={s.eventListHost}>
                    Hôte: {item.host} · {item.when}
                    {item.isCoachSession ? ` · Réf. ${item.coachBadge}` : ''}
                  </Text>
                </View>
              </View>
              <Text style={s.eventListMeta}>
                📍 {item.loc}   🕐 {item.date}
                {item.isCoachSession ? `   💰 ${item.coachPrice}€` : ''}
              </Text>
              <View style={s.divider} />
              <View style={s.eventListFooter}>
                <Text style={s.eventListParticipants}>
                  👥 {item.p}/{item.max} inscrits
                </Text>
                {full && !joined ? (
                  <View style={s.fullBadge}>
                    <Text style={s.fullBadgeText}>COMPLET</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={joined ? s.joinedBtn : s.joinBtn} onPress={() => toggleJoin(item.id)}>
                    <Text style={joined ? s.joinedBtnText : s.joinBtnText}>{joined ? '✓ INSCRIT' : item.isCoachSession ? `💳 ${item.coachPrice}€` : '+ REJOINDRE'}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Boutons Like & Commentaires (si activés) */}
              {item.enableComments || item.enableLikes ? (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <EventLikeCommentBar eventId={item.id} eventTitle={item.title} />
                </View>
              ) : null}

              {joined ? <EventDirectionsCard event={item} /> : null}
            </View>
          );
        }}
      />

      {/* MODAL PAIEMENT POUR REJOINDRE */}
      <Modal visible={showJoinPaymentModal} transparent animationType="slide" onRequestClose={() => setShowJoinPaymentModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: C.dark }}>💳 Paiement requis</Text>
              <TouchableOpacity onPress={() => setShowJoinPaymentModal(false)}>
                <Ionicons name="close" size={24} color={C.gray} />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#FEF3C7', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#F59E0B' }}>
              <Text style={{ color: '#92400E', fontWeight: '800', fontSize: 14 }}>⚠️ Vos 3 essais gratuits sont épuisés</Text>
              <Text style={{ color: '#92400E', fontSize: 13, marginTop: 4, opacity: 0.8 }}>
                Pour rejoindre cette séance sportive, passe en Premium ou paie à la carte.
              </Text>
            </View>

            <View style={{ backgroundColor: C.chip, borderRadius: 16, padding: 16, marginBottom: 20 }}>
              <Text style={{ fontWeight: '800', fontSize: 16, color: C.dark, marginBottom: 12 }}>💰 Option payante</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Ionicons name="card" size={18} color={C.primary} />
                <Text style={{ color: C.dark, fontSize: 13, fontWeight: '600' }}>Rejoindre cette séance : <Text style={{ fontWeight: '900' }}>{PAY_PER_EVENT_PRICE}€</Text></Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="infinite" size={18} color={C.primary} />
                <Text style={{ color: C.dark, fontSize: 13, fontWeight: '600' }}>Abonnement Premium : <Text style={{ fontWeight: '900' }}>{PREMIUM_PRICE}</Text> · 119€/an</Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleJoinPayment}
              style={{ backgroundColor: C.primary, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginBottom: 10 }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>💳 PAYER {PAY_PER_EVENT_PRICE}€ & REJOINDRE</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => { setShowJoinPaymentModal(false); }}
              style={{ backgroundColor: C.chip, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginBottom: 10 }}
            >
              <Text style={{ color: C.primary, fontWeight: '800', fontSize: 15 }}>💎 PASSER PREMIUM</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowJoinPaymentModal(false)} style={{ alignItems: 'center' }}>
              <Text style={{ color: C.gray, fontSize: 13 }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const FORMATS = [
  { key: 'solo', title: 'Pratique individuelle', desc: "Tu t'entraînes seul·e. Pas d'autre participant." },
  { key: 'duo', title: 'Entraînement à 2', desc: 'Tu cherches UN partenaire. Max 2 personnes au total. L’hôte est le Modérateur.', hint: 'Hôte : Modérateur · Max 2 personnes' },
  { key: 'groupe', title: 'Entraînement à plusieurs', desc: 'Minimum 2 joueurs. Session en petit groupe pour progresser ensemble.', hint: 'Hôte : Leader · Min 2 joueurs' },
  { key: 'team', title: 'Équipe', desc: 'Organise un match collectif avec plusieurs participants.', hint: 'Hôte : Capitaine' },
];

function NewEventScreen({ go, goBack, params }) {
  const [sport, setSport] = useState(null);
  const [format, setFormat] = useState('solo');
  const [title, setTitle] = useState('');
  const [place, setPlace] = useState('');
  const [date, setDate] = useState('2026-07-20');
  const [time, setTime] = useState('18:30');
  const [playerLevel, setPlayerLevel] = useState(null);
  const [maxP, setMaxP] = useState('');
  const [desc, setDesc] = useState('');
  const [showStadiumSuggestions, setShowStadiumSuggestions] = useState(false);
  const [enableComments, setEnableComments] = useState(true);
  const [enableLikes, setEnableLikes] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isCoachMode, setIsCoachMode] = useState(false);
  const [coachPrice, setCoachPrice] = useState('');
  const [coachCert, setCoachCert] = useState({ isCertified: false, sports: [] });

  const isSolo = sport ? SPORTS_SOLO.some((s2) => s2.key === sport) : true;

  const placeQuery = normalizeDishKey(place);
  const stadiumSuggestions =
    showStadiumSuggestions && placeQuery.length >= 1
      ? FRENCH_STADIUMS.filter((st) => normalizeDishKey(`${st.name} ${st.city}`).includes(placeQuery)).slice(0, 8)
      : [];

  const pickStadium = (st) => {
    setPlace(`${st.name}, ${st.city}`);
    setShowStadiumSuggestions(false);
  };

  const [subStatus, setSubStatus] = useState({ isPremium: false, eventsCreated: 0, remaining: 3 });
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    (async () => {
      const can = await canCreateEvent();
      const sub = await getSubscriptionStatus();
      setSubStatus({ ...sub, remaining: can.remaining });
      const cert = await getCoachCertification();
      setCoachCert(cert);
      const lvl = await getPlayerLevel();
      setPlayerLevel(lvl);
    })();
  }, []);

  // Pré-sélection des coéquipiers et sport depuis la navigation
  useEffect(() => {
    if (params?.defaultSport) {
      setSport(params.defaultSport);
    }
    if (params?.preselectedTeammates && params.preselectedTeammates.length > 0) {
      // Les coéquipiers pré-sélectionnés seront affichés dans l'UI
      // On peut les stocker dans un état si besoin
    }
  }, [params]);

  const submit = async () => {
    if (!sport || !title || !place) {
      alert('Sport, titre et lieu sont obligatoires.');
      return;
    }
    // Vérification sécurité : pas de sport de combat à plusieurs
    if (isCombatSport(sport) && format === 'team') {
      alert('⚠️ Pour des raisons de sécurité, les sports de combat et arts martiaux ne peuvent pas être organisés en équipe. Veuillez choisir "Pratique individuelle" ou "Entraînement à 2".');
      return;
    }
    // Vérification coach
    if (isCoachMode && isCombatSport(sport)) {
      if (!coachCert.isCertified) {
        alert('Vous devez d\'abord créer votre profil coach pour proposer des séances de combat.');
        return;
      }
      if (!coachPrice || parseFloat(coachPrice) <= 0) {
        alert('Veuillez fixer un prix pour votre séance de coach.');
        return;
      }
    }
    const can = await canCreateEvent();
    if (can.needPayment) {
      setShowPaymentModal(true);
      return;
    }
    await incrementEventCount();
    await incrementStat('eventsCreated');
    const lvl = playerLevel || { label: 'Débutant', emoji: '🌱' };
    alert(`Événement "${title}" créé !\n🎯 Niveau: ${lvl.emoji} ${lvl.label}${isCoachMode ? '\n🥋 Séance coach à ' + coachPrice + '€' : ''}`);
    go('events');
  };

  const handlePayment = async () => {
    // Simulation de paiement (à remplacer par vrai système de paiement)
    await incrementEventCount();
    setShowPaymentModal(false);
    alert(`✅ Paiement de ${PAY_PER_EVENT_PRICE}€ confirmé !\nÉvénement "${title}" créé ! 🎉`);
    go('events');
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title="Nouvel événement" onBack={goBack} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: subStatus.isPremium ? 'rgba(34,197,94,0.1)' : C.chip, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: subStatus.isPremium ? '#22C55E' : C.border }}>
          <Ionicons name={subStatus.isPremium ? "diamond" : "gift-outline"} size={16} color={subStatus.isPremium ? '#22C55E' : C.primary} />
          <Text style={{ color: subStatus.isPremium ? '#22C55E' : C.primary, fontWeight: '800', fontSize: 12, flex: 1 }}>
            {subStatus.isPremium ? '💎 PREMIUM — Événements illimités' : subStatus.remaining > 0 ? `GRATUIT — ${subStatus.remaining} essai${subStatus.remaining > 1 ? 's' : ''} restant${subStatus.remaining > 1 ? 's' : ''}` : `💳 ${PAY_PER_EVENT_PRICE}€ par événement`}
          </Text>
          {!subStatus.isPremium ? (
            <TouchableOpacity onPress={() => setShowPremiumModal(true)}>
              <Text style={{ color: C.primary, fontWeight: '800', fontSize: 11 }}>PASSER PREMIUM</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={s.label}>SPORT *</Text>
        <Text style={s.subLabel}>SPORTS COLLECTIFS & RAQUETTES</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {SPORTS_TEAM.map((sp) => (
            <Chip key={sp.key} label={sp.label} emoji={sp.emoji} selected={sport === sp.key} onPress={() => setSport(sp.key)} />
          ))}
        </View>

        <Text style={[s.subLabel, { marginTop: 12 }]}>PRATIQUE INDIVIDUELLE OU ENTRAÎNEMENT À 2</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {SPORTS_SOLO.map((sp) => (
            <Chip key={sp.key} label={sp.label} emoji={sp.emoji} selected={sport === sp.key} onPress={() => setSport(sp.key)} />
          ))}
        </View>

        <Text style={s.label}>FORMAT *</Text>
        {FORMATS.filter((f) => (isSolo ? (f.key !== 'team' && f.key !== 'groupe') : f.key !== 'solo')).map((f) => (
          <TouchableOpacity key={f.key} style={[s.formatCard, format === f.key && s.formatCardOn]} onPress={() => setFormat(f.key)} activeOpacity={0.85}>
            <View style={{ flex: 1 }}>
              <Text style={[s.formatTitle, format === f.key && s.formatTitleOn]}>{f.title.toUpperCase()}</Text>
              <Text style={s.formatDesc}>{f.desc}</Text>
              {f.hint ? <Text style={s.formatHint}>{f.hint}</Text> : null}
            </View>
            <View style={[s.radio, format === f.key && s.radioOn]}>{format === f.key ? <View style={s.radioDot} /> : null}</View>
          </TouchableOpacity>
        ))}

        <Text style={s.label}>TITRE *</Text>
        <TextInput style={s.input} placeholder="Sortie matinale" value={title} onChangeText={setTitle} placeholderTextColor={C.light} />

        <Text style={s.label}>LIEU *</Text>
        <TextInput
          style={s.input}
          placeholder="Parc Monceau, Paris — ou nom d’un stade"
          value={place}
          onChangeText={(v) => {
            setPlace(v);
            setShowStadiumSuggestions(true);
          }}
          onFocus={() => setShowStadiumSuggestions(true)}
          placeholderTextColor={C.light}
        />
        {stadiumSuggestions.length > 0 ? (
          <View style={s.suggestionsBox}>
            {stadiumSuggestions.map((st) => (
              <TouchableOpacity key={`${st.name}-${st.city}`} style={s.suggestionRow} onPress={() => pickStadium(st)}>
                <Ionicons name="football-outline" size={16} color={C.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={s.suggestionName}>{st.name}</Text>
                  <Text style={s.suggestionCity}>{st.city}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        <Text style={s.helper}>Épingle l’événement sur la carte pour aider les sportifs à le repérer</Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>DATE *</Text>
            <TextInput style={s.input} value={date} onChangeText={setDate} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>HEURE *</Text>
            <TextInput style={s.input} value={time} onChangeText={setTime} />
          </View>
        </View>

        {/* NIVEAU AUTO-DÉTERMINÉ PAR L'APPLICATION */}
        <Text style={s.label}>TON NIVEAU</Text>
        {playerLevel ? (
          <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: C.primary, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(91,79,233,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24 }}>{playerLevel.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '900', fontSize: 16, color: C.dark }}>{playerLevel.label.toUpperCase()}</Text>
                <Text style={{ color: C.gray, fontSize: 12, marginTop: 2 }}>
                  Déterminé automatiquement selon ton activité
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              <View style={{ flex: 1, backgroundColor: C.chip, borderRadius: 10, padding: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: C.primary }}>{playerLevel.stats.totalEvents}</Text>
                <Text style={{ fontSize: 9, color: C.gray, fontWeight: '700' }}>ÉVÉNEMENTS</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: C.chip, borderRadius: 10, padding: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: C.primary }}>{playerLevel.stats.totalMatches}</Text>
                <Text style={{ fontSize: 9, color: C.gray, fontWeight: '700' }}>MATCHES</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: C.chip, borderRadius: 10, padding: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: C.primary }}>{playerLevel.stats.totalSessions}</Text>
                <Text style={{ fontSize: 9, color: C.gray, fontWeight: '700' }}>SÉANCES</Text>
              </View>
            </View>

            <LevelProgressBar />
          </View>
        ) : (
          <View style={{ backgroundColor: C.chip, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 }}>
            <ActivityIndicator color={C.primary} size="small" />
            <Text style={{ color: C.gray, fontSize: 12, marginTop: 8 }}>Calcul de ton niveau...</Text>
          </View>
        )}

        <Text style={s.label}>MAX. PARTICIPANTS</Text>
        {format === 'solo' ? (
          <View style={s.lockedInput}>
            <Ionicons name="lock-closed" size={16} color={C.light} />
            <Text style={s.lockedText}>Verrouillé à 1 (PRATIQUE INDIVIDUELLE)</Text>
          </View>
        ) : (
          <TextInput style={s.input} keyboardType="numeric" placeholder={format === 'duo' ? '2' : '10'} placeholderTextColor={C.light} value={maxP} onChangeText={setMaxP} />
        )}

        <Text style={s.label}>DESCRIPTION</Text>
        <TextInput
          style={[s.input, { height: 100, textAlignVertical: 'top' }]}
          placeholder="Niveau, ambiance, équipement à prévoir…"
          placeholderTextColor={C.light}
          value={desc}
          onChangeText={setDesc}
          multiline
        />

        {/* OPTIONS COMMENTAIRES & LIKES */}
        <Text style={s.label}>OPTIONS SOCIALES</Text>
        <View style={{ backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="chatbubble-outline" size={18} color={enableComments ? C.primary : C.light} />
              <Text style={{ fontWeight: '700', fontSize: 13, color: C.dark }}>Commentaires</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setEnableComments(!enableComments)}
              style={{ 
                width: 48, 
                height: 28, 
                borderRadius: 14, 
                backgroundColor: enableComments ? C.primary : C.border,
                justifyContent: 'center',
                paddingHorizontal: 2,
              }}
            >
              <View style={{ 
                width: 24, 
                height: 24, 
                borderRadius: 12, 
                backgroundColor: '#fff',
                alignSelf: enableComments ? 'flex-end' : 'flex-start',
              }} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="heart-outline" size={18} color={enableLikes ? '#EC4899' : C.light} />
              <Text style={{ fontWeight: '700', fontSize: 13, color: C.dark }}>Likes</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setEnableLikes(!enableLikes)}
              style={{ 
                width: 48, 
                height: 28, 
                borderRadius: 14, 
                backgroundColor: enableLikes ? '#EC4899' : C.border,
                justifyContent: 'center',
                paddingHorizontal: 2,
              }}
            >
              <View style={{ 
                width: 24, 
                height: 24, 
                borderRadius: 12, 
                backgroundColor: '#fff',
                alignSelf: enableLikes ? 'flex-end' : 'flex-start',
              }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* OPTION PROFIL COACH — SPORTS DE COMBAT & ARTS MARTIAUX */}
        {sport && isCombatSport(sport) ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={s.label}>🥋 PROFIL COACH</Text>

            {coachCert.isCertified ? (
              <View style={{ backgroundColor: '#FEF3C7', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#F59E0B' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Ionicons name="person-circle-outline" size={20} color="#92400E" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '800', fontSize: 13, color: '#92400E' }}>Profil coach (non vérifié) — Réf. {coachCert.badgeNumber}</Text>
                    <Text style={{ color: '#92400E', fontSize: 11, opacity: 0.8 }}>Tél: {coachCert.phone} · Créé le {new Date(coachCert.verifiedAt).toLocaleDateString('fr-FR')}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ fontWeight: '700', fontSize: 13, color: C.dark }}>Proposer cette séance en tant que coach</Text>
                  <TouchableOpacity 
                    onPress={() => setIsCoachMode(!isCoachMode)}
                    style={{ 
                      width: 48, 
                      height: 28, 
                      borderRadius: 14, 
                      backgroundColor: isCoachMode ? '#22C55E' : C.border,
                      justifyContent: 'center',
                      paddingHorizontal: 2,
                    }}
                  >
                    <View style={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: 12, 
                      backgroundColor: '#fff',
                      alignSelf: isCoachMode ? 'flex-end' : 'flex-start',
                    }} />
                  </TouchableOpacity>
                </View>

                {isCoachMode ? (
                  <>
                    <Text style={{ fontWeight: '700', fontSize: 12, color: C.gray, marginBottom: 6 }}>PRIX DE LA SÉANCE (€)</Text>
                    <TextInput
                      style={s.input}
                      placeholder="Ex: 25"
                      placeholderTextColor={C.light}
                      keyboardType="numeric"
                      value={coachPrice}
                      onChangeText={setCoachPrice}
                    />
                    <Text style={{ color: C.gray, fontSize: 11, marginTop: 6, fontStyle: 'italic' }}>
                      💡 Commission NutriSport : {Math.round((parseFloat(coachPrice) || 0) * COMMISSION_RATE * 100) / 100}€ ({COMMISSION_RATE * 100}%). Vous recevrez : {Math.round((parseFloat(coachPrice) || 0) * (1 - COMMISSION_RATE) * 100) / 100}€
                    </Text>
                    <Text style={{ color: '#F59E0B', fontSize: 11, marginTop: 4, fontWeight: '700' }}>
                      ⚠️ Séance individuelle uniquement — Pas de sport de combat à plusieurs pour la sécurité
                    </Text>
                  </>
                ) : null}
              </View>
            ) : (
              <View style={{ backgroundColor: C.chip, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Ionicons name="person-circle-outline" size={20} color={C.primary} />
                  <Text style={{ fontWeight: '800', fontSize: 13, color: C.dark, flex: 1 }}>Créer mon profil coach</Text>
                </View>
                <Text style={{ color: C.gray, fontSize: 12, lineHeight: 18, marginBottom: 10 }}>
                  Pour proposer des séances de {ALL_SPORTS.find(s => s.key === sport)?.label || sport}, crée d'abord ton profil coach (identité non vérifiée à ce stade).
                </Text>
                <TouchableOpacity 
                  onPress={() => go('coachCertification', { sport })}
                  style={{ backgroundColor: C.primary, borderRadius: 999, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>CRÉER MON PROFIL COACH</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : null}

        {/* COÉQUIPIERS PRÉ-SÉLECTIONNÉS */}
     {params?.preselectedTeammates && params.preselectedTeammates.length > 0 ? (
       <View style={{ backgroundColor: C.chip, borderRadius: 14, padding: 14, marginTop: 16 }}>
         <Text style={{ fontWeight: '800', fontSize: 12, color: C.dark, marginBottom: 10 }}>🛡️ COÉQUIPIERS INVITÉS</Text>
         <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
           {params.preselectedTeammates.map((tid) => (
             <View key={tid} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(91,79,233,0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}>
               <Ionicons name="shield" size={14} color={C.primary} />
               <Text style={{ color: C.primary, fontWeight: '700', fontSize: 12 }}>Coéquipier #{tid.slice(-4)}</Text>
             </View>
           ))}
         </View>
         <Text style={{ color: C.gray, fontSize: 11, marginTop: 8 }}>Ces coéquipiers seront notifiés de l'événement.</Text>
       </View>
     ) : null}

     <TouchableOpacity style={s.submitBtn} onPress={submit}>
          <Text style={s.submitText}>⚡ CRÉER L’ÉVÉNEMENT</Text>
        </TouchableOpacity>
      </ScrollView>
    
      {/* MODAL PAIEMENT À LA CARTE */}
      <Modal visible={showPaymentModal} transparent animationType="slide" onRequestClose={() => setShowPaymentModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: C.dark }}>💳 Paiement requis</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color={C.gray} />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#FEF3C7', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#F59E0B' }}>
              <Text style={{ color: '#92400E', fontWeight: '800', fontSize: 14 }}>⚠️ Vos 3 essais gratuits sont épuisés</Text>
              <Text style={{ color: '#92400E', fontSize: 13, marginTop: 4, opacity: 0.8 }}>
                Pour continuer à créer des événements ou rejoindre des séances, passe en Premium ou paie à la carte.
              </Text>
            </View>

            <View style={{ backgroundColor: C.chip, borderRadius: 16, padding: 16, marginBottom: 20 }}>
              <Text style={{ fontWeight: '800', fontSize: 16, color: C.dark, marginBottom: 12 }}>💰 Option payante</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Ionicons name="card" size={18} color={C.primary} />
                <Text style={{ color: C.dark, fontSize: 13, fontWeight: '600' }}>Créer cet événement : <Text style={{ fontWeight: '900' }}>{PAY_PER_EVENT_PRICE}€</Text></Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="infinite" size={18} color={C.primary} />
                <Text style={{ color: C.dark, fontSize: 13, fontWeight: '600' }}>Abonnement Premium : <Text style={{ fontWeight: '900' }}>{PREMIUM_PRICE}</Text> · 119€/an</Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={handlePayment}
              style={{ backgroundColor: C.primary, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginBottom: 10 }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>💳 PAYER {PAY_PER_EVENT_PRICE}€ & CRÉER</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => { setShowPaymentModal(false); setShowPremiumModal(true); }}
              style={{ backgroundColor: C.chip, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginBottom: 10 }}
            >
              <Text style={{ color: C.primary, fontWeight: '800', fontSize: 15 }}>💎 PASSER PREMIUM</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowPaymentModal(false)} style={{ alignItems: 'center' }}>
              <Text style={{ color: C.gray, fontSize: 13 }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL PREMIUM */}
      <Modal visible={showPremiumModal} transparent animationType="slide" onRequestClose={() => setShowPremiumModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: C.dark }}>💎 NutriSport Premium</Text>
              <TouchableOpacity onPress={() => setShowPremiumModal(false)}>
                <Ionicons name="close" size={24} color={C.gray} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: C.gray, fontSize: 14, lineHeight: 20, marginBottom: 20 }}>
              Déverrouille tout le potentiel de NutriSport avec l'abonnement Premium.
            </Text>

            <View style={{ backgroundColor: C.chip, borderRadius: 16, padding: 16, marginBottom: 20 }}>
              <Text style={{ fontWeight: '800', fontSize: 16, color: C.dark, marginBottom: 12 }}>✨ Avantages inclus</Text>
              {[
                { icon: 'calendar', text: "Cr'ation d'événements illimitée" },
                { icon: 'filter', text: 'Filtres avancés par niveau, âge, distance' },
                { icon: 'trophy', text: 'Badge Premium sur ton profil' },
                { icon: 'analytics', text: 'Statistiques détaillées de tes performances' },
                { icon: 'people', text: 'Équipes illimitées' },
                { icon: 'flash', text: 'Priorité dans les rencontres' },
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Ionicons name={item.icon} size={18} color={C.primary} />
                  <Text style={{ color: C.dark, fontSize: 13, fontWeight: '600' }}>{item.text}</Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
              <Text style={{ fontSize: 36, fontWeight: '900', color: C.primary }}>10€</Text>
              <Text style={{ color: C.gray, fontSize: 14 }}>/mois</Text>
            </View>
            <Text style={{ color: C.gray, fontSize: 14, marginBottom: 8 }}>ou <Text style={{ fontWeight: '900', color: C.primary }}>119€/an</Text> (29% d'économie)</Text>
            <Text style={{ color: C.light, fontSize: 12, marginBottom: 20 }}>Sans engagement. Annule à tout moment.</Text>

            <TouchableOpacity 
              onPress={async () => { await activatePremium(); setSubStatus(await getSubscriptionStatus()); setShowPremiumModal(false); alert('🎉 Bienvenue en Premium !'); }}
              style={{ backgroundColor: C.primary, borderRadius: 999, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>💎 ACTIVER PREMIUM</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowPremiumModal(false)} style={{ alignItems: 'center', marginTop: 12 }}>
              <Text style={{ color: C.gray, fontSize: 13 }}>Continuer gratuitement</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
</SafeAreaView>
  );
}

function SwipeCard({ profile, isTop, onSwipe, mode }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const rotate = pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ['-15deg', '0deg', '15deg'] });
  const likeOpacity = pan.x.interpolate({ inputRange: [0, 120], outputRange: [0, 1], extrapolate: 'clamp' });
  const nopeOpacity = pan.x.interpolate({ inputRange: [-120, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => isTop,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > 120 || g.dx < -120) {
          const liked = g.dx > 0;
          Animated.timing(pan, { toValue: { x: liked ? 500 : -500, y: g.dy }, duration: 200, useNativeDriver: false }).start(() => onSwipe(liked));
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const isDateMode = mode === 'date';
  const gradColors = isDateMode ? ['#EC4899', '#FF7A45'] : C.gradPurple;
  const sportLabel = ALL_SPORTS.find((sp) => sp.key === profile.sport)?.label || profile.sport;

  return (
    <Animated.View {...(isTop ? responder.panHandlers : {})} style={[s.swipeCard, isTop && { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] }]}>
      <Grad colors={gradColors} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Text style={{ fontSize: 90 }}>{profile.photo}</Text>

        {/* Overlay LIKE */}
        <Animated.View style={{ position: 'absolute', top: 40, left: 30, transform: [{ rotate: '-20deg' }], opacity: likeOpacity, borderWidth: 4, borderColor: '#22C55E', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ color: '#22C55E', fontSize: 36, fontWeight: '900' }}>{isDateMode ? 'DATE' : 'BATTLE'}</Text>
        </Animated.View>

        {/* Overlay NOPE */}
        <Animated.View style={{ position: 'absolute', top: 40, right: 30, transform: [{ rotate: '20deg' }], opacity: nopeOpacity, borderWidth: 4, borderColor: '#EF4444', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ color: '#EF4444', fontSize: 36, fontWeight: '900' }}>PASS</Text>
        </Animated.View>
      </Grad>

      <View style={s.swipeInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Text style={s.swipeName}>{profile.name}, {profile.age} ans</Text>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>{profile.city.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={s.swipeMeta}>{profile.bio}</Text>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <Text style={s.swipeChip}>
            {profile.emoji} {sportLabel.toUpperCase()}
          </Text>
          <Text style={s.swipeChip}>
            🎯 {profile.ageMin}-{profile.ageMax} ans recherchés
          </Text>
          <Text style={[s.swipeChip, { backgroundColor: isDateMode ? 'rgba(236,72,153,0.4)' : 'rgba(91,79,233,0.4)' }]}>
            {isDateMode ? '❤️ MODE DATE' : '⚔️ MODE BATTLE'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

function MatchScreen({ go, goBack, authUser }) {
  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRequestsList, setShowRequestsList] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('discover'); // discover | sent | received

  // Genre de l'utilisateur connecté (choisi à l'inscription), avec repli par défaut
  const myGender = authUser?.gender || CURRENT_USER.gender;

  // Champs de la demande
  const [selectedSport, setSelectedSport] = useState(null);
  const [requestDate, setRequestDate] = useState('2026-07-25');
  const [requestTime, setRequestTime] = useState('18:00');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestMode, setRequestMode] = useState('battle'); // battle | date | training

  const loadDeck = () => {
    let filtered = filterProfilesByGender(PROFILES, myGender);
    filtered = filterProfilesByAge(filtered, CURRENT_USER.age);
    setProfiles(filtered);
    if (filtered.length > 0) setCurrentProfile(filtered[0]);
  };

  const loadRequests = async () => {
    const all = await getMatchRequests();
    const sent = all.filter(r => r.fromUserId === 'me');
    const received = all.filter(r => r.toUserId === currentProfile?.id || r.toUserId === 'p1'); // simulé
    setMyRequests(sent);
    setReceivedRequests(received);
  };

  useEffect(() => {
    loadDeck();
    loadRequests();
  }, []);

  const sendRequest = async () => {
    if (!selectedSport || !currentProfile) {
      alert('Choisis un sport pour ta demande.');
      return;
    }
    // Vérifier si l'utilisateur est bloqué
    const isUserBlocked = await isBlocked(currentProfile.id);
    if (isUserBlocked) {
      alert('Vous avez bloqué cette personne. Débloquez-la pour lui envoyer une demande.');
      return;
    }
    const request = {
      id: 'req_' + Date.now(),
      fromUserId: 'me',
      fromUserName: 'Moi',
      toUserId: currentProfile.id,
      toUserName: currentProfile.name,
      toUserPhoto: currentProfile.photo,
      sport: selectedSport,
      sportLabel: ALL_SPORTS.find(s => s.key === selectedSport)?.label || selectedSport,
      sportEmoji: ALL_SPORTS.find(s => s.key === selectedSport)?.emoji || '🏃',
      mode: requestMode,
      date: requestDate,
      time: requestTime,
      message: requestMessage,
      status: 'pending', // pending | accepted | declined
      createdAt: new Date().toISOString(),
    };
    await saveMatchRequest(request);
    await loadRequests();
    setShowRequestModal(false);
    resetRequestForm();
    // Passe au profil suivant
    const nextProfiles = profiles.filter(p => p.id !== currentProfile.id);
    setProfiles(nextProfiles);
    setCurrentProfile(nextProfiles[0] || null);
  };

  const resetRequestForm = () => {
    setSelectedSport(null);
    setRequestDate('2026-07-25');
    setRequestTime('18:00');
    setRequestMessage('');
    setRequestMode('battle');
  };

  const respondToRequest = async (requestId, response, friendData) => {
    await updateMatchRequest(requestId, { status: response });
    // Si la demande est acceptée, ajouter automatiquement l'autre personne comme ami
    if (response === 'accepted' && friendData) {
      await addFriend(friendData);
    }
    await loadRequests();
  };

  const skipProfile = () => {
    const nextProfiles = profiles.filter(p => p.id !== currentProfile.id);
    setProfiles(nextProfiles);
    setCurrentProfile(nextProfiles[0] || null);
  };

  const openChat = async (request) => {
    // Si c'est une demande envoyée acceptée, s'assurer que l'ami est dans la liste
    if (request.fromUserId === 'me' && request.status === 'accepted') {
      const existingFriends = await getFriendsList();
      if (!existingFriends.find(f => f.id === request.toUserId)) {
        await addFriend({
          id: request.toUserId,
          name: request.toUserName,
          pseudo: '@' + request.toUserName.toLowerCase().replace(/\s+/g, '_'),
          emoji: request.toUserPhoto || '👤'
        });
      }
    }
    go('matchChat', { request });
  };

  const getModeLabel = (mode) => {
    switch(mode) {
      case 'battle': return '⚔️ Battle';
      case 'date': return '❤️ Date';
      case 'training': return '💪 Entraînement';
      default: return mode;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return { text: '⏳ En attente', color: '#F59E0B', bg: '#FEF3C7' };
      case 'accepted': return { text: '✓ Acceptée', color: '#22C55E', bg: '#DCFCE7' };
      case 'declined': return { text: '✗ Refusée', color: '#EF4444', bg: '#FEE2E2' };
      default: return { text: status, color: C.gray, bg: C.chip };
    }
  };

  // ─── VUE DÉCOUVERTE ───
  const renderDiscover = () => (
    <>
      {!currentProfile ? (
        <EmptyState
          icon="people-outline"
          title="Plus de profils"
          subtitle="Reviens plus tard pour découvrir de nouveaux sportifs !"
          cta="RAFRAÎCHIR"
          onCta={loadDeck}
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {/* Carte profil */}
          <View style={{
            width: 320,
            borderRadius: 24,
            overflow: 'hidden',
            backgroundColor: C.card,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 8,
          }}>
            <Grad colors={C.gradPurple} style={{ height: 280, alignItems: 'center', justifyContent: 'center' }}>
              {isSameGender(currentProfile, myGender) ? (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 90, opacity: 0.18 }}>{currentProfile.photo}</Text>
                  <View style={{
                    position: 'absolute',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255,255,255,0.35)',
                    width: 130,
                    height: 130,
                    borderRadius: 65,
                  }}>
                    <Ionicons name="eye-off-outline" size={26} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 10, marginTop: 4 }}>Photo floutée</Text>
                  </View>
                </View>
              ) : (
                <Text style={{ fontSize: 90 }}>{currentProfile.photo}</Text>
              )}
            </Grad>
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: C.dark }}>{currentProfile.name}, {currentProfile.age} ans</Text>
                <View style={{ backgroundColor: C.chip, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                  <Text style={{ color: C.primary, fontWeight: '700', fontSize: 11 }}>{currentProfile.city.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={{ color: C.gray, fontSize: 13, lineHeight: 18 }}>{currentProfile.bio}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <Text style={{ backgroundColor: C.chip, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, fontWeight: '700', fontSize: 11, color: C.dark }}>
                  {currentProfile.emoji} {ALL_SPORTS.find(s => s.key === currentProfile.sport)?.label?.toUpperCase() || currentProfile.sport}
                </Text>
                <Text style={{ backgroundColor: C.chip, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, fontWeight: '700', fontSize: 11, color: C.dark }}>
                  🎯 {currentProfile.ageMin}-{currentProfile.ageMax} ans
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 28 }}>
            <TouchableOpacity
              style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}
              onPress={skipProfile}
            >
              <Ionicons name="close" size={28} color={C.danger} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setShowRequestModal(true)}
            >
              <Ionicons name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={{ color: C.gray, fontSize: 12, marginTop: 12 }}>
            <Ionicons name="information-circle" size={12} color={C.gray} /> Appuie sur 📨 pour faire une demande
          </Text>
        </View>
      )}
    </>
  );

  // ─── VUE MES DEMANDES ───
  const renderSentRequests = () => (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {myRequests.length === 0 ? (
        <EmptyState
          icon="mail-outline"
          title="Aucune demande envoyée"
          subtitle="Fais une demande à un sportif pour commencer !"
          cta="DÉCOUVRIR"
          onCta={() => setActiveTab('discover')}
        />
      ) : (
        myRequests.map(req => {
          const badge = getStatusBadge(req.status);
          return (
            <TouchableOpacity
              key={req.id}
              onPress={() => req.status === 'accepted' ? openChat(req) : null}
              style={{ backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 24 }}>{req.toUserPhoto || '👤'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', fontSize: 15, color: C.dark }}>{req.toUserName}</Text>
                  <Text style={{ color: C.gray, fontSize: 12, marginTop: 2 }}>
                    {req.sportEmoji} {req.sportLabel} · {getModeLabel(req.mode)}
                  </Text>
                  <Text style={{ color: C.light, fontSize: 11, marginTop: 2 }}>
                    📅 {req.date} à {req.time}
                  </Text>
                </View>
                <View style={{ backgroundColor: badge.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}>
                  <Text style={{ color: badge.color, fontWeight: '800', fontSize: 10 }}>{badge.text}</Text>
                </View>
              </View>
              {req.message ? (
                <View style={{ backgroundColor: C.chip, borderRadius: 12, padding: 10, marginTop: 10 }}>
                  <Text style={{ color: C.gray, fontSize: 12, fontStyle: 'italic' }}>💬 "{req.message}"</Text>
                </View>
              ) : null}
              {req.status === 'accepted' ? (
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.primary, borderRadius: 999, paddingVertical: 10, marginTop: 10 }}
                  onPress={() => openChat(req)}
                >
                  <Ionicons name="chatbubble" size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>OUVRIR LA CONVERSATION</Text>
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );

  // ─── VUE DEMANDES REÇUES ───
  const renderReceivedRequests = () => (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {receivedRequests.length === 0 ? (
        <EmptyState
          icon="mail-open-outline"
          title="Aucune demande reçue"
          subtitle="Quand quelqu'un te fait une demande, elle apparaîtra ici."
        />
      ) : (
        receivedRequests.map(req => (
          <View key={req.id} style={{ backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24 }}>{req.fromUserPhoto || '👤'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', fontSize: 15, color: C.dark }}>{req.fromUserName}</Text>
                <Text style={{ color: C.gray, fontSize: 12, marginTop: 2 }}>
                  {req.sportEmoji} {req.sportLabel} · {getModeLabel(req.mode)}
                </Text>
                <Text style={{ color: C.light, fontSize: 11, marginTop: 2 }}>
                  📅 {req.date} à {req.time}
                </Text>
              </View>
            </View>
            {req.message ? (
              <View style={{ backgroundColor: C.chip, borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <Text style={{ color: C.dark, fontSize: 13 }}>💬 "{req.message}"</Text>
              </View>
            ) : null}
            {req.status === 'pending' ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#DCFCE7', borderRadius: 999, paddingVertical: 12 }}
                  onPress={() => respondToRequest(req.id, 'accepted', { id: req.fromUserId, name: req.fromUserName, pseudo: '@' + req.fromUserName.toLowerCase().replace(/\s+/g, '_'), emoji: req.fromUserPhoto || '👤' })}
                >
                  <Ionicons name="checkmark" size={16} color="#15803D" />
                  <Text style={{ color: '#15803D', fontWeight: '800', fontSize: 13 }}>ACCEPTER</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEE2E2', borderRadius: 999, paddingVertical: 12 }}
                  onPress={() => respondToRequest(req.id, 'declined')}
                >
                  <Ionicons name="close" size={16} color={C.danger} />
                  <Text style={{ color: C.danger, fontWeight: '800', fontSize: 13 }}>REFUSER</Text>
                </TouchableOpacity>
              </View>
            ) : req.status === 'accepted' ? (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.primary, borderRadius: 999, paddingVertical: 12 }}
                onPress={() => openChat(req)}
              >
                <Ionicons name="chatbubble" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>OUVRIR LA CONVERSATION</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ backgroundColor: '#FEE2E2', borderRadius: 999, paddingVertical: 10, alignItems: 'center' }}>
                <Text style={{ color: C.danger, fontWeight: '800', fontSize: 12 }}>✗ Demande refusée</Text>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title="Rencontres" onBack={goBack} right={
        <TouchableOpacity onPress={() => setShowRequestsList(!showRequestsList)} style={{ padding: 8 }}>
          <View style={{ position: 'relative' }}>
            <Ionicons name="mail-outline" size={22} color={C.primary} />
            {(myRequests.length + receivedRequests.length) > 0 ? (
              <View style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{myRequests.length + receivedRequests.length}</Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      } />

      {/* Navigation tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 }}>
        <TouchableOpacity
          onPress={() => setActiveTab('discover')}
          style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: activeTab === 'discover' ? C.primary : C.chip }}
        >
          <Text style={{ fontWeight: '800', fontSize: 12, color: activeTab === 'discover' ? '#fff' : C.gray }}>🔍 DÉCOUVRIR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('sent')}
          style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: activeTab === 'sent' ? C.primary : C.chip }}
        >
          <Text style={{ fontWeight: '800', fontSize: 12, color: activeTab === 'sent' ? '#fff' : C.gray }}>📤 ENVOYÉES ({myRequests.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('received')}
          style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: activeTab === 'received' ? C.primary : C.chip }}
        >
          <Text style={{ fontWeight: '800', fontSize: 12, color: activeTab === 'received' ? '#fff' : C.gray }}>📥 REÇUES ({receivedRequests.length})</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'discover' && renderDiscover()}
        {activeTab === 'sent' && renderSentRequests()}
        {activeTab === 'received' && renderReceivedRequests()}
      </View>

      {/* MODAL : FAIRE UNE DEMANDE */}
      <Modal visible={showRequestModal} transparent animationType="slide" onRequestClose={() => setShowRequestModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 40, maxHeight: '92%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 20, fontWeight: '900', color: C.dark }}>📨 Faire une demande</Text>
                <Text style={{ color: C.gray, fontSize: 13, marginTop: 2 }}>À {currentProfile?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                <Ionicons name="close" size={24} color={C.gray} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Mode de rencontre */}
              <Text style={{ fontSize: 12, fontWeight: '800', marginBottom: 8 }}>TYPE DE RENCONTRE</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {[
                  { key: 'battle', label: '⚔️ Battle', desc: 'Défi sportif 1v1' },
                  { key: 'date', label: '❤️ Date', desc: 'Rencontre sportive' },
                  { key: 'training', label: '💪 Entraînement', desc: 'Session ensemble' },
                ].map(m => (
                  <TouchableOpacity
                    key={m.key}
                    onPress={() => setRequestMode(m.key)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: 12,
                      borderRadius: 14,
                      backgroundColor: requestMode === m.key ? C.primary : C.chip,
                      borderWidth: 1,
                      borderColor: requestMode === m.key ? C.primary : C.border,
                    }}
                  >
                    <Text style={{ fontWeight: '800', fontSize: 12, color: requestMode === m.key ? '#fff' : C.dark }}>{m.label}</Text>
                    <Text style={{ fontSize: 10, color: requestMode === m.key ? 'rgba(255,255,255,0.8)' : C.gray, marginTop: 2 }}>{m.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Choix du sport */}
              <Text style={{ fontSize: 12, fontWeight: '800', marginBottom: 8 }}>SPORT *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {ALL_SPORTS.map(sp => (
                  <TouchableOpacity
                    key={sp.key}
                    onPress={() => setSelectedSport(sp.key)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 999,
                      backgroundColor: selectedSport === sp.key ? C.primary : C.chip,
                      marginRight: 8,
                      borderWidth: 1,
                      borderColor: selectedSport === sp.key ? C.primary : C.border,
                    }}
                  >
                    <Text style={{ fontWeight: '700', fontSize: 12, color: selectedSport === sp.key ? '#fff' : C.dark }}>
                      {sp.emoji} {sp.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Date & Heure */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', marginBottom: 8 }}>DATE</Text>
                  <TextInput
                    style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14 }}
                    value={requestDate}
                    onChangeText={setRequestDate}
                    placeholder="2026-07-25"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', marginBottom: 8 }}>HEURE</Text>
                  <TextInput
                    style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14 }}
                    value={requestTime}
                    onChangeText={setRequestTime}
                    placeholder="18:00"
                  />
                </View>
              </View>

              {/* Message */}
              <Text style={{ fontSize: 12, fontWeight: '800', marginBottom: 8 }}>MESSAGE (optionnel)</Text>
              <TextInput
                style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, height: 80, textAlignVertical: 'top' }}
                placeholder="Salut ! Ça te dit de courir ensemble ce jour-là ?"
                value={requestMessage}
                onChangeText={setRequestMessage}
                multiline
                maxLength={200}
              />
              <Text style={{ color: C.light, fontSize: 11, textAlign: 'right', marginTop: 4 }}>{requestMessage.length}/200</Text>

              {/* Info blocage messagerie */}
              <View style={{ flexDirection: 'row', gap: 8, backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12, marginTop: 8, marginBottom: 16, borderWidth: 1, borderColor: '#F59E0B' }}>
                <Ionicons name="lock-closed" size={16} color="#92400E" />
                <Text style={{ color: '#92400E', fontSize: 12, flex: 1, lineHeight: 18 }}>
                  La messagerie sera débloquée uniquement si {currentProfile?.name} accepte ta demande. Tu pourras continuer à échanger même sans match "date/battle".
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={{
                backgroundColor: selectedSport ? C.primary : C.border,
                borderRadius: 999,
                paddingVertical: 16,
                alignItems: 'center',
                marginTop: 8,
              }}
              onPress={sendRequest}
              disabled={!selectedSport}
            >
              <Text style={{ color: selectedSport ? '#fff' : C.light, fontWeight: '800', fontSize: 15 }}>
                📨 ENVOYER LA DEMANDE
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatMinSec(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const sec = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

// Construit le détail des pauses pour l'affichage (partage ou historique) :
// nombre de pauses, durée de chacune, et temps total en pause. Jamais traité comme un
// "record" — uniquement de l'information descriptive sur la séance.
function formatPauseBreakdown(durations) {
  if (!durations || durations.length === 0) return null;
  const total = durations.reduce((a, b) => a + b, 0);
  const list = durations.map((d) => formatMinSec(d)).join(', ');
  return `${durations.length} pause${durations.length > 1 ? 's' : ''} : ${list} — total pauses ${formatMinSec(total)}`;
}

const TRACK_MODES = [
  { key: 'course', label: 'Course à pied', icon: 'flash' },
  { key: 'marche', label: 'Marche', icon: 'walk' },
  { key: 'rando', label: 'Randonnée', icon: 'trail-sign' },
  { key: 'pushup', label: 'Push-up', icon: 'barbell', redirect: true },
];

function TrackScreen({ go, goBack }) {
  const [mode, setMode] = useState('course');
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [km, setKm] = useState(0);
  const [liveSpeed, setLiveSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [avgPace, setAvgPace] = useState(0);
  const [heading, setHeading] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [gpsReady, setGpsReady] = useState(false);
  const [coords, setCoords] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [recordKm, setRecordKm] = useState(0.02);
  const [recordSpeed, setRecordSpeed] = useState(0);
  const [recordKcal, setRecordKcal] = useState(1);
  const [sendPanelOpen, setSendPanelOpen] = useState(false);
  const [sessionType, setSessionType] = useState(null);
  const [pathCoords, setPathCoords] = useState([]);
  const [pauseCount, setPauseCount] = useState(0);
  const [totalPauseSeconds, setTotalPauseSeconds] = useState(0);
  const [currentPauseStart, setCurrentPauseStart] = useState(null);
  const [pauseDurations, setPauseDurations] = useState([]); // durée (s) de chaque pause individuelle
  const pauseDurationsRef = useRef([]);
  const [streetName, setStreetName] = useState(null);
  const [cityName, setCityName] = useState(null);

  // --- MATÉRIEL ---
  const [steps, setSteps] = useState(0);
  const [stepCountStart, setStepCountStart] = useState(0);
  const [pedometerStatus, setPedometerStatus] = useState('idle'); // idle | active | unavailable | denied
  const stepCountStartRef = useRef(0);
  const pedometerSubRef = useRef(null);
  const timerRef = useRef(null);
  const watchRef = useRef(null);
  const headingRef = useRef(null);
  const lastCoordRef = useRef(null);
  const speedBufferRef = useRef([]);
  const kmRef = useRef(0);
  const secondsRef = useRef(0);

  useEffect(() => { kmRef.current = km; }, [km]);
  useEffect(() => { secondsRef.current = seconds; }, [seconds]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
          setCoords(loc.coords);
          setGpsAccuracy(loc.coords.accuracy);
        }
      } catch (e) {}
    })();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchRef.current) watchRef.current.remove();
      if (headingRef.current) headingRef.current.remove();
    };
  }, []);

  useEffect(() => {
    let sub;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          sub = await Location.watchHeadingAsync((data) => {
            setHeading(data.trueHeading || data.magHeading || 0);
          });
          headingRef.current = sub;
        }
      } catch (e) {}
    })();
    return () => { if (sub) sub.remove(); };
  }, []);

  const getCardinalDirection = (deg) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  // Géocodage inverse : récupère le nom de la rue depuis les coordonnées GPS
  const fetchStreetName = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'NutriSport/1.0' } }
      );
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const street = addr.road || addr.pedestrian || addr.path || addr.footway || 'Rue inconnue';
        const city = addr.city || addr.town || addr.village || addr.suburb || '';
        setStreetName(street);
        setCityName(city);
      }
    } catch (e) {
      // Silencieux en cas d'erreur réseau
    }
  };

  // --- PODOMÈTRE NATIF ---
  const startPedometer = async () => {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) {
      setPedometerStatus('unavailable');
      return;
    }

    // Sur Android 10+, l'accès au capteur de pas exige la permission ACTIVITY_RECOGNITION.
    // Sans cette demande explicite, watchStepCount ne renvoie jamais rien, silencieusement.
    try {
      if (Pedometer.requestPermissionsAsync) {
        const perm = await Pedometer.requestPermissionsAsync();
        if (perm && perm.status && perm.status !== 'granted') {
          setPedometerStatus('denied');
          return;
        }
      }
    } catch (e) {
      // Si la méthode n'existe pas sur cette version du SDK, on continue sans bloquer —
      // isAvailableAsync() reste le filtre principal.
    }

    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const result = await Pedometer.getStepCountAsync(start, end);
    const baseline = result ? result.steps : 0;
    setStepCountStart(baseline);
    stepCountStartRef.current = baseline; // valeur à jour immédiatement, sans attendre le re-render
    setPedometerStatus('active');

    pedometerSubRef.current = Pedometer.watchStepCount((result) => {
      setSteps(result.steps - stepCountStartRef.current);
    });
  };

  const stopPedometer = () => {
    if (pedometerSubRef.current) {
      pedometerSubRef.current.remove();
      pedometerSubRef.current = null;
    }
  };

  const smoothSpeed = (newSpeed) => {
    speedBufferRef.current.push(newSpeed);
    if (speedBufferRef.current.length > 5) speedBufferRef.current.shift();
    return speedBufferRef.current.reduce((a, b) => a + b, 0) / speedBufferRef.current.length;
  };

  const start = async () => {
    setErrorMsg(null);
    setGpsReady(false);
    setStreetName(null);
    setCityName(null);
    startPedometer();
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission GPS refusée.');
      return;
    }
    if (!paused) { lastCoordRef.current = null; speedBufferRef.current = []; setPathCoords([]); }
    timerRef.current = setInterval(() => setSeconds((x) => x + 1), 1000);
    try {
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 2 },
        (loc) => {
          const { latitude, longitude, speed, accuracy, altitude } = loc.coords;
          setCoords(loc.coords);
          setGpsAccuracy(accuracy);
          setGpsReady(true);

          // Met à jour le nom de la rue toutes les 10 secondes (pas à chaque frame)
          if (Math.floor(Date.now() / 10000) % 2 === 0) {
            fetchStreetName(latitude, longitude);
          }

          // Filtre qualité GPS : ignore les points imprécis
          if (accuracy && accuracy > 25) return;

          // Filtre vitesse : ne compte que si on bouge réellement (> 1.5 km/h = marche lente)
          const currentSpeedKmh = speed && speed > 0 ? speed * 3.6 : 0;
          if (currentSpeedKmh < 1.5) {
            // On est à l'arrêt ou quasi-arrêt → pas de distance
            lastCoordRef.current = { latitude, longitude };
            setLiveSpeed(0);
            return;
          }

          if (lastCoordRef.current) {
            const d = haversineKm(lastCoordRef.current.latitude, lastCoordRef.current.longitude, latitude, longitude);
            // Filtres anti-saut : entre 2m et 50m max par intervalle (2s)
            if (d >= 0.002 && d <= 0.05) {
              setKm((prev) => prev + d);
              setPathCoords((prev) => [...prev, { latitude, longitude }]);
            }
          }
          lastCoordRef.current = { latitude, longitude };

          const smoothedKmh = smoothSpeed(currentSpeedKmh);
          setLiveSpeed(smoothedKmh);
          setMaxSpeed((prev) => Math.max(prev, smoothedKmh));
          if (kmRef.current > 0.01 && secondsRef.current > 0) {
            setAvgPace((secondsRef.current / 60) / kmRef.current);
          }
        }
      );
    } catch (e) {
      setErrorMsg('Impossible de démarrer le GPS.');
      clearInterval(timerRef.current);
      return;
    }
    setRunning(true);
    setPaused(false);
  };

  const pause = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchRef.current) { watchRef.current.remove(); watchRef.current = null; }
    setRunning(false);
    setPaused(true);
    setPauseCount((c) => c + 1);
    setCurrentPauseStart(Date.now());
  };

  const resume = () => {
    if (currentPauseStart) {
      const pauseDuration = Math.floor((Date.now() - currentPauseStart) / 1000);
      setTotalPauseSeconds((prev) => prev + pauseDuration);
      pauseDurationsRef.current = [...pauseDurationsRef.current, pauseDuration];
      setPauseDurations(pauseDurationsRef.current);
      setCurrentPauseStart(null);
    }
    start();
  };

  const stop = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchRef.current) { watchRef.current.remove(); watchRef.current = null; }
    stopPedometer();
    setRunning(false);
    setPaused(false);
    if (currentPauseStart) {
      const pauseDuration = Math.floor((Date.now() - currentPauseStart) / 1000);
      setTotalPauseSeconds((prev) => prev + pauseDuration);
      pauseDurationsRef.current = [...pauseDurationsRef.current, pauseDuration];
      setPauseDurations(pauseDurationsRef.current);
      setCurrentPauseStart(null);
    }
    const cals = Math.round(km * (mode === 'course' ? 60 : mode === 'marche' ? 40 : 50));
    let isNewRecord = false;
    if (km > recordKm) { setRecordKm(km); isNewRecord = true; }
    if (maxSpeed > recordSpeed) { setRecordSpeed(maxSpeed); isNewRecord = true; }
    if (cals > recordKcal) { setRecordKcal(cals); isNewRecord = true; }
    if (isNewRecord) { setSessionType('personal'); }
    else if (km > 0) { setSessionType('exercise'); }
    else { setSessionType(null); }
    // Incrémenter les stats de progression
    if (km > 0) {
      await incrementStat('trackSessions');
      await incrementStat('totalKm', km);
    }
    // Intègre la séance dans l'historique de pratique sportive
    if (km > 0 || secondsRef.current > 0) {
      const mmDur = Math.floor(secondsRef.current / 60);
      const ssDur = (secondsRef.current % 60).toString().padStart(2, '0');
      await addPracticeEntry({
        sport: mode,
        distanceKm: km > 0 ? km : undefined,
        duration: `${mmDur}:${ssDur}`,
        calories: cals > 0 ? cals : undefined,
        isRecord: isNewRecord,
        sourceType: 'track',
        notes: formatPauseBreakdown(pauseDurationsRef.current) || undefined,
      });
    }
  };

  const reset = () => {
    pause();
    setSeconds(0);
    setKm(0);
    setLiveSpeed(0);
    setMaxSpeed(0);
    setAvgPace(0);
    setErrorMsg(null);
    setPathCoords([]);
    setSessionType(null);
    setPauseCount(0);
    setTotalPauseSeconds(0);
    setCurrentPauseStart(null);
    setPauseDurations([]);
    pauseDurationsRef.current = [];
    setStreetName(null);
    setCityName(null);
    setSteps(0);
    setStepCountStart(0);
    stepCountStartRef.current = 0;
    setPedometerStatus('idle');
    stopPedometer();
    lastCoordRef.current = null;
    speedBufferRef.current = [];
  };

  const mm = Math.floor(seconds / 60);
  const ss = (seconds % 60).toString().padStart(2, '0');
  const paceMin = avgPace > 0 ? Math.floor(avgPace) : 0;
  const paceSec = avgPace > 0 ? Math.round((avgPace - paceMin) * 60).toString().padStart(2, '0') : '00';
  const calories = Math.round(km * (mode === 'course' ? 60 : mode === 'marche' ? 40 : 50));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B14' }}>
      <ScrollView style={{ flex: 1, minHeight: 0 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: C.primary, fontWeight: '800', letterSpacing: 1, fontSize: 12 }}>SOLO RUN</Text>
        {/* Boussole */}
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: `${-heading}deg` }] }}>
            <Ionicons name="navigate" size={16} color="#22C55E" />
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '700', marginTop: 1 }}>{getCardinalDirection(heading)}</Text>
        </View>
      </View>

      {/* NOM DE LA RUE / POSITION */}
      <View style={{ paddingHorizontal: 16, marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name="location" size={14} color={gpsReady ? '#22C55E' : '#F59E0B'} />
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', flex: 1 }} numberOfLines={1}>
          {streetName ? `${streetName}${cityName ? ', ' + cityName : ''}` : (gpsReady ? 'Localisation en cours...' : 'GPS non disponible')}
        </Text>
        {gpsAccuracy ? (
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>±{gpsAccuracy.toFixed(0)}m</Text>
        ) : null}
      </View>

      {/* 4 SPORTS - GRILLE 2x2 BIEN VISIBLE */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 8, gap: 8 }}>
        {TRACK_MODES.map((m) => (
          <TouchableOpacity
            key={m.key}
            onPress={() => m.redirect ? go('pushup') : setMode(m.key)}
            style={{
              width: '48%',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: mode === m.key ? C.primary : 'rgba(255,255,255,0.06)',
              borderWidth: mode === m.key ? 0 : 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Ionicons name={m.icon} size={18} color={mode === m.key ? '#fff' : 'rgba(255,255,255,0.6)'} />
            <Text style={{ color: mode === m.key ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 13 }}>{m.label}</Text>
            {m.redirect ? <Ionicons name="open-outline" size={12} color={mode === m.key ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)'} style={{ marginLeft: 'auto' }} /> : null}
          </TouchableOpacity>
        ))}
      </View>

      {/* COMPTEURS PRINCIPAUX */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 12, paddingHorizontal: 16 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 42, fontWeight: '900' }}>{km.toFixed(2)}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 11 }}>KM</Text>
        </View>
        <View style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' }} />
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 42, fontWeight: '900' }}>{mm}:{ss}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 11 }}>DURÉE</Text>
        </View>
      </View>

      {/* STATS GRID 2x2 */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 16, marginTop: 10, gap: 8 }}>
        <View style={{ width: '48%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 10, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700' }}>VITESSE</Text>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 }}>{running && gpsReady ? liveSpeed.toFixed(1) : '—'}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>KM/H</Text>
        </View>
        <View style={{ width: '48%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 10, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700' }}>VMAX</Text>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 }}>{maxSpeed > 0 ? maxSpeed.toFixed(1) : '—'}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>KM/H</Text>
        </View>
        <View style={{ width: '48%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 10, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700' }}>ALLURE</Text>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 }}>{avgPace > 0 ? `${paceMin}:${paceSec}` : '—'}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>MIN/KM</Text>
        </View>
        <View style={{ width: '48%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 10, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700' }}>CALORIES</Text>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 }}>{calories}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>KCAL</Text>
        </View>
      </View>

      {/* CAPTEURS */}
      <View style={{ marginHorizontal: 16, marginTop: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 12 }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 10 }}>📡 CAPTEURS</Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Pas */}
          <View style={{ flex: 1, backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' }}>
            <Ionicons name="footsteps" size={16} color="#3B82F6" />
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 }}>{steps > 0 ? steps : '—'}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9 }}>PAS</Text>
          </View>
        </View>

        {pedometerStatus === 'unavailable' ? (
          <Text style={{ color: '#F59E0B', fontSize: 10, marginTop: 8, lineHeight: 14 }}>
            ⚠️ Podomètre non disponible sur cet appareil.
          </Text>
        ) : pedometerStatus === 'denied' ? (
          <Text style={{ color: '#F59E0B', fontSize: 10, marginTop: 8, lineHeight: 14 }}>
            ⚠️ Autorisation refusée — active "Activité physique" dans les réglages du téléphone pour cette app.
          </Text>
        ) : null}
      </View>

      {/* RECORDS */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 16, marginTop: 10, borderRadius: 14, paddingVertical: 10 }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 14 }}>🏆</Text>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{recordKm.toFixed(2)}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: '700' }}>KM REC</Text>
        </View>
        <View style={{ width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' }} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 14 }}>⚡</Text>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{recordSpeed.toFixed(1)}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: '700' }}>VMAX REC</Text>
        </View>
        <View style={{ width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' }} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 14 }}>🔥</Text>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{recordKcal}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: '700' }}>KCAL REC</Text>
        </View>
      </View>

      {/* BADGE RECORD/EXERCICE + PAUSES */}
      {!running && sessionType ? (
        <View style={{ alignItems: 'center', marginTop: 8, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, backgroundColor: sessionType === 'personal' ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)', borderWidth: 1, borderColor: sessionType === 'personal' ? '#22C55E' : '#3B82F6' }}>
            <Ionicons name={sessionType === 'personal' ? "trophy" : "fitness"} size={14} color={sessionType === 'personal' ? '#22C55E' : '#3B82F6'} />
            <Text style={{ color: sessionType === 'personal' ? '#22C55E' : '#3B82F6', fontWeight: '800', fontSize: 12 }}>
              {sessionType === 'personal' ? '🏆 RECORD PERSO !' : '💪 EXERCICE'}
            </Text>
          </View>
          {pauseCount > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: '#F59E0B' }}>
              <Ionicons name="pause-circle" size={12} color="#F59E0B" />
              <Text style={{ color: '#F59E0B', fontWeight: '700', fontSize: 11 }}>
                {pauseCount} pause{pauseCount > 1 ? 's' : ''} ({Math.floor(totalPauseSeconds / 60)}:{(totalPauseSeconds % 60).toString().padStart(2, '0')})
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* ERREUR GPS */}
      {errorMsg ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239,68,68,0.15)', marginHorizontal: 16, marginTop: 8, padding: 8, borderRadius: 10 }}>
          <Ionicons name="warning-outline" size={14} color="#FCA5A5" />
          <Text style={{ color: '#FCA5A5', fontSize: 11, flex: 1 }}>{errorMsg}</Text>
        </View>
      ) : null}
      </ScrollView>

      {/* BOUTONS — toujours visibles, fixés en bas de l'écran (hors zone de scroll) */}
      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, backgroundColor: '#0B0B14', zIndex: 10, elevation: 10 }}>
        {!running && !paused && seconds === 0 ? (
          <TouchableOpacity onPress={start} style={{ width: '100%' }}>
            <Grad colors={C.gradOrangePink} style={[s.startBtn, { paddingVertical: 14 }]}>
              <Text style={s.startText}>▶ DÉMARRER</Text>
            </Grad>
          </TouchableOpacity>
        ) : running ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={pause} style={{ flex: 1 }}>
              <Grad colors={['#EF4444', '#F97316']} style={[s.startBtn, { paddingVertical: 14 }]}>
                <Text style={s.startText}>⏸ PAUSE</Text>
              </Grad>
            </TouchableOpacity>
            <TouchableOpacity onPress={stop} style={{ flex: 1 }}>
              <Grad colors={['#7C2D12', '#450A0A']} style={[s.startBtn, { paddingVertical: 14 }]}>
                <Text style={s.startText}>⏹ ARRÊTER</Text>
              </Grad>
            </TouchableOpacity>
          </View>
        ) : paused ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={resume} style={{ flex: 1 }}>
              <Grad colors={C.gradOrangePink} style={[s.startBtn, { paddingVertical: 14 }]}>
                <Text style={s.startText}>▶ REPRENDRE</Text>
              </Grad>
            </TouchableOpacity>
            <TouchableOpacity onPress={stop} style={{ flex: 1 }}>
              <Grad colors={['#EF4444', '#F97316']} style={[s.startBtn, { paddingVertical: 14 }]}>
                <Text style={s.startText}>⏹ FIN</Text>
              </Grad>
            </TouchableOpacity>
          </View>
        ) : null}

        {!running && seconds > 0 ? (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <TouchableOpacity onPress={() => setSendPanelOpen(true)} style={{ flex: 1 }}>
              <View style={[s.sendBtn, { paddingVertical: 12 }]}>
                <Ionicons name="send" size={14} color={C.primary} />
                <Text style={s.sendBtnText}>ENVOYER</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={reset} style={{ flex: 1 }}>
              <View style={[s.resetBtn, { paddingVertical: 12 }]}>
                <Text style={s.resetText}>RÉINIT</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <SendRecordPanel
        visible={sendPanelOpen}
        onClose={() => setSendPanelOpen(false)}
        recordLabel={`${paused ? '🟡 En cours (en pause) — ' : !running && seconds > 0 ? '✅ Terminée — ' : ''}${km.toFixed(2)} km en ${mm}:${ss}${formatPauseBreakdown(pauseDurations) ? ` · ${formatPauseBreakdown(pauseDurations)}` : ''}`}
        recordType={sessionType}
      />
    </SafeAreaView>
  );
}const PUSHUP_MIN_THRESHOLD = 0.02;
const PUSHUP_MAX_THRESHOLD = 0.5;
const PUSHUP_THRESHOLD_STEP = 0.01;
const PUSHUP_MIN_REP_INTERVAL_MS = 500;
const PUSHUP_CALIBRATION_MS = 5000;

function PushupScreen({ goBack }) {
  const [count, setCount] = useState(0);
  const [tracking, setTracking] = useState(false);
  const [best, setBest] = useState(0);
  const [sendPanelOpen, setSendPanelOpen] = useState(false);
  const [sessionType, setSessionType] = useState(null);
  const [sensorOk, setSensorOk] = useState(true);
  const [threshold, setThreshold] = useState(0.06);
  const [liveAmplitude, setLiveAmplitude] = useState(0);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationResult, setCalibrationResult] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const lastMagnitudeRef = useRef(1);
  const lastRepTimeRef = useRef(0);
  const subRef = useRef(null);
  const thresholdRef = useRef(0.06);
  const calibratingRef = useRef(false);
  const calibrationPeakRef = useRef(0);
  const countRef = useRef(0);

  useEffect(() => { thresholdRef.current = threshold; }, [threshold]);
  useEffect(() => { countRef.current = count; }, [count]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('pushup_best_score');
        if (saved) setBest(parseInt(saved, 10) || 0);
      } catch (e) {}
    })();
    return () => {
      if (subRef.current) subRef.current.remove();
    };
  }, []);

  const listenSensor = () => {
    Accelerometer.setUpdateInterval(50);
    subRef.current = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const jerk = Math.abs(magnitude - lastMagnitudeRef.current);
      lastMagnitudeRef.current = magnitude;
      setLiveAmplitude(jerk);

      if (calibratingRef.current) {
        calibrationPeakRef.current = Math.max(calibrationPeakRef.current, jerk);
        return;
      }

      const th = thresholdRef.current;
      const now = Date.now();
      if (jerk > th && now - lastRepTimeRef.current > PUSHUP_MIN_REP_INTERVAL_MS) {
        lastRepTimeRef.current = now;
        setCount((c) => c + 1);
      }
    });
  };

  const start = async () => {
    const available = await Accelerometer.isAvailableAsync();
    if (!available) {
      setSensorOk(false);
      return;
    }
    setSensorOk(true);
    setCount(0);
    countRef.current = 0;
    setCalibrationResult(null);
    lastMagnitudeRef.current = 1;
    lastRepTimeRef.current = 0;
    listenSensor();
    setTracking(true);
  };

  const stop = async () => {
    if (subRef.current) {
      subRef.current.remove();
      subRef.current = null;
    }
    setTracking(false);
    setLiveAmplitude(0);
    let isNewRecord = false;
    if (countRef.current > best) {
      setBest(countRef.current);
      setSessionType('personal');
      isNewRecord = true;
      try {
        await AsyncStorage.setItem('pushup_best_score', String(countRef.current));
      } catch (e) {}
    } else if (countRef.current > 0) {
      setSessionType('exercise');
    }
    // Intègre la séance dans l'historique de pratique sportive
    if (countRef.current > 0) {
      await addPracticeEntry({
        sport: 'pushup',
        reps: countRef.current,
        isRecord: isNewRecord,
        sourceType: 'pushup',
      });
    }
  };

  const calibrate = async () => {
    const available = await Accelerometer.isAvailableAsync();
    if (!available) {
      setSensorOk(false);
      return;
    }
    setSensorOk(true);
    setCalibrationResult(null);
    calibrationPeakRef.current = 0;
    lastMagnitudeRef.current = 1;
    calibratingRef.current = true;
    setCalibrating(true);
    listenSensor();

    setTimeout(() => {
      calibratingRef.current = false;
      setCalibrating(false);
      if (subRef.current) {
        subRef.current.remove();
        subRef.current = null;
      }
      const peak = calibrationPeakRef.current;
      if (peak < 0.015) {
        setCalibrationResult('none');
        return;
      }
      const suggested = Math.max(PUSHUP_MIN_THRESHOLD, Math.min(PUSHUP_MAX_THRESHOLD, peak * 0.4));
      setThreshold(Math.round(suggested * 100) / 100);
      setCalibrationResult(peak.toFixed(3));
    }, PUSHUP_CALIBRATION_MS);
  };

  const share = async () => {
    try {
      await Share.share({ message: `💪 Je viens de faire ${count} pompes sur NutriSport ! Record perso : ${best}.` });
    } catch (e) {}
  };

  const amplitudeRatio = Math.min(1, liveAmplitude / (calibrating ? 0.3 : threshold * 1.5));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B14' }}>
      <ScrollView>
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: C.primary, fontWeight: '800', letterSpacing: 1, marginTop: 8 }}>SOLO WORKOUT</Text>
          <Text style={{ color: '#fff', fontSize: 38, fontWeight: '900' }}>PUSH-UP</Text>
        </View>

        <View style={s.trackInfo}>
          <Ionicons name="information-circle" size={18} color={C.primary} />
          <Text style={s.trackInfoText}>
            Pose le téléphone au sol, juste sous tes mains ou entre elles, sur un sol dur. Le capteur détecte la vibration transmise au sol à chaque appui.
          </Text>
        </View>

        {!sensorOk ? (
          <View style={s.trackError}>
            <Ionicons name="warning-outline" size={18} color="#FCA5A5" />
            <Text style={s.trackErrorText}>Accéléromètre indisponible sur cet appareil/navigateur. Teste sur un téléphone physique via Expo Go.</Text>
          </View>
        ) : null}

        {/* Caméra optionnelle (feedback visuel uniquement) */}
        <TouchableOpacity 
          onPress={async () => {
            if (!showCamera) {
              if (!cameraPermission?.granted) {
                const { status } = await requestCameraPermission();
                if (status !== 'granted') return;
              }
              setShowCamera(true);
            } else {
              setShowCamera(false);
            }
          }}
          style={{ marginHorizontal: 16, marginTop: 12 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
            <Ionicons name={showCamera ? "videocam" : "videocam-outline"} size={18} color={showCamera ? C.primary : 'rgba(255,255,255,0.5)'} />
            <Text style={{ color: showCamera ? C.primary : 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 12 }}>
              {showCamera ? '📷 Caméra active (feedback visuel)' : '📷 Activer la caméra (optionnel)'}
            </Text>
          </View>
        </TouchableOpacity>

        {showCamera && cameraPermission?.granted ? (
          <View style={{ marginHorizontal: 16, marginTop: 12, borderRadius: 20, overflow: 'hidden', height: 200, backgroundColor: '#1a1a2e', borderWidth: 2, borderColor: tracking ? C.primary : 'rgba(255,255,255,0.1)' }}>
            <CameraView
              style={{ flex: 1 }}
              facing="front"
            />
            {tracking ? (
              <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>🔴 ENREGISTREMENT</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Seuil de vibration */}
        <View style={s.thresholdBox}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.amplitudeLabel}>SEUIL DE VIBRATION</Text>
            <Text style={s.thresholdValue}>{threshold.toFixed(2)}</Text>
          </View>
          <View style={s.stepperRow}>
            <TouchableOpacity
              style={s.stepperBtnDark}
              disabled={tracking || calibrating}
              onPress={() => setThreshold((t) => Math.max(PUSHUP_MIN_THRESHOLD, Math.round((t - PUSHUP_THRESHOLD_STEP) * 100) / 100))}
            >
              <Ionicons name="remove" size={18} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <View style={s.amplitudeTrack}>
                <View style={[s.amplitudeFill, { width: `${amplitudeRatio * 100}%`, backgroundColor: calibrating ? '#F59E0B' : C.primary }]} />
              </View>
            </View>
            <TouchableOpacity
              style={s.stepperBtnDark}
              disabled={tracking || calibrating}
              onPress={() => setThreshold((t) => Math.min(PUSHUP_MAX_THRESHOLD, Math.round((t + PUSHUP_THRESHOLD_STEP) * 100) / 100))}
            >
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={s.pushupHint}>Rien ne se compte : baisse (−). Ça compte trop vite : monte (+).</Text>

          <TouchableOpacity style={s.calibrateBtn} onPress={calibrate} disabled={tracking || calibrating}>
            <Ionicons name={calibrating ? 'timer-outline' : 'pulse-outline'} size={16} color={C.primary} />
            <Text style={s.calibrateBtnText}>
              {calibrating ? 'CALIBRATION EN COURS (5s) — FAIS 2-3 POMPES MAINTENANT' : 'CALIBRER AUTOMATIQUEMENT (5s)'}
            </Text>
          </TouchableOpacity>

          {calibrationResult === 'none' ? (
            <Text style={s.calibrateResultBad}>Aucune vibration détectée — rapproche le téléphone de tes mains ou essaie un sol plus dur.</Text>
          ) : calibrationResult ? (
            <Text style={s.calibrateResultGood}>Pic mesuré : {calibrationResult} → seuil ajusté à {threshold.toFixed(2)}.</Text>
          ) : null}
        </View>

        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Text style={{ color: '#fff', fontSize: 96, fontWeight: '900' }}>{count}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '700', letterSpacing: 1 }}>RÉPÉTITIONS</Text>
        </View>

        <View style={s.recordsRow}>
          <View style={s.recordItem}>
            <Text style={s.recordEmoji}>🏆</Text>
            <Text style={s.recordValue}>{best}</Text>
            <Text style={s.recordLabel}>MEILLEUR SCORE</Text>
          </View>
        </View>

        {!tracking ? (
          <TouchableOpacity onPress={start} style={{ marginHorizontal: 24, marginTop: 32 }} disabled={calibrating}>
            <Grad colors={C.gradOrangePink} style={s.startBtn}>
              <Text style={s.startText}>▶ DÉMARRER LA SÉRIE</Text>
            </Grad>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={stop} style={{ marginHorizontal: 24, marginTop: 32 }}>
            <Grad colors={['#EF4444', '#F97316']} style={s.startBtn}>
              <Text style={s.startText}>⏹ ENREGISTRER / FIN</Text>
            </Grad>
          </TouchableOpacity>
        )}

        {!tracking && count > 0 ? (
          <>
            <TouchableOpacity onPress={() => setSendPanelOpen(true)} style={{ marginHorizontal: 24, marginTop: 12 }}>
              <View style={s.sendBtn}>
                <Ionicons name="send" size={14} color={C.primary} />
                <Text style={s.sendBtnText}>ENVOYER LE RECORD</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={share} style={{ marginHorizontal: 24, marginTop: 12, marginBottom: 24 }}>
              <View style={s.resetBtn}>
                <Text style={s.resetText}>📤 PARTAGER MON SCORE</Text>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ height: 24 }} />
        )}
      </ScrollView>

      <SendRecordPanel visible={sendPanelOpen} onClose={() => setSendPanelOpen(false)} recordLabel={`${count} pompes`} recordType={sessionType} />
    </SafeAreaView>
  );
}


function StoriesScreen({ go, goBack }) {
  const [stories, setStories] = useState(STORIES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const currentStory = stories[currentIndex];
  const STORY_DURATION = 5000; // 5 seconds per story

  useEffect(() => {
    if (!currentStory) return;

    // Mark as viewed
    setStories((prev) =>
      prev.map((s) => (s.id === currentStory.id ? { ...s, viewed: true } : s))
    );

    // Animate progress bar
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        nextStory();
      }
    });

    return () => {
      progressAnim.stopAnimation();
    };
    // eslint-disable-next-line
  }, [currentIndex]);

  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      goBack();
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleTap = (evt) => {
    const { locationX } = evt.nativeEvent;
    const screenWidth = 375; // approximate
    if (locationX < screenWidth / 2) {
      prevStory();
    } else {
      nextStory();
    }
  };

  if (!currentStory) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B14', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '800' }}>Aucune story</Text>
      </SafeAreaView>
    );
  }

  const getStoryContent = () => {
    switch (currentStory.type) {
      case 'run':
        return { icon: 'flash', label: 'Course', bg: ['#22C55E', '#16A34A'] };
      case 'basket':
        return { icon: 'basketball', label: 'Basket', bg: ['#F59E0B', '#D97706'] };
      case 'yoga':
        return { icon: 'heart', label: 'Yoga', bg: ['#EC4899', '#DB2777'] };
      case 'hiit':
        return { icon: 'flame', label: 'HIIT', bg: ['#EF4444', '#DC2626'] };
      default:
        return { icon: 'fitness', label: 'Sport', bg: C.gradPurple };
    }
  };

  const content_info = getStoryContent();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B14' }}>
      {/* Progress bars */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 8, paddingTop: 12, gap: 4 }}>
        {stories.map((s, idx) => (
          <View key={s.id} style={{ flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
            {idx < currentIndex ? (
              <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 2 }} />
            ) : idx === currentIndex ? (
              <Animated.View style={{
                height: 3,
                backgroundColor: '#fff',
                borderRadius: 2,
                width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              }} />
            ) : null}
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: currentStory.color, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>{currentStory.emoji}</Text>
        </View>
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{currentStory.name}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{currentStory.time} • {content_info.label}</Text>
        </View>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Story content */}
      <TouchableOpacity activeOpacity={1} onPress={handleTap} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Grad colors={content_info.bg} style={{
          width: 280,
          height: 280,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 4,
          borderColor: 'rgba(255,255,255,0.2)',
        }}>
          <Ionicons name={content_info.icon} size={64} color="rgba(255,255,255,0.9)" />
          <Text style={{ color: '#fff', fontSize: 48, fontWeight: '900', marginTop: 16 }}>{currentStory.data}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginTop: 8 }}>{content_info.label.toUpperCase()}</Text>
        </Grad>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, gap: 8 }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>👏 {Math.floor(Math.random() * 50) + 5} likes</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>💬 {Math.floor(Math.random() * 8) + 1}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Bottom hint */}
      <Text style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', paddingBottom: 20, fontSize: 12 }}>
        Tape à gauche/droite pour naviguer
      </Text>
    </SafeAreaView>
  );
}

function TeammatesScreen({ go, goBack }) {
  const [friends, setFriends] = useState([]);
  const [teammates, setTeammates] = useState([]);
  const [teammatesDetails, setTeammatesDetails] = useState([]);
  const [activeTab, setActiveTab] = useState('teammates'); // 'teammates' | 'friends'
  const [selectedTeammate, setSelectedTeammate] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const f = await getFriendsList();
    setFriends(f);
    const t = await getTeammatesList();
    setTeammates(t);
    const details = await getTeammatesWithDetails();
    setTeammatesDetails(details);
  };

  const handleToggleTeammate = async (friendId) => {
    await toggleTeammate(friendId);
    await loadData();
  };

  const handleSaveNotes = async () => {
    if (selectedTeammate) {
      await updateTeammateNotes(selectedTeammate.friendId, editNotes);
      await loadData();
      setShowEditModal(false);
      setSelectedTeammate(null);
      setEditNotes('');
    }
  };

  const handleQuickEvent = (teammate) => {
    go('newEvent', { preselectedTeammates: [teammate.friendId], defaultSport: teammate.sport });
  };

  const openEditModal = (teammate) => {
    setSelectedTeammate(teammate);
    setEditNotes(teammate.notes || '');
    setShowEditModal(true);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title="Coéquipiers réguliers" onBack={goBack} />

      {/* Stats banner */}
      <View style={{ backgroundColor: C.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(91,79,233,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="shield" size={24} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', fontSize: 16, color: C.dark }}>🛡️ Mon équipe</Text>
            <Text style={{ color: C.gray, fontSize: 12, marginTop: 2 }}>
              {teammatesDetails.length} coéquipier{teammatesDetails.length > 1 ? 's' : ''} régulier{teammatesDetails.length > 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity 
            style={{ backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>+ AJOUTER</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab selector */}
      <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: C.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: C.border }}>
        <TouchableOpacity 
          style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: activeTab === 'teammates' ? C.primary : 'transparent' }}
          onPress={() => setActiveTab('teammates')}
        >
          <Text style={{ fontWeight: '800', fontSize: 12, color: activeTab === 'teammates' ? '#fff' : C.gray }}>
            🛡️ MES COÉQUIPIERS ({teammatesDetails.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: activeTab === 'friends' ? C.primary : 'transparent' }}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={{ fontWeight: '800', fontSize: 12, color: activeTab === 'friends' ? '#fff' : C.gray }}>
            👥 MES AMIS ({friends.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0 }}>
        {activeTab === 'teammates' ? (
          <>
            {teammatesDetails.length === 0 ? (
              <EmptyState 
                icon="shield-outline" 
                title="Aucun coéquipier régulier" 
                subtitle="Ajoute des amis comme coéquipiers pour créer rapidement des événements en équipe avec eux."
                cta="AJOUTER DES COÉQUIPIERS"
                onCta={() => setActiveTab('friends')}
              />
            ) : (
              <View style={{ gap: 10 }}>
                {teammatesDetails.map((t) => (
                  <View key={t.friendId} style={{ backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(91,79,233,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.primary }}>
                        <Text style={{ fontSize: 22 }}>{t.emoji || '👤'}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontWeight: '800', fontSize: 15, color: C.dark }}>{t.name}</Text>
                          <View style={{ backgroundColor: 'rgba(91,79,233,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
                            <Text style={{ color: C.primary, fontWeight: '800', fontSize: 9 }}>🛡️ COÉQUIPIER</Text>
                          </View>
                        </View>
                        <Text style={{ color: C.gray, fontSize: 12, marginTop: 2 }}>{t.pseudo}</Text>
                        {t.notes ? (
                          <Text style={{ color: C.light, fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>📝 {t.notes}</Text>
                        ) : null}
                      </View>
                    </View>

                    {/* Action buttons */}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                      <TouchableOpacity 
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.primary, borderRadius: 999, paddingVertical: 10 }}
                        onPress={() => handleQuickEvent(t)}
                      >
                        <Ionicons name="flash" size={14} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>CRÉER UN ÉVÉNEMENT</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.chip, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 }}
                        onPress={() => openEditModal(t)}
                      >
                        <Ionicons name="create-outline" size={14} color={C.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEE2E2', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 }}
                        onPress={() => handleToggleTeammate(t.friendId)}
                      >
                        <Ionicons name="shield-outline" size={14} color={C.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={[s.subLabel, { marginBottom: 12 }]}>
              Appuie sur 🛡️ pour ajouter un ami comme coéquipier régulier
            </Text>
            {friends.length === 0 ? (
              <EmptyState 
                icon="people-outline" 
                title="Aucun ami" 
                subtitle="Scanne un QR code depuis ton profil pour ajouter des amis."
                cta="VOIR MON PROFIL"
                onCta={() => go('profile')}
              />
            ) : (
              <View style={{ gap: 8 }}>
                {friends.map((f) => {
                  const isTeamm = teammates.some(t => t.friendId === f.id);
                  return (
                    <View key={f.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: isTeamm ? C.primary : C.border }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isTeamm ? 'rgba(91,79,233,0.15)' : C.chip, alignItems: 'center', justifyContent: 'center', borderWidth: isTeamm ? 2 : 0, borderColor: C.primary }}>
                        <Text style={{ fontSize: 20 }}>{f.emoji || '👤'}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontWeight: '700', fontSize: 14, color: C.dark }}>{f.name}</Text>
                        <Text style={{ color: C.gray, fontSize: 12 }}>{f.pseudo}</Text>
                        {isTeamm ? (
                          <Text style={{ color: C.primary, fontSize: 10, fontWeight: '700', marginTop: 2 }}>🛡️ Déjà coéquipier</Text>
                        ) : null}
                      </View>
                      <TouchableOpacity 
                        style={{ 
                          backgroundColor: isTeamm ? '#FEE2E2' : 'rgba(91,79,233,0.15)', 
                          paddingHorizontal: 12, 
                          paddingVertical: 8, 
                          borderRadius: 999,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4
                        }}
                        onPress={() => handleToggleTeammate(f.id)}
                      >
                        <Ionicons name={isTeamm ? "shield-outline" : "shield"} size={14} color={isTeamm ? C.danger : C.primary} />
                        <Text style={{ color: isTeamm ? C.danger : C.primary, fontWeight: '800', fontSize: 11 }}>
                          {isTeamm ? 'RETIRER' : 'AJOUTER'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Edit Notes Modal */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeaderRow}>
              <Text style={s.modalTitle}>📝 Notes sur {selectedTeammate?.name}</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={C.gray} />
              </TouchableOpacity>
            </View>
            <Text style={[s.subLabel, { marginBottom: 8 }]}>Ajoute des notes (position, niveau, disponibilités...)</Text>
            <TextInput
              style={[s.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Ex: Meneur de jeu, dispo mardi/soir, niveau confirmé..."
              placeholderTextColor={C.light}
              value={editNotes}
              onChangeText={setEditNotes}
              multiline
            />
            <TouchableOpacity style={s.submitBtn} onPress={handleSaveNotes}>
              <Text style={s.submitText}>ENREGISTRER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SportPracticeHistoryScreen({ go, goBack }) {
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState({ enableComments: true, enableLikes: true });
  const [showSettings, setShowSettings] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [showComments, setShowComments] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const h = await getPracticeHistory();
    setHistory(h);
    const s = await getPracticeHistorySettings();
    setSettings(s);
  };

  const handleLike = async (entryId) => {
    await togglePracticeLike(entryId);
    await loadData();
  };

  const handleComment = async (entryId) => {
    const text = commentInputs[entryId];
    if (!text || !text.trim()) return;
    await addPracticeComment(entryId, text.trim());
    setCommentInputs(prev => ({ ...prev, [entryId]: '' }));
    await loadData();
  };

  const toggleShowComments = (entryId) => {
    setShowComments(prev => ({ ...prev, [entryId]: !prev[entryId] }));
  };

  const confirmDeleteEntry = async () => {
    if (!deleteTarget) return;
    await deletePracticeEntry(deleteTarget.id);
    setDeleteTarget(null);
    await loadData();
  };

  const toggleSetting = async (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    await setPracticeHistorySettings(updated);
    setSettings(updated);
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const getSportEmoji = (sport) => {
    const found = ALL_SPORTS.find(s => s.key === sport);
    return found ? found.emoji : '🏃';
  };

  const getSportLabel = (sport) => {
    const found = ALL_SPORTS.find(s => s.key === sport);
    return found ? found.label : sport;
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header 
        title="Historique de pratique sportive" 
        onBack={goBack}
        right={
          <TouchableOpacity onPress={() => setShowSettings(!showSettings)} style={{ padding: 8 }}>
            <Ionicons name="settings-outline" size={22} color={C.primary} />
          </TouchableOpacity>
        }
      />

      {/* PANNEAU SETTINGS */}
      {showSettings ? (
        <View style={{ backgroundColor: C.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontWeight: '800', fontSize: 14, color: C.dark }}>⚙️ Paramètres sociaux</Text>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Ionicons name="close" size={20} color={C.gray} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="chatbubble-outline" size={18} color={settings.enableComments ? C.primary : C.light} />
              <Text style={{ fontWeight: '700', fontSize: 13, color: C.dark }}>Autoriser les commentaires</Text>
            </View>
            <TouchableOpacity 
              onPress={() => toggleSetting('enableComments')}
              style={{ 
                width: 48, 
                height: 28, 
                borderRadius: 14, 
                backgroundColor: settings.enableComments ? C.primary : C.border,
                justifyContent: 'center',
                paddingHorizontal: 2,
              }}
            >
              <View style={{ 
                width: 24, 
                height: 24, 
                borderRadius: 12, 
                backgroundColor: '#fff',
                alignSelf: settings.enableComments ? 'flex-end' : 'flex-start',
              }} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="heart-outline" size={18} color={settings.enableLikes ? '#EC4899' : C.light} />
              <Text style={{ fontWeight: '700', fontSize: 13, color: C.dark }}>Autoriser les likes</Text>
            </View>
            <TouchableOpacity 
              onPress={() => toggleSetting('enableLikes')}
              style={{ 
                width: 48, 
                height: 28, 
                borderRadius: 14, 
                backgroundColor: settings.enableLikes ? '#EC4899' : C.border,
                justifyContent: 'center',
                paddingHorizontal: 2,
              }}
            >
              <View style={{ 
                width: 24, 
                height: 24, 
                borderRadius: 12, 
                backgroundColor: '#fff',
                alignSelf: settings.enableLikes ? 'flex-end' : 'flex-start',
              }} />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0 }}>
        {history.length === 0 ? (
          <EmptyState 
            icon="fitness-outline" 
            title="Aucune pratique enregistrée" 
            subtitle="Commence une session de sport pour voir ton historique apparaître ici."
            cta="LANCER UNE SESSION"
            onCta={() => go('track')}
          />
        ) : (
          <View style={{ gap: 12 }}>
            <Text style={{ color: C.light, fontSize: 11, textAlign: 'center', marginBottom: -2 }}>
              Reste appuyé sur une séance pour la supprimer
            </Text>
            {history.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                activeOpacity={0.85}
                onLongPress={() => setDeleteTarget(entry)}
                delayLongPress={400}
                style={{ backgroundColor: C.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border }}
              >
                {/* Header de l'entrée */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(91,79,233,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 22 }}>{getSportEmoji(entry.sport)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontWeight: '800', fontSize: 15, color: C.dark }}>{getSportLabel(entry.sport)}</Text>
                    <Text style={{ color: C.gray, fontSize: 12, marginTop: 1 }}>{formatDate(entry.date)}</Text>
                  </View>
                  {entry.isRecord ? (
                    <View style={{ backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: '#22C55E' }}>
                      <Text style={{ color: '#15803D', fontWeight: '800', fontSize: 10 }}>🏆 RECORD</Text>
                    </View>
                  ) : null}
                </View>

                {/* Données de la session */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  {entry.distanceKm ? (
                    <View style={{ backgroundColor: C.chip, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: C.primary }}>{entry.distanceKm.toFixed(2)}</Text>
                      <Text style={{ fontSize: 9, color: C.gray, fontWeight: '700' }}>KM</Text>
                    </View>
                  ) : null}
                  {entry.duration ? (
                    <View style={{ backgroundColor: C.chip, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: C.primary }}>{entry.duration}</Text>
                      <Text style={{ fontSize: 9, color: C.gray, fontWeight: '700' }}>DURÉE</Text>
                    </View>
                  ) : null}
                  {entry.calories ? (
                    <View style={{ backgroundColor: C.chip, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: C.primary }}>{entry.calories}</Text>
                      <Text style={{ fontSize: 9, color: C.gray, fontWeight: '700' }}>KCAL</Text>
                    </View>
                  ) : null}
                  {entry.reps ? (
                    <View style={{ backgroundColor: C.chip, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: C.primary }}>{entry.reps}</Text>
                      <Text style={{ fontSize: 9, color: C.gray, fontWeight: '700' }}>RÉPÉTITIONS</Text>
                    </View>
                  ) : null}
                </View>

                {entry.notes ? (
                  <Text style={{ color: C.gray, fontSize: 12, fontStyle: 'italic', marginBottom: 10, lineHeight: 18 }}>
                    📝 {entry.notes}
                  </Text>
                ) : null}

                {/* Barre Like & Commentaires */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  {settings.enableLikes ? (
                    <TouchableOpacity 
                      onPress={() => handleLike(entry.id)}
                      style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        gap: 5,
                        backgroundColor: entry.likes?.userLiked ? '#FCE7F3' : C.chip, 
                        paddingHorizontal: 12, 
                        paddingVertical: 8, 
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: entry.likes?.userLiked ? '#EC4899' : C.border,
                        flex: 1,
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={entry.likes?.userLiked ? "heart" : "heart-outline"} size={16} color={entry.likes?.userLiked ? '#EC4899' : C.gray} />
                      <Text style={{ color: entry.likes?.userLiked ? '#EC4899' : C.dark, fontWeight: '700', fontSize: 12 }}>
                        {entry.likes?.count || 0}
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  {settings.enableComments ? (
                    <TouchableOpacity 
                      onPress={() => toggleShowComments(entry.id)}
                      style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        gap: 5,
                        backgroundColor: C.chip, 
                        paddingHorizontal: 12, 
                        paddingVertical: 8, 
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: C.border,
                        flex: 1,
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color={C.primary} />
                      <Text style={{ color: C.dark, fontWeight: '700', fontSize: 12 }}>
                        {(entry.comments?.length || 0) > 0 ? `${entry.comments.length} commentaire${entry.comments.length > 1 ? 's' : ''}` : 'Commenter'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Section commentaires */}
                {showComments[entry.id] && settings.enableComments ? (
                  <View style={{ marginTop: 12 }}>
                    {entry.comments && entry.comments.length > 0 ? (
                      <View style={{ gap: 8, marginBottom: 10 }}>
                        {entry.comments.map((c) => (
                          <View key={c.id} style={{ backgroundColor: C.chip, borderRadius: 12, padding: 10 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                              <Text style={{ fontWeight: '800', fontSize: 12, color: C.primary }}>{c.author}</Text>
                              <Text style={{ color: C.light, fontSize: 10 }}>{formatDate(c.date)}</Text>
                            </View>
                            <Text style={{ color: C.dark, fontSize: 12, lineHeight: 16 }}>{c.text}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={{ color: C.gray, fontSize: 12, textAlign: 'center', marginBottom: 10 }}>Aucun commentaire encore</Text>
                    )}

                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                      <TextInput
                        style={[s.input, { flex: 1, maxHeight: 60, paddingVertical: 10 }]}
                        placeholder="Écrire un commentaire..."
                        placeholderTextColor={C.light}
                        value={commentInputs[entry.id] || ''}
                        onChangeText={(text) => setCommentInputs(prev => ({ ...prev, [entry.id]: text }))}
                        multiline
                      />
                      <TouchableOpacity 
                        style={[s.joinBtn, !(commentInputs[entry.id] || '').trim() && { opacity: 0.4 }]} 
                        disabled={!(commentInputs[entry.id] || '').trim()}
                        onPress={() => handleComment(entry.id)}
                      >
                        <Ionicons name="send" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* MODALE DE CONFIRMATION DE SUPPRESSION */}
      <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 20 }}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Ionicons name="trash-outline" size={24} color={C.danger} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: C.dark, textAlign: 'center' }}>Supprimer cette séance ?</Text>
              {deleteTarget ? (
                <Text style={{ color: C.gray, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                  {getSportEmoji(deleteTarget.sport)} {getSportLabel(deleteTarget.sport)} · {formatDate(deleteTarget.date)}
                  {'\n'}Cette action est définitive.
                </Text>
              ) : null}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => setDeleteTarget(null)}
                style={{ flex: 1, backgroundColor: C.chip, borderRadius: 999, paddingVertical: 14, alignItems: 'center' }}
              >
                <Text style={{ color: C.dark, fontWeight: '800', fontSize: 13 }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDeleteEntry}
                style={{ flex: 1, backgroundColor: C.danger, borderRadius: 999, paddingVertical: 14, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>🗑️ Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ContactsScreen({ go, goBack }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title="Contacts" onBack={goBack} />
      <EmptyState icon="people-outline" title="Aucun contact" subtitle="Acceptez une proposition de run ou ajoutez un runner depuis son profil." cta="VOIR LES ÉVÉNEMENTS" onCta={() => go('match')} />
    </SafeAreaView>
  );
}

// ---------- ÉCRAN DE CONVERSATION MATCH ----------
function MatchChatScreen({ goBack, params }) {
  const request = params?.request;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [requestStatus, setRequestStatus] = useState(request?.status || 'pending');

  const [isBlockedUser, setIsBlockedUser] = useState(false);

  useEffect(() => {
    if (request?.id) {
      loadMessages();
      checkBlockStatus();
    }
  }, [request?.id]);

  const checkBlockStatus = async () => {
    const otherId = request.fromUserId === 'me' ? request.toUserId : request.fromUserId;
    const blocked = await isBlocked(otherId);
    setIsBlockedUser(blocked);
  };

  const loadMessages = async () => {
    const msgs = await getConversationMessages(request.id);
    setMessages(msgs);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (isBlockedUser) {
      alert("Vous avez bloqué cette personne. Impossible d'envoyer un message.");
      return;
    }
    const msg = {
      text: newMessage.trim(),
      author: 'Moi',
      fromMe: true,
    };
    await addMessageToConversation(request.id, msg);
    setNewMessage('');
    await loadMessages();
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  if (!request) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="Conversation" onBack={goBack} />
        <EmptyState icon="chatbubbles-outline" title="Conversation introuvable" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header
        title={request.toUserName || request.fromUserName}
        onBack={goBack}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {isBlockedUser ? (
              <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: C.danger }}>🚫 BLOQUÉ</Text>
              </View>
            ) : (
              <Text style={{ fontSize: 11, fontWeight: '800', color: requestStatus === 'accepted' ? '#22C55E' : '#F59E0B' }}>
                {requestStatus === 'accepted' ? '✓ Acceptée' : requestStatus === 'declined' ? '✗ Refusée' : '⏳ En attente'}
              </Text>
            )}
          </View>
        }
      />

      {/* Infos de la demande */}
      <View style={{ backgroundColor: C.chip, marginHorizontal: 16, borderRadius: 14, padding: 12, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 20 }}>{request.sportEmoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', fontSize: 13, color: C.dark }}>
              {request.sportLabel} · {request.mode === 'battle' ? '⚔️ Battle' : request.mode === 'date' ? '❤️ Date' : '💪 Entraînement'}
            </Text>
            <Text style={{ color: C.gray, fontSize: 12, marginTop: 2 }}>
              📅 {request.date} à {request.time}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8 }}>
        {/* Message initial de la demande */}
        {request.message ? (
          <View style={{ alignSelf: 'flex-start', backgroundColor: C.card, borderRadius: 16, padding: 12, marginBottom: 12, maxWidth: '80%', borderWidth: 1, borderColor: C.border }}>
            <Text style={{ color: C.gray, fontSize: 10, fontWeight: '700', marginBottom: 4 }}>📨 DEMANDE INITIALE</Text>
            <Text style={{ color: C.dark, fontSize: 13, lineHeight: 18 }}>{request.message}</Text>
            <Text style={{ color: C.light, fontSize: 10, marginTop: 4, textAlign: 'right' }}>{formatTime(request.createdAt)}</Text>
          </View>
        ) : null}

        {/* Messages échangés */}
        {messages.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="chatbubble-outline" size={40} color={C.light} />
            <Text style={{ color: C.gray, marginTop: 8 }}>Aucun message encore</Text>
            <Text style={{ color: C.light, fontSize: 12, marginTop: 4 }}>Commence la conversation !</Text>
          </View>
        ) : (
          messages.map(msg => (
            <View
              key={msg.id}
              style={{
                alignSelf: msg.fromMe ? 'flex-end' : 'flex-start',
                backgroundColor: msg.fromMe ? C.primary : C.card,
                borderRadius: 16,
                padding: 12,
                marginBottom: 8,
                maxWidth: '80%',
                borderWidth: msg.fromMe ? 0 : 1,
                borderColor: C.border,
              }}
            >
              <Text style={{ color: msg.fromMe ? '#fff' : C.dark, fontSize: 13, lineHeight: 18 }}>{msg.text}</Text>
              <Text style={{ color: msg.fromMe ? 'rgba(255,255,255,0.7)' : C.light, fontSize: 10, marginTop: 4, textAlign: 'right' }}>
                {formatTime(msg.timestamp)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Input message */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.card }}>
        {isBlockedUser ? (
          <View style={{ flex: 1, backgroundColor: '#FEE2E2', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' }}>
            <Text style={{ color: C.danger, fontWeight: '700', fontSize: 13 }}>🚫 Conversation bloquée</Text>
          </View>
        ) : (
          <>
            <TextInput
              style={{ flex: 1, backgroundColor: C.chip, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, maxHeight: 100 }}
              placeholder="Écrire un message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
            <TouchableOpacity
              style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: newMessage.trim() ? C.primary : C.border, alignItems: 'center', justifyContent: 'center' }}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Ionicons name="send" size={18} color={newMessage.trim() ? '#fff' : C.light} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function ChatsScreen({ go, goBack }) {
  const linkedEvent = EVENTS.find((e) => e.id === 'e2'); // "Rencontre de rugby 2"
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={s.brandRow}>
        <Text style={s.brand}>
          NUTRI <Text style={{ color: C.primary }}>• SPORT</Text>
        </Text>
      </View>
      <Text style={{ fontSize: 32, fontWeight: '900', paddingHorizontal: 16, marginBottom: 16 }}>CHATS</Text>
      <View style={{ paddingHorizontal: 16 }}>
        <TouchableOpacity style={s.chatCard} onPress={() => go('chatDetail', { event: linkedEvent })}>
          <Grad colors={C.gradOrangePink} style={s.chatAvatar}>
            <Ionicons name="flash" size={20} color="#fff" />
          </Grad>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800' }}>Rencontre de rugby 2</Text>
            <Text style={{ color: C.gray, fontSize: 13 }}>Aucun message</Text>
          </View>
          <Text style={{ color: C.light, fontSize: 12 }}>07 juil.</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ChatDetailScreen({ goBack, params }) {
  const event = params?.event;
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title={event ? event.title : 'Chat'} onBack={goBack} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {event ? (
          <>
            <View style={s.chatDetailHeader}>
              <View style={s.eventListIcon}>
                <Text style={{ fontSize: 22 }}>{event.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.eventListTitle}>{event.title}</Text>
                <Text style={s.eventListHost}>
                  Hôte: {event.host} · {event.date}
                </Text>
              </View>
            </View>

            <EventDirectionsCard event={event} />

            <Text style={[s.subLabel, { marginTop: 20 }]}>MESSAGES</Text>
            <View style={s.emptyChatBox}>
              <Ionicons name="chatbubbles-outline" size={32} color={C.light} />
              <Text style={{ color: C.gray, fontSize: 13, marginTop: 8 }}>Aucun message pour le moment. Sois le premier à écrire au groupe !</Text>
            </View>
          </>
        ) : (
          <EmptyState icon="chatbubbles-outline" title="Conversation introuvable" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Décale de façon déterministe la coordonnée d'un terrain autour du centre de sa ville
// (toujours le même résultat pour un même nom). Sans service de géocodage, on ne connaît
// que la position de la ville — ce helper évite que tous les terrains d'une même ville
// affichent exactement la même distance jusqu'à l'utilisateur.
function seededVenueCoords(name, cityCoords, radiusKm = 5) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const angle = (hash % 360) * (Math.PI / 180);
  const fraction = ((hash >> 9) % 100) / 100; // 0 → au centre-ville, 1 → en périphérie
  const dist = fraction * radiusKm;
  const [lat, lon] = cityCoords;
  const dLat = (dist * Math.cos(angle)) / 111;
  const dLon = (dist * Math.sin(angle)) / (111 * Math.cos((lat * Math.PI) / 180));
  return [lat + dLat, lon + dLon];
}

function VenuesScreen({ go, goBack }) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [locStatus, setLocStatus] = useState('loading'); // 'loading' | 'granted' | 'denied'

  // Récupère la position GPS de l'utilisateur au chargement de l'écran, pour pouvoir
  // trier les terrains publics du plus proche au plus loin.
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocStatus('denied');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setUserCoords(loc.coords);
        setLocStatus('granted');
      } catch (e) {
        setLocStatus('denied');
      }
    })();
  }, []);

  const normalizedQuery = normalizeDishKey(query);

  // Mêmes suggestions (autocomplétion) que dans le champ "Lieu" de Nouvel événement
  const suggestions =
    showSuggestions && normalizedQuery.length >= 1
      ? FRENCH_STADIUMS.filter((st) => normalizeDishKey(`${st.name} ${st.city}`).includes(normalizedQuery)).slice(0, 8)
      : [];

  // Liste filtrée par la recherche (terrains publics uniquement), avec la distance
  // jusqu'à l'utilisateur calculée à partir des coordonnées approximatives de la ville.
  const baseList =
    normalizedQuery.length >= 1
      ? FRENCH_STADIUMS.filter((st) => normalizeDishKey(`${st.name} ${st.city}`).includes(normalizedQuery))
      : FRENCH_STADIUMS;

  const withDistance = baseList.map((st) => {
    const cityCoords = CITY_COORDS[st.city];
    const venueCoords = cityCoords ? seededVenueCoords(st.name, cityCoords) : null;
    const distanceKm =
      userCoords && venueCoords ? haversineKm(userCoords.latitude, userCoords.longitude, venueCoords[0], venueCoords[1]) : null;
    return { ...st, distanceKm };
  });

  // Les plus proches en premier. Les terrains sans distance connue (position GPS pas
  // encore disponible) restent dans l'ordre d'origine, en fin de liste.
  const filteredVenues = [...withDistance].sort((a, b) => {
    if (a.distanceKm == null && b.distanceKm == null) return 0;
    if (a.distanceKm == null) return 1;
    if (b.distanceKm == null) return -1;
    return a.distanceKm - b.distanceKm;
  });

  const pickSuggestion = (st) => {
    setQuery(st.name);
    setShowSuggestions(false);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title="Trouver un terrain" onBack={goBack} />
      <Banner icon="🏢" eyebrow="TERRAINS PUBLICS" title={`${FRENCH_STADIUMS.length} lieux disponibles`} />
      <Text style={{ color: C.light, fontSize: 11, paddingHorizontal: 16, marginTop: -8, marginBottom: 12, lineHeight: 15 }}>
        Les distances (~) sont estimées à partir de la ville du terrain — ouvre l'itinéraire GPS pour la distance exacte jusqu'à l'adresse précise.
      </Text>

      <View style={{ paddingHorizontal: 16 }}>
        <TextInput
          style={s.input}
          placeholder="Rechercher un terrain, une ville..."
          value={query}
          onChangeText={(v) => {
            setQuery(v);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholderTextColor={C.light}
        />
        {suggestions.length > 0 ? (
          <View style={s.suggestionsBox}>
            {suggestions.map((st) => (
              <TouchableOpacity key={`sugg-${st.name}-${st.city}`} style={s.suggestionRow} onPress={() => pickSuggestion(st)}>
                <Ionicons name="football-outline" size={16} color={C.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={s.suggestionName}>{st.name}</Text>
                  <Text style={s.suggestionCity}>{st.city}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {locStatus === 'denied' ? (
          <Text style={{ color: C.light, fontSize: 11, marginTop: 8, lineHeight: 16 }}>
            Active la localisation pour voir les terrains les plus proches de toi en premier.
          </Text>
        ) : null}
      </View>

      <FlatList
        data={filteredVenues}
        keyExtractor={(i) => `${i.name}-${i.city}`}
        contentContainerStyle={{ padding: 16, paddingTop: 12 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState icon="business-outline" title="Aucun terrain trouvé" subtitle="Essaie une autre recherche." />
        }
        renderItem={({ item }) => (
          <View style={s.venueCard}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={s.venueTitle}>{item.name}</Text>
                <Text style={{ color: C.gray, fontSize: 12 }}>TERRAIN PUBLIC</Text>
              </View>
              {item.distanceKm != null ? (
                <View style={s.venueDistanceBadge}>
                  <Ionicons name="navigate-circle-outline" size={12} color={C.primary} />
                  <Text style={s.venueDistanceText}>
                    {item.distanceKm < 1 ? `~${Math.round(item.distanceKm * 1000)} m` : `~${item.distanceKm.toFixed(1)} km`}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={{ color: C.gray, fontSize: 13, marginTop: 8 }}>📍 {item.name}, {item.city}</Text>
            <TouchableOpacity style={s.bookBtn} onPress={() => openDirectionsToAddress(`${item.name}, ${item.city}`)}>
              <Ionicons name="navigate" size={14} color="#fff" />
              <Text style={s.bookText}>  OUVRIR L’ITINÉRAIRE GPS</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function TeamsScreen({ go, goBack }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title="Mes équipes" onBack={goBack} />
      <Banner icon="🛡️" eyebrow="ÉQUIPES SPORTMATCH" title="0 équipe" />
      <EmptyState icon="shield-outline" title="Aucune équipe" subtitle="Crée un événement en mode ÉQUIPE pour en former une." cta="+ CRÉER UN ÉVÉNEMENT" onCta={() => go('newEvent')} />
    </SafeAreaView>
  );
}

function PartnersScreen({ go, goBack }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title="Partenaires" onBack={goBack} />
      <Banner icon="🏆" eyebrow="VOS POINTS" title="0" />
      <FlatList
        data={PARTNERS}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        renderItem={({ item }) => (
          <View style={s.venueCard}>
            <View style={s.catBadge}>
              <Text style={{ color: C.primary, fontWeight: '800', fontSize: 10 }}>{item.cat}</Text>
            </View>
            <Text style={s.venueTitle}>{item.name}</Text>
            <Text style={{ color: C.gray, fontSize: 13 }}>📍 {item.addr}</Text>
            <Text style={{ marginTop: 6 }}>🎁 {item.offer}</Text>
            <TouchableOpacity style={s.bookBtn}>
              <Text style={s.bookText}>📍 VALIDER MA VISITE</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function LeaderboardScreen({ go, goBack }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title="Meilleurs points" onBack={goBack} />
      <Banner icon="🏆" eyebrow="CLASSEMENT HEBDO" title="Top 3 = +100 / +50 / +25 XP" colors={['#FF7A45', '#9B5CF6']} />
      <EmptyState icon="film-outline" title="Classement vide" subtitle="Sois le premier à publier un highlight !" cta="+ PUBLIER MON HIGHLIGHT" />
    </SafeAreaView>
  );
}

function ChallengesScreen({ go, goBack }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title="Défis entre amis" onBack={goBack} />
      <Banner icon="⚔️" eyebrow="RELÈVE LE DÉFI" title="Bats les records de tes amis" subtitle="7 jours pour répondre." colors={['#FF7A45', '#9B5CF6']} />
      <EmptyState icon="mail-open-outline" title="Aucun défi reçu" subtitle="Quand un ami te défiera, il apparaîtra ici." cta="VOIR MON PROFIL" onCta={() => go('profile')} />
    </SafeAreaView>
  );
}

function ProfileScreen({ go, goBack, profilePhoto, setProfilePhoto }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [pseudoInput, setPseudoInput] = useState('');
    const [teammatesDetails, setTeammatesDetails] = useState([]);
  const [subStatus, setSubStatus] = useState({ isPremium: false, eventsCreated: 0, remaining: 3 });
  const [blockedList, setBlockedList] = useState([]);

  const links = [
    { key: 'contacts', label: 'Contacts', icon: 'people-outline' },
    { key: 'venues', label: 'Terrains', icon: 'business-outline' },
    { key: 'chats', label: 'Chats', icon: 'chatbubbles-outline' },
    { key: 'teams', label: 'Équipes', icon: 'shield-outline' },
    { key: 'teammates', label: 'Coéquipiers', icon: 'shield' },
    { key: 'partners', label: 'Partenaires', icon: 'gift-outline' },
    { key: 'leaderboard', label: 'Classement', icon: 'trophy-outline' },
    { key: 'challenges', label: 'Défis', icon: 'flash-outline' },
  ];

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
      setNameInput(user.name || '');
      setPseudoInput(user.pseudo || '');
      const f = await getFriendsList();
      setFriends(f);
      const t = await getTeammatesWithDetails();
      setTeammatesDetails(t);
      const sub = await getSubscriptionStatus();
      const can = await canCreateEvent();
      setSubStatus({ ...sub, remaining: can.remaining });
      const blocked = await getBlockedList();
      setBlockedList(blocked);
    })();
  }, []);

  const pickPhoto = async (fromCamera) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      alert('Permission caméra/galerie refusée.');
      setPickerOpen(false);
      return;
    }
    const options = { quality: 0.6, allowsEditing: true, aspect: [1, 1], mediaTypes: ImagePicker.MediaTypeOptions.Images };
    const res = fromCamera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    setPickerOpen(false);
    if (res.canceled) return;
    const uri = res.assets[0].uri;
    setProfilePhoto(uri);
    try {
      await AsyncStorage.setItem('profile_photo_uri', uri);
    } catch (e) {}
  };

  const removePhoto = async () => {
    setProfilePhoto(null);
    setPickerOpen(false);
    try {
      await AsyncStorage.removeItem('profile_photo_uri');
    } catch (e) {}
  };

  const saveProfile = async () => {
    const updated = { ...currentUser, name: nameInput, pseudo: pseudoInput };
    setCurrentUser(updated);
    await saveCurrentUser(updated);
    setEditProfile(false);
  };

  const userId = currentUser ? generateUserId(currentUser.email || currentUser.pseudo || 'default') : 'user_default';

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView>
        <Grad colors={C.gradPurple} style={s.profileHero}>
          <TouchableOpacity onPress={() => setPickerOpen(true)} activeOpacity={0.85}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={s.profileAvatarImg} />
            ) : (
              <View style={s.profileAvatar}>
                <Ionicons name="person" size={36} color="#fff" />
              </View>
            )}
            <View style={s.avatarEditBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          {editProfile ? (
            <View style={{ width: '80%', marginTop: 10 }}>
              <TextInput 
                style={[s.input, { backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', borderColor: 'transparent' }]} 
                value={nameInput} 
                onChangeText={setNameInput} 
                placeholder="Ton nom" 
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <TextInput 
                style={[s.input, { backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', borderColor: 'transparent', marginTop: 8 }]} 
                value={pseudoInput} 
                onChangeText={setPseudoInput} 
                placeholder="@pseudo" 
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <TouchableOpacity onPress={saveProfile} style={{ marginTop: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '800', textAlign: 'center' }}>✓ ENREGISTRER</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={{ color: '#fff', fontWeight: '700', marginTop: 10, fontSize: 16 }}>{currentUser?.name || 'Runner'}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{currentUser?.pseudo || '@runner'}</Text>
              <TouchableOpacity onPress={() => setEditProfile(true)} style={{ marginTop: 6 }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>✏️ Modifier le profil</Text>
              </TouchableOpacity>
            </>
          )}
        </Grad>

        {pickerOpen ? (
          <View style={s.avatarPickerBox}>
            <TouchableOpacity style={s.avatarPickerRow} onPress={() => pickPhoto(true)}>
              <Ionicons name="camera-outline" size={18} color={C.primary} />
              <Text style={s.avatarPickerText}>Prendre une photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.avatarPickerRow} onPress={() => pickPhoto(false)}>
              <Ionicons name="images-outline" size={18} color={C.primary} />
              <Text style={s.avatarPickerText}>Depuis la galerie</Text>
            </TouchableOpacity>
            {profilePhoto ? (
              <TouchableOpacity style={s.avatarPickerRow} onPress={removePhoto}>
                <Ionicons name="trash-outline" size={18} color={C.danger} />
                <Text style={[s.avatarPickerText, { color: C.danger }]}>Supprimer la photo</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 8 }} onPress={() => setPickerOpen(false)}>
              <Text style={{ color: C.gray, fontSize: 12 }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* QR CODE & AMIS */}
        <View style={{ padding: 16 }}>
          <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 16, marginBottom: 16 }}>
                        {/* COÉQUIPIERS RÉGULIERS — ACCÈS RAPIDE */}
            {teammatesDetails.length > 0 ? (
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ fontWeight: '800', fontSize: 14 }}>🛡️ COÉQUIPIERS ({teammatesDetails.length})</Text>
                  <TouchableOpacity onPress={() => go('teammates')}>
                    <Text style={{ color: C.primary, fontWeight: '800', fontSize: 11 }}>VOIR TOUT ›</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {teammatesDetails.map((t) => (
                    <TouchableOpacity 
                      key={t.friendId} 
                      style={{ alignItems: 'center', marginRight: 14 }}
                      onPress={() => go('teammates')}
                    >
                      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(91,79,233,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.primary }}>
                        <Text style={{ fontSize: 24 }}>{t.emoji || '👤'}</Text>
                      </View>
                      <Text style={{ fontWeight: '700', fontSize: 11, color: C.dark, marginTop: 6, maxWidth: 60, textAlign: 'center' }} numberOfLines={1}>{t.name}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity 
                    style={{ alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 26, backgroundColor: C.chip, borderWidth: 2, borderStyle: 'dashed', borderColor: C.primary }}
                    onPress={() => go('teammates')}
                  >
                    <Ionicons name="add" size={20} color={C.primary} />
                  </TouchableOpacity>
                </ScrollView>
              </View>
            ) : null}

<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontWeight: '800', fontSize: 14 }}>👥 MES AMIS ({friends.length})</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity 
                  style={{ backgroundColor: C.chip, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}
                  onPress={() => setShowQR(!showQR)}
                >
                  <Ionicons name="qr-code" size={16} color={C.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ backgroundColor: C.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}
                  onPress={() => go('qrScan')}
                >
                  <Ionicons name="scan" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {showQR ? (
              <View style={{ alignItems: 'center', paddingVertical: 16, backgroundColor: '#F8F9FB', borderRadius: 16 }}>
                <Text style={{ fontWeight: '800', marginBottom: 12 }}>Scanne mon QR Code</Text>
                <VisualQRCode userId={userId} size={140} />
                <Text style={{ color: C.gray, fontSize: 11, marginTop: 8 }}>ID: {userId}</Text>
                <Text style={{ color: C.light, fontSize: 10, marginTop: 4 }}>Montre ce code à un ami pour l'ajouter</Text>
              </View>
            ) : null}

            {friends.length === 0 ? (
              <Text style={{ color: C.gray, fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>
                Aucun ami encore. Scanne le QR code d'un runner pour l'ajouter !
              </Text>
            ) : (
              <View style={{ gap: 8 }}>
                {friends.map((f) => (
                  <View key={f.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.chip, borderRadius: 12, padding: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 16 }}>{f.emoji || '👤'}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ fontWeight: '700', fontSize: 13 }}>{f.name}</Text>
                      <Text style={{ color: C.gray, fontSize: 11 }}>{f.pseudo}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TouchableOpacity 
                        onPress={async () => {
                          if (confirm(`Bloquer ${f.name} ? Vous ne pourrez plus lui envoyer de records ni recevoir les siens.`)) {
                            await blockFriend(f.id);
                            setFriends(await getFriendsList());
                            setBlockedList(await getBlockedList());
                            alert(`${f.name} a été bloqué.`);
                          }
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="shield-half" size={18} color={C.danger} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={async () => {
                          if (confirm(`Supprimer ${f.name} de vos amis ?`)) {
                            const updated = await removeFriend(f.id);
                            setFriends(updated);
                          }
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close-circle" size={20} color={C.light} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* AMIS BLOQUÉS */}
          {blockedList.length > 0 ? (
            <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontWeight: '800', fontSize: 14 }}>🚫 BLOQUÉS ({blockedList.length})</Text>
              </View>
              <View style={{ gap: 8 }}>
                {blockedList.map((b) => (
                  <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#FCA5A5' }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="shield-half" size={16} color="#fff" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ fontWeight: '700', fontSize: 13, color: C.danger }}>Utilisateur #{b.id.slice(-6)}</Text>
                      <Text style={{ color: C.gray, fontSize: 11 }}>Bloqué le {new Date(b.blockedAt).toLocaleDateString('fr-FR')}</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={async () => {
                        if (confirm('Débloquer cette personne ?')) {
                          const updated = await unblockFriend(b.id);
                          setBlockedList(updated);
                          alert('Personne débloquée.');
                        }
                      }}
                      style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}
                    >
                      <Text style={{ color: '#15803D', fontWeight: '800', fontSize: 11 }}>DÉBLOQUER</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* BADGE PREMIUM */}
          <View style={{ backgroundColor: subStatus?.isPremium ? 'rgba(34,197,94,0.1)' : C.chip, borderRadius: 12, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: subStatus?.isPremium ? '#22C55E' : C.border }}>
            <Ionicons name={subStatus?.isPremium ? "diamond" : "diamond-outline"} size={20} color={subStatus?.isPremium ? '#22C55E' : C.gray} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', fontSize: 13, color: subStatus?.isPremium ? '#22C55E' : C.dark }}>
                {subStatus?.isPremium ? '💎 ABONNEMENT PREMIUM ACTIF' : 'Version gratuite'}
              </Text>
              <Text style={{ color: C.gray, fontSize: 11, marginTop: 2 }}>
                {subStatus?.isPremium ? 'Événements illimités + filtres avancés' : `${subStatus?.remaining || 3} événement${(subStatus?.remaining || 3) > 1 ? 's' : ''} restant${(subStatus?.remaining || 3) > 1 ? 's' : ''}`}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => subStatus?.isPremium ? cancelPremium().then(s => setSubStatus(s)) : go('newEvent')}
              style={{ backgroundColor: subStatus?.isPremium ? '#FEE2E2' : C.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}
            >
              <Text style={{ color: subStatus?.isPremium ? C.danger : '#fff', fontWeight: '800', fontSize: 11 }}>
                {subStatus?.isPremium ? 'RÉSILIER' : 'PASSER PREMIUM'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={s.statsBar}>
            {[
              ['11', 'ACTIVITÉS'],
              ['0.2', 'KM'],
              ['23', 'KCAL'],
              ['0.1', 'HEURES'],
            ].map(([v, l]) => (
              <View key={l} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '900' }}>{v}</Text>
                <Text style={{ fontSize: 10, color: C.gray, fontWeight: '700' }}>{l}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {links.map((l) => (
              <TouchableOpacity key={l.key} style={s.hubItem} onPress={() => go(l.key)}>
                <Ionicons name={l.icon} size={20} color={C.primary} />
                <Text style={{ fontSize: 11, fontWeight: '700', marginTop: 6 }}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- QR SCAN SCREEN ----------
function QRScanScreen({ go, goBack }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      const f = await getFriendsList();
      setFriends(f);
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    setScanned(true);

    try {
      // Parse le QR code (format attendu: JSON avec id, name, pseudo, emoji)
      let friendData;
      try {
        friendData = JSON.parse(data);
      } catch (e) {
        // Si ce n'est pas du JSON, traite comme un ID simple
        friendData = { id: data, name: 'Runner', pseudo: data, emoji: '🏃' };
      }

      setScannedData(friendData);

      // Vérifie si déjà ami
      if (friends.find(f => f.id === friendData.id)) {
        return;
      }

      // Ajoute l'ami
      const updated = await addFriend(friendData);
      setFriends(updated);
    } catch (e) {
      setScannedData({ error: true, message: 'QR Code invalide' });
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B14', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={C.primary} size="large" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Demande de permission caméra...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B14', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Ionicons name="camera-outline" size={64} color={C.primary} />
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 16, textAlign: 'center' }}>Caméra requise</Text>
        <Text style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 8 }}>
          Autorise l'accès à la caméra pour scanner les QR codes de tes amis.
        </Text>
        <TouchableOpacity onPress={() => Camera.requestCameraPermissionsAsync()} style={{ marginTop: 24 }}>
          <Grad colors={C.gradOrangePink} style={[s.startBtn, { paddingHorizontal: 32 }]}>
            <Text style={s.startText}>📷 AUTORISER</Text>
          </Grad>
        </TouchableOpacity>
        <TouchableOpacity onPress={goBack} style={{ marginTop: 16 }}>
          <Text style={{ color: C.light, fontSize: 14 }}>← Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B14' }}>
      <Header title="Scanner un ami" onBack={goBack} />

      <View style={{ flex: 1, margin: 16, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: C.primary }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        {/* Overlay de scan */}
        <View style={{ position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center' }} pointerEvents="none">
          <View style={{ width: 200, height: 200, borderWidth: 2, borderColor: 'rgba(91,79,233,0.8)', borderRadius: 20, borderStyle: 'dashed' }} />
          <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: 16, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 }}>
            Place le QR code dans le cadre
          </Text>
        </View>
      </View>

      {scanned && scannedData ? (
        <View style={{ backgroundColor: C.card, margin: 16, borderRadius: 20, padding: 20, marginTop: 0 }}>
          {scannedData.error ? (
            <>
              <Ionicons name="warning-outline" size={40} color={C.danger} style={{ alignSelf: 'center' }} />
              <Text style={{ textAlign: 'center', fontWeight: '800', marginTop: 8, color: C.danger }}>{scannedData.message}</Text>
            </>
          ) : (
            <>
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 28 }}>{scannedData.emoji || '👤'}</Text>
                </View>
                <Text style={{ fontWeight: '800', fontSize: 18, marginTop: 8 }}>{scannedData.name}</Text>
                <Text style={{ color: C.gray }}>{scannedData.pseudo}</Text>
              </View>

              {friends.find(f => f.id === scannedData.id) ? (
                <View style={{ backgroundColor: '#DCFCE7', borderRadius: 12, padding: 12, marginTop: 12, alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle" size={20} color="#15803D" />
                  <Text style={{ color: '#15803D', fontWeight: '700', marginTop: 4 }}>Déjà dans tes amis !</Text>
                </View>
              ) : (
                <View style={{ backgroundColor: '#DCFCE7', borderRadius: 12, padding: 12, marginTop: 12, alignItems: 'center' }}>
                  <Ionicons name="person-add" size={20} color="#15803D" />
                  <Text style={{ color: '#15803D', fontWeight: '700', marginTop: 4 }}>Ami ajouté avec succès !</Text>
                </View>
              )}
            </>
          )}

          <TouchableOpacity 
            style={[s.submitBtn, { marginTop: 16 }]} 
            onPress={() => { setScanned(false); setScannedData(null); }}
          >
            <Text style={s.submitText}>SCANNER UN AUTRE</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// ---------- NUTRITION IA ----------
// ---------- UTILITAIRE NUTRITION ----------
function todayKey() {
  const d = new Date();
  return `nutrition_log_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

// ---------- BASE DE DONNÉES NUTRITIONNELLE ----------
const FOOD_DATABASE = [
  { dish: "Boeuf bourguignon", kcal: 280, protein_g: 22, carbs_g: 8, fat_g: 18, portion_g: 200, category: "français" },
  { dish: "Blanquette de veau", kcal: 260, protein_g: 24, carbs_g: 6, fat_g: 16, portion_g: 200, category: "français" },
  { dish: "Cassoulet", kcal: 320, protein_g: 18, carbs_g: 28, fat_g: 16, portion_g: 200, category: "français" },
  { dish: "Choucroute garnie", kcal: 340, protein_g: 20, carbs_g: 12, fat_g: 24, portion_g: 200, category: "français" },
  { dish: "Coq au vin", kcal: 250, protein_g: 26, carbs_g: 5, fat_g: 14, portion_g: 200, category: "français" },
  { dish: "Confit de canard", kcal: 380, protein_g: 28, carbs_g: 0, fat_g: 30, portion_g: 150, category: "français" },
  { dish: "Couscous", kcal: 290, protein_g: 12, carbs_g: 38, fat_g: 10, portion_g: 250, category: "français" },
  { dish: "Gratin dauphinois", kcal: 310, protein_g: 12, carbs_g: 22, fat_g: 20, portion_g: 200, category: "français" },
  { dish: "Hachis Parmentier", kcal: 270, protein_g: 18, carbs_g: 20, fat_g: 14, portion_g: 200, category: "français" },
  { dish: "Magret de canard", kcal: 340, protein_g: 30, carbs_g: 0, fat_g: 24, portion_g: 150, category: "français" },
  { dish: "Moules marinières", kcal: 180, protein_g: 18, carbs_g: 8, fat_g: 8, portion_g: 250, category: "français" },
  { dish: "Poulet rôti", kcal: 240, protein_g: 28, carbs_g: 0, fat_g: 14, portion_g: 150, category: "français" },
  { dish: "Quiche lorraine", kcal: 350, protein_g: 14, carbs_g: 18, fat_g: 26, portion_g: 150, category: "français" },
  { dish: "Ratatouille", kcal: 90, protein_g: 3, carbs_g: 12, fat_g: 5, portion_g: 200, category: "français" },
  { dish: "Steak frites", kcal: 520, protein_g: 28, carbs_g: 35, fat_g: 30, portion_g: 300, category: "français" },
  { dish: "Tartiflette", kcal: 420, protein_g: 18, carbs_g: 20, fat_g: 30, portion_g: 200, category: "français" },
  { dish: "Bolognaise", kcal: 320, protein_g: 18, carbs_g: 30, fat_g: 16, portion_g: 250, category: "italien" },
  { dish: "Carbonara", kcal: 450, protein_g: 20, carbs_g: 35, fat_g: 26, portion_g: 250, category: "italien" },
  { dish: "Lasagnes", kcal: 380, protein_g: 22, carbs_g: 28, fat_g: 20, portion_g: 250, category: "italien" },
  { dish: "Pizza margherita", kcal: 260, protein_g: 12, carbs_g: 32, fat_g: 10, portion_g: 200, category: "italien" },
  { dish: "Pizza 4 fromages", kcal: 320, protein_g: 16, carbs_g: 30, fat_g: 18, portion_g: 200, category: "italien" },
  { dish: "Risotto", kcal: 280, protein_g: 8, carbs_g: 40, fat_g: 10, portion_g: 200, category: "italien" },
  { dish: "Pad thaï", kcal: 340, protein_g: 14, carbs_g: 38, fat_g: 16, portion_g: 250, category: "asiatique" },
  { dish: "Ramen", kcal: 380, protein_g: 18, carbs_g: 42, fat_g: 14, portion_g: 300, category: "asiatique" },
  { dish: "Sushi (6 pièces)", kcal: 220, protein_g: 8, carbs_g: 38, fat_g: 2, portion_g: 150, category: "asiatique" },
  { dish: "Sashimi (6 pièces)", kcal: 180, protein_g: 24, carbs_g: 2, fat_g: 8, portion_g: 120, category: "asiatique" },
  { dish: "Curry vert", kcal: 310, protein_g: 16, carbs_g: 14, fat_g: 22, portion_g: 250, category: "asiatique" },
  { dish: "Nems (4 pièces)", kcal: 280, protein_g: 10, carbs_g: 22, fat_g: 18, portion_g: 150, category: "asiatique" },
  { dish: "Buddha bowl", kcal: 340, protein_g: 14, carbs_g: 38, fat_g: 16, portion_g: 300, category: "végétarien" },
  { dish: "Chili sin carne", kcal: 260, protein_g: 14, carbs_g: 32, fat_g: 10, portion_g: 250, category: "végétarien" },
  { dish: "Curry de légumes", kcal: 220, protein_g: 6, carbs_g: 22, fat_g: 14, portion_g: 250, category: "végétarien" },
  { dish: "Falafels (4 pièces)", kcal: 280, protein_g: 12, carbs_g: 26, fat_g: 16, portion_g: 150, category: "végétarien" },
  { dish: "Houmous", kcal: 180, protein_g: 6, carbs_g: 14, fat_g: 12, portion_g: 100, category: "végétarien" },
  { dish: "Lentilles corail", kcal: 180, protein_g: 12, carbs_g: 24, fat_g: 4, portion_g: 200, category: "végétarien" },
  { dish: "Risotto aux champignons", kcal: 260, protein_g: 8, carbs_g: 36, fat_g: 10, portion_g: 200, category: "végétarien" },
  { dish: "Salade César", kcal: 320, protein_g: 18, carbs_g: 10, fat_g: 24, portion_g: 250, category: "végétarien" },
  { dish: "Taboulé", kcal: 180, protein_g: 4, carbs_g: 22, fat_g: 10, portion_g: 200, category: "végétarien" },
  { dish: "Tofu sauté", kcal: 200, protein_g: 16, carbs_g: 8, fat_g: 14, portion_g: 150, category: "végétarien" },
  { dish: "Poulet grillé", kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, portion_g: 100, category: "protéine" },
  { dish: "Saumon grillé", kcal: 208, protein_g: 20, carbs_g: 0, fat_g: 13, portion_g: 100, category: "protéine" },
  { dish: "Thon au naturel", kcal: 116, protein_g: 26, carbs_g: 0, fat_g: 1, portion_g: 100, category: "protéine" },
  { dish: "Oeufs brouillés", kcal: 180, protein_g: 14, carbs_g: 2, fat_g: 14, portion_g: 150, category: "protéine" },
  { dish: "Steak haché 5%", kcal: 140, protein_g: 22, carbs_g: 0, fat_g: 5, portion_g: 100, category: "protéine" },
  { dish: "Steak haché 15%", kcal: 220, protein_g: 20, carbs_g: 0, fat_g: 15, portion_g: 100, category: "protéine" },
  { dish: "Riz blanc cuit", kcal: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, portion_g: 100, category: "accompagnement" },
  { dish: "Riz complet cuit", kcal: 112, protein_g: 2.6, carbs_g: 23, fat_g: 0.9, portion_g: 100, category: "accompagnement" },
  { dish: "Pâtes cuites", kcal: 131, protein_g: 5, carbs_g: 25, fat_g: 1.1, portion_g: 100, category: "accompagnement" },
  { dish: "Pommes de terre cuites", kcal: 87, protein_g: 1.9, carbs_g: 20, fat_g: 0.1, portion_g: 100, category: "accompagnement" },
  { dish: "Purée de pommes de terre", kcal: 110, protein_g: 2, carbs_g: 16, fat_g: 4, portion_g: 100, category: "accompagnement" },
  { dish: "Quinoa cuit", kcal: 120, protein_g: 4.4, carbs_g: 21, fat_g: 1.9, portion_g: 100, category: "accompagnement" },
  { dish: "Lentilles cuites", kcal: 116, protein_g: 9, carbs_g: 20, fat_g: 0.4, portion_g: 100, category: "accompagnement" },
  { dish: "Haricots verts", kcal: 31, protein_g: 1.8, carbs_g: 7, fat_g: 0.1, portion_g: 100, category: "accompagnement" },
  { dish: "Brocolis cuits", kcal: 35, protein_g: 2.4, carbs_g: 7, fat_g: 0.4, portion_g: 100, category: "accompagnement" },
  { dish: "Carottes cuites", kcal: 35, protein_g: 0.8, carbs_g: 8, fat_g: 0.2, portion_g: 100, category: "accompagnement" },
  { dish: "Croissant", kcal: 406, protein_g: 8, carbs_g: 45, fat_g: 21, portion_g: 100, category: "petit-déjeuner" },
  { dish: "Pain au chocolat", kcal: 380, protein_g: 8, carbs_g: 42, fat_g: 20, portion_g: 100, category: "petit-déjeuner" },
  { dish: "Pain complet (2 tranches)", kcal: 160, protein_g: 6, carbs_g: 28, fat_g: 2, portion_g: 80, category: "petit-déjeuner" },
  { dish: "Brioche", kcal: 340, protein_g: 7, carbs_g: 48, fat_g: 14, portion_g: 100, category: "petit-déjeuner" },
  { dish: "Porridge avoine", kcal: 150, protein_g: 5, carbs_g: 27, fat_g: 3, portion_g: 150, category: "petit-déjeuner" },
  { dish: "Yaourt grec", kcal: 97, protein_g: 10, carbs_g: 3.6, fat_g: 5, portion_g: 100, category: "petit-déjeuner" },
  { dish: "Granola", kcal: 470, protein_g: 10, carbs_g: 60, fat_g: 20, portion_g: 100, category: "petit-déjeuner" },
  { dish: "Smoothie protéiné", kcal: 250, protein_g: 20, carbs_g: 30, fat_g: 4, portion_g: 300, category: "petit-déjeuner" },
  { dish: "Tarte au citron", kcal: 320, protein_g: 4, carbs_g: 42, fat_g: 16, portion_g: 100, category: "dessert" },
  { dish: "Mousse au chocolat", kcal: 280, protein_g: 6, carbs_g: 24, fat_g: 18, portion_g: 100, category: "dessert" },
  { dish: "Crème brûlée", kcal: 290, protein_g: 5, carbs_g: 22, fat_g: 20, portion_g: 100, category: "dessert" },
  { dish: "Glace vanille", kcal: 207, protein_g: 3.5, carbs_g: 24, fat_g: 11, portion_g: 100, category: "dessert" },
  { dish: "Tiramisu", kcal: 350, protein_g: 6, carbs_g: 30, fat_g: 22, portion_g: 100, category: "dessert" },
  { dish: "Fondant au chocolat", kcal: 380, protein_g: 6, carbs_g: 38, fat_g: 24, portion_g: 100, category: "dessert" },
  { dish: "Salade de fruits", kcal: 80, protein_g: 1, carbs_g: 18, fat_g: 0.5, portion_g: 150, category: "dessert" },
  { dish: "Barre protéinée", kcal: 200, protein_g: 20, carbs_g: 18, fat_g: 7, portion_g: 60, category: "snack" },
  { dish: "Fruits secs (30g)", kcal: 180, protein_g: 4, carbs_g: 14, fat_g: 14, portion_g: 30, category: "snack" },
  { dish: "Amandes (30g)", kcal: 180, protein_g: 6, carbs_g: 6, fat_g: 16, portion_g: 30, category: "snack" },
  { dish: "Banane", kcal: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3, portion_g: 100, category: "snack" },
  { dish: "Pomme", kcal: 52, protein_g: 0.3, carbs_g: 14, fat_g: 0.2, portion_g: 100, category: "snack" },
  { dish: "Avocat", kcal: 160, protein_g: 2, carbs_g: 9, fat_g: 15, portion_g: 100, category: "snack" },
  { dish: "Fromage blanc 0%", kcal: 50, protein_g: 8, carbs_g: 3, fat_g: 0, portion_g: 100, category: "snack" },
  { dish: "Beurre de cacahuète", kcal: 588, protein_g: 25, carbs_g: 20, fat_g: 50, portion_g: 100, category: "snack" },
  { dish: "Café noir", kcal: 2, protein_g: 0, carbs_g: 0, fat_g: 0, portion_g: 250, category: "boisson" },
  { dish: "Thé vert", kcal: 1, protein_g: 0, carbs_g: 0, fat_g: 0, portion_g: 250, category: "boisson" },
  { dish: "Jus d'orange", kcal: 45, protein_g: 0.7, carbs_g: 10, fat_g: 0.2, portion_g: 250, category: "boisson" },
  { dish: "Smoothie fruits", kcal: 120, protein_g: 1, carbs_g: 28, fat_g: 0.5, portion_g: 250, category: "boisson" },
  { dish: "Boisson protéinée", kcal: 150, protein_g: 25, carbs_g: 8, fat_g: 2, portion_g: 300, category: "boisson" },
  { dish: "Lait demi-écrémé", kcal: 46, protein_g: 3.4, carbs_g: 4.8, fat_g: 1.5, portion_g: 100, category: "boisson" },
  { dish: "Lait entier", kcal: 64, protein_g: 3.2, carbs_g: 4.8, fat_g: 3.6, portion_g: 100, category: "boisson" },
  { dish: "Burger classique", kcal: 450, protein_g: 22, carbs_g: 38, fat_g: 24, portion_g: 250, category: "fast-food" },
  { dish: "Cheeseburger", kcal: 520, protein_g: 26, carbs_g: 36, fat_g: 28, portion_g: 250, category: "fast-food" },
  { dish: "Kebab", kcal: 650, protein_g: 28, carbs_g: 55, fat_g: 32, portion_g: 300, category: "fast-food" },
  { dish: "Tacos", kcal: 580, protein_g: 24, carbs_g: 48, fat_g: 30, portion_g: 280, category: "fast-food" },
  { dish: "Wrap poulet", kcal: 380, protein_g: 22, carbs_g: 32, fat_g: 18, portion_g: 200, category: "fast-food" },
  { dish: "Frites (portion moyenne)", kcal: 365, protein_g: 4, carbs_g: 48, fat_g: 18, portion_g: 150, category: "fast-food" },
  { dish: "Nuggets (6 pièces)", kcal: 280, protein_g: 16, carbs_g: 16, fat_g: 18, portion_g: 100, category: "fast-food" },
  { dish: "Soupe de légumes", kcal: 60, protein_g: 2, carbs_g: 10, fat_g: 2, portion_g: 250, category: "soupe" },
  { dish: "Soupe de poisson", kcal: 90, protein_g: 8, carbs_g: 6, fat_g: 4, portion_g: 250, category: "soupe" },
  { dish: "Velouté de potiron", kcal: 80, protein_g: 2, carbs_g: 12, fat_g: 3, portion_g: 250, category: "soupe" },
  { dish: "Soupe miso", kcal: 40, protein_g: 3, carbs_g: 5, fat_g: 1, portion_g: 250, category: "soupe" },
  { dish: "Sandwich jambon-beurre", kcal: 380, protein_g: 16, carbs_g: 38, fat_g: 20, portion_g: 180, category: "sandwich" },
  { dish: "Sandwich poulet crudités", kcal: 320, protein_g: 20, carbs_g: 32, fat_g: 14, portion_g: 200, category: "sandwich" },
  { dish: "Salade niçoise", kcal: 280, protein_g: 18, carbs_g: 8, fat_g: 20, portion_g: 250, category: "salade" },
  { dish: "Salade composée", kcal: 220, protein_g: 12, carbs_g: 14, fat_g: 14, portion_g: 250, category: "salade" },
  { dish: "Poulet riz brocolis", kcal: 350, protein_g: 30, carbs_g: 32, fat_g: 10, portion_g: 300, category: "sport" },
  { dish: "Saumon quinoa légumes", kcal: 380, protein_g: 28, carbs_g: 30, fat_g: 18, portion_g: 300, category: "sport" },
  { dish: "Bowl poulet avocat", kcal: 420, protein_g: 28, carbs_g: 22, fat_g: 26, portion_g: 300, category: "sport" },
  { dish: "Omelette 3 oeufs", kcal: 280, protein_g: 18, carbs_g: 2, fat_g: 22, portion_g: 180, category: "sport" },
  { dish: "Thon riz complet", kcal: 320, protein_g: 28, carbs_g: 30, fat_g: 8, portion_g: 250, category: "sport" },
  { dish: "Poulet patate douce", kcal: 340, protein_g: 28, carbs_g: 28, fat_g: 12, portion_g: 300, category: "sport" },
  { dish: "Whey protein shake", kcal: 120, protein_g: 24, carbs_g: 3, fat_g: 2, portion_g: 300, category: "sport" },
  { dish: "Casein shake", kcal: 130, protein_g: 26, carbs_g: 4, fat_g: 2, portion_g: 300, category: "sport" },
  { dish: "Crêpes protéinées", kcal: 280, protein_g: 24, carbs_g: 22, fat_g: 10, portion_g: 200, category: "sport" },
  { dish: "Pancakes protéinés", kcal: 300, protein_g: 22, carbs_g: 28, fat_g: 10, portion_g: 200, category: "sport" },
  // ---- FRUITS ----
  { dish: "Fraises", kcal: 32, protein_g: 0.7, carbs_g: 7.7, fat_g: 0.3, portion_g: 100, category: "fruit" },
  { dish: "Framboises", kcal: 52, protein_g: 1.2, carbs_g: 12, fat_g: 0.7, portion_g: 100, category: "fruit" },
  { dish: "Myrtilles", kcal: 57, protein_g: 0.7, carbs_g: 14, fat_g: 0.3, portion_g: 100, category: "fruit" },
  { dish: "Orange", kcal: 47, protein_g: 0.9, carbs_g: 12, fat_g: 0.1, portion_g: 100, category: "fruit" },
  { dish: "Pamplemousse", kcal: 42, protein_g: 0.8, carbs_g: 11, fat_g: 0.1, portion_g: 100, category: "fruit" },
  { dish: "Kiwi", kcal: 61, protein_g: 1.1, carbs_g: 15, fat_g: 0.5, portion_g: 100, category: "fruit" },
  { dish: "Ananas", kcal: 50, protein_g: 0.5, carbs_g: 13, fat_g: 0.1, portion_g: 100, category: "fruit" },
  { dish: "Mangue", kcal: 60, protein_g: 0.8, carbs_g: 15, fat_g: 0.4, portion_g: 100, category: "fruit" },
  { dish: "Poire", kcal: 57, protein_g: 0.4, carbs_g: 15, fat_g: 0.1, portion_g: 100, category: "fruit" },
  { dish: "Raisin", kcal: 69, protein_g: 0.7, carbs_g: 18, fat_g: 0.2, portion_g: 100, category: "fruit" },
  { dish: "Pêche", kcal: 39, protein_g: 0.9, carbs_g: 10, fat_g: 0.3, portion_g: 100, category: "fruit" },
  { dish: "Abricot", kcal: 48, protein_g: 1.4, carbs_g: 11, fat_g: 0.4, portion_g: 100, category: "fruit" },
  { dish: "Cerises", kcal: 63, protein_g: 1.1, carbs_g: 16, fat_g: 0.2, portion_g: 100, category: "fruit" },
  { dish: "Pastèque", kcal: 30, protein_g: 0.6, carbs_g: 8, fat_g: 0.2, portion_g: 100, category: "fruit" },
  { dish: "Melon", kcal: 34, protein_g: 0.8, carbs_g: 8, fat_g: 0.2, portion_g: 100, category: "fruit" },
  { dish: "Figue fraîche", kcal: 74, protein_g: 0.8, carbs_g: 19, fat_g: 0.3, portion_g: 100, category: "fruit" },
  { dish: "Grenade", kcal: 83, protein_g: 1.7, carbs_g: 19, fat_g: 1.2, portion_g: 100, category: "fruit" },
  { dish: "Clémentine", kcal: 47, protein_g: 0.8, carbs_g: 12, fat_g: 0.2, portion_g: 100, category: "fruit" },
  { dish: "Citron", kcal: 29, protein_g: 1.1, carbs_g: 9, fat_g: 0.3, portion_g: 100, category: "fruit" },
  { dish: "Fruit de la passion", kcal: 97, protein_g: 2.2, carbs_g: 23, fat_g: 0.7, portion_g: 100, category: "fruit" },
  // ---- LÉGUMES ----
  { dish: "Épinards cuits", kcal: 23, protein_g: 2.9, carbs_g: 3.6, fat_g: 0.4, portion_g: 100, category: "légume" },
  { dish: "Courgette cuite", kcal: 17, protein_g: 1.2, carbs_g: 3.1, fat_g: 0.3, portion_g: 100, category: "légume" },
  { dish: "Aubergine cuite", kcal: 25, protein_g: 1, carbs_g: 6, fat_g: 0.2, portion_g: 100, category: "légume" },
  { dish: "Poivron", kcal: 31, protein_g: 1, carbs_g: 6, fat_g: 0.3, portion_g: 100, category: "légume" },
  { dish: "Tomate", kcal: 18, protein_g: 0.9, carbs_g: 3.9, fat_g: 0.2, portion_g: 100, category: "légume" },
  { dish: "Concombre", kcal: 15, protein_g: 0.7, carbs_g: 3.6, fat_g: 0.1, portion_g: 100, category: "légume" },
  { dish: "Chou-fleur cuit", kcal: 25, protein_g: 1.9, carbs_g: 5, fat_g: 0.3, portion_g: 100, category: "légume" },
  { dish: "Chou vert cuit", kcal: 23, protein_g: 1.3, carbs_g: 5.5, fat_g: 0.1, portion_g: 100, category: "légume" },
  { dish: "Champignons de Paris", kcal: 22, protein_g: 3.1, carbs_g: 3.3, fat_g: 0.3, portion_g: 100, category: "légume" },
  { dish: "Petits pois", kcal: 81, protein_g: 5.4, carbs_g: 14, fat_g: 0.4, portion_g: 100, category: "légume" },
  { dish: "Maïs doux", kcal: 86, protein_g: 3.2, carbs_g: 19, fat_g: 1.2, portion_g: 100, category: "légume" },
  { dish: "Oignon", kcal: 40, protein_g: 1.1, carbs_g: 9, fat_g: 0.1, portion_g: 100, category: "légume" },
  { dish: "Céleri", kcal: 16, protein_g: 0.7, carbs_g: 3, fat_g: 0.2, portion_g: 100, category: "légume" },
  { dish: "Betterave cuite", kcal: 44, protein_g: 1.7, carbs_g: 10, fat_g: 0.2, portion_g: 100, category: "légume" },
  { dish: "Patate douce cuite", kcal: 90, protein_g: 2, carbs_g: 21, fat_g: 0.2, portion_g: 100, category: "légume" },
  { dish: "Artichaut cuit", kcal: 47, protein_g: 3.3, carbs_g: 10, fat_g: 0.2, portion_g: 100, category: "légume" },
  { dish: "Asperges cuites", kcal: 22, protein_g: 2.4, carbs_g: 3.9, fat_g: 0.2, portion_g: 100, category: "légume" },
  { dish: "Fenouil", kcal: 31, protein_g: 1.2, carbs_g: 7, fat_g: 0.2, portion_g: 100, category: "légume" },
  { dish: "Radis", kcal: 16, protein_g: 0.7, carbs_g: 3.4, fat_g: 0.1, portion_g: 100, category: "légume" },
  { dish: "Salade verte", kcal: 15, protein_g: 1.4, carbs_g: 2.9, fat_g: 0.2, portion_g: 100, category: "légume" },
  // ---- LAITIER ----
  { dish: "Yaourt nature", kcal: 61, protein_g: 3.5, carbs_g: 4.7, fat_g: 3.3, portion_g: 125, category: "laitier" },
  { dish: "Yaourt 0%", kcal: 45, protein_g: 4.5, carbs_g: 6, fat_g: 0.2, portion_g: 125, category: "laitier" },
  { dish: "Fromage blanc 20%", kcal: 90, protein_g: 7.5, carbs_g: 4, fat_g: 5, portion_g: 100, category: "laitier" },
  { dish: "Petit-suisse", kcal: 100, protein_g: 8, carbs_g: 4, fat_g: 5.5, portion_g: 60, category: "laitier" },
  { dish: "Camembert", kcal: 300, protein_g: 20, carbs_g: 0.5, fat_g: 23, portion_g: 30, category: "laitier" },
  { dish: "Comté", kcal: 400, protein_g: 28, carbs_g: 0, fat_g: 32, portion_g: 30, category: "laitier" },
  { dish: "Mozzarella", kcal: 280, protein_g: 22, carbs_g: 2, fat_g: 20, portion_g: 100, category: "laitier" },
  { dish: "Feta", kcal: 260, protein_g: 14, carbs_g: 4, fat_g: 21, portion_g: 100, category: "laitier" },
  { dish: "Emmental", kcal: 380, protein_g: 28, carbs_g: 0, fat_g: 29, portion_g: 30, category: "laitier" },
  { dish: "Chèvre frais", kcal: 200, protein_g: 14, carbs_g: 3, fat_g: 15, portion_g: 50, category: "laitier" },
  { dish: "Crème fraîche épaisse", kcal: 300, protein_g: 2.5, carbs_g: 3, fat_g: 30, portion_g: 30, category: "laitier" },
  { dish: "Beurre", kcal: 717, protein_g: 0.9, carbs_g: 0.1, fat_g: 81, portion_g: 10, category: "laitier" },
  { dish: "Skyr", kcal: 63, protein_g: 11, carbs_g: 4, fat_g: 0.2, portion_g: 150, category: "laitier" },
  // ---- CÉRÉALES / FÉCULENTS ----
  { dish: "Flocons d'avoine", kcal: 375, protein_g: 13, carbs_g: 58, fat_g: 7, portion_g: 50, category: "céréale" },
  { dish: "Muesli", kcal: 360, protein_g: 10, carbs_g: 60, fat_g: 8, portion_g: 50, category: "céréale" },
  { dish: "Pain blanc (2 tranches)", kcal: 140, protein_g: 4.5, carbs_g: 27, fat_g: 1.2, portion_g: 60, category: "céréale" },
  { dish: "Riz basmati cuit", kcal: 121, protein_g: 2.7, carbs_g: 25, fat_g: 0.4, portion_g: 100, category: "céréale" },
  { dish: "Boulgour cuit", kcal: 83, protein_g: 3, carbs_g: 19, fat_g: 0.2, portion_g: 100, category: "céréale" },
  { dish: "Semoule cuite", kcal: 112, protein_g: 3.8, carbs_g: 23, fat_g: 0.2, portion_g: 100, category: "céréale" },
  { dish: "Pâtes complètes cuites", kcal: 124, protein_g: 5, carbs_g: 25, fat_g: 1.1, portion_g: 100, category: "céréale" },
  { dish: "Corn flakes", kcal: 378, protein_g: 7, carbs_g: 84, fat_g: 0.9, portion_g: 40, category: "céréale" },
  { dish: "Biscottes (4)", kcal: 160, protein_g: 4, carbs_g: 30, fat_g: 2, portion_g: 32, category: "céréale" },
  // ---- ÉPICERIE / PRODUITS DE MARQUE ----
  { dish: "Nutella", kcal: 539, protein_g: 6.3, carbs_g: 57.5, fat_g: 30.9, portion_g: 15, category: "épicerie" },
  { dish: "Confiture", kcal: 250, protein_g: 0.3, carbs_g: 62, fat_g: 0, portion_g: 20, category: "épicerie" },
  { dish: "Miel", kcal: 304, protein_g: 0.3, carbs_g: 76, fat_g: 0, portion_g: 15, category: "épicerie" },
  { dish: "Ketchup", kcal: 100, protein_g: 1.2, carbs_g: 24, fat_g: 0.1, portion_g: 15, category: "épicerie" },
  { dish: "Mayonnaise", kcal: 680, protein_g: 1, carbs_g: 3, fat_g: 75, portion_g: 15, category: "épicerie" },
  { dish: "Moutarde", kcal: 66, protein_g: 4, carbs_g: 5, fat_g: 3.3, portion_g: 10, category: "épicerie" },
  { dish: "Huile d'olive", kcal: 884, protein_g: 0, carbs_g: 0, fat_g: 100, portion_g: 10, category: "épicerie" },
  { dish: "Vinaigrette", kcal: 380, protein_g: 0.5, carbs_g: 5, fat_g: 38, portion_g: 15, category: "épicerie" },
  { dish: "Chocolat noir", kcal: 546, protein_g: 7.8, carbs_g: 45, fat_g: 31, portion_g: 20, category: "épicerie" },
  { dish: "Chocolat au lait", kcal: 535, protein_g: 7.6, carbs_g: 57, fat_g: 30, portion_g: 20, category: "épicerie" },
  { dish: "Chips nature", kcal: 536, protein_g: 6.6, carbs_g: 53, fat_g: 34, portion_g: 30, category: "épicerie" },
  { dish: "Popcorn salé", kcal: 480, protein_g: 9, carbs_g: 58, fat_g: 24, portion_g: 30, category: "épicerie" },
  { dish: "Biscuits sablés", kcal: 470, protein_g: 6, carbs_g: 65, fat_g: 20, portion_g: 25, category: "épicerie" },
  { dish: "Céréales chocolatées", kcal: 390, protein_g: 6, carbs_g: 78, fat_g: 5, portion_g: 30, category: "épicerie" },
  { dish: "Compote sans sucre ajouté", kcal: 55, protein_g: 0.3, carbs_g: 13, fat_g: 0.1, portion_g: 100, category: "épicerie" },
  // ---- BOISSONS (ajouts) ----
  { dish: "Coca-Cola", kcal: 42, protein_g: 0, carbs_g: 10.6, fat_g: 0, portion_g: 330, category: "boisson" },
  { dish: "Coca-Cola Zero", kcal: 0.3, protein_g: 0, carbs_g: 0, fat_g: 0, portion_g: 330, category: "boisson" },
  { dish: "Jus de pomme", kcal: 46, protein_g: 0.1, carbs_g: 11, fat_g: 0.1, portion_g: 250, category: "boisson" },
  { dish: "Bière (33cl)", kcal: 43, protein_g: 0.5, carbs_g: 3.5, fat_g: 0, portion_g: 330, category: "boisson" },
  { dish: "Vin rouge (10cl)", kcal: 85, protein_g: 0.1, carbs_g: 2.6, fat_g: 0, portion_g: 100, category: "boisson" },
  { dish: "Eau gazeuse aromatisée", kcal: 5, protein_g: 0, carbs_g: 1, fat_g: 0, portion_g: 330, category: "boisson" },
  { dish: "Boisson isotonique", kcal: 90, protein_g: 0, carbs_g: 22, fat_g: 0, portion_g: 330, category: "boisson" },
  // ---- POISSONS / VIANDES (ajouts) ----
  { dish: "Cabillaud vapeur", kcal: 82, protein_g: 18, carbs_g: 0, fat_g: 0.7, portion_g: 100, category: "protéine" },
  { dish: "Crevettes cuites", kcal: 99, protein_g: 21, carbs_g: 0.2, fat_g: 1.5, portion_g: 100, category: "protéine" },
  { dish: "Dinde escalope", kcal: 135, protein_g: 29, carbs_g: 0, fat_g: 1.7, portion_g: 100, category: "protéine" },
  { dish: "Jambon blanc (2 tranches)", kcal: 100, protein_g: 18, carbs_g: 0.5, fat_g: 3, portion_g: 80, category: "protéine" },
  { dish: "Tofu ferme", kcal: 145, protein_g: 15, carbs_g: 2, fat_g: 9, portion_g: 100, category: "protéine" },
  { dish: "Lentilles vertes cuites", kcal: 116, protein_g: 9, carbs_g: 20, fat_g: 0.4, portion_g: 100, category: "protéine" },
  { dish: "Pois chiches cuits", kcal: 164, protein_g: 8.9, carbs_g: 27, fat_g: 2.6, portion_g: 100, category: "protéine" },
  { dish: "Haricots rouges cuits", kcal: 127, protein_g: 8.7, carbs_g: 23, fat_g: 0.5, portion_g: 100, category: "protéine" },
  // ---- FRUITS (suite) ----
  { dish: "Nectarine", kcal: 44, protein_g: 1.1, carbs_g: 10, fat_g: 0.3, portion_g: 100, category: "fruit" },
  { dish: "Litchi", kcal: 66, protein_g: 0.8, carbs_g: 17, fat_g: 0.4, portion_g: 100, category: "fruit" },
  { dish: "Papaye", kcal: 43, protein_g: 0.5, carbs_g: 11, fat_g: 0.3, portion_g: 100, category: "fruit" },
  { dish: "Rhubarbe cuite", kcal: 25, protein_g: 0.9, carbs_g: 5, fat_g: 0.2, portion_g: 100, category: "fruit" },
  { dish: "Coing cuit", kcal: 60, protein_g: 0.4, carbs_g: 15, fat_g: 0.1, portion_g: 100, category: "fruit" },
  { dish: "Groseilles", kcal: 56, protein_g: 1.4, carbs_g: 13, fat_g: 0.2, portion_g: 100, category: "fruit" },
  { dish: "Cassis", kcal: 63, protein_g: 1.4, carbs_g: 15, fat_g: 0.4, portion_g: 100, category: "fruit" },
  { dish: "Mûres", kcal: 43, protein_g: 1.4, carbs_g: 10, fat_g: 0.5, portion_g: 100, category: "fruit" },
  { dish: "Datte fraîche", kcal: 282, protein_g: 2.5, carbs_g: 75, fat_g: 0.4, portion_g: 30, category: "fruit" },
  { dish: "Pruneau", kcal: 240, protein_g: 2.2, carbs_g: 64, fat_g: 0.4, portion_g: 30, category: "fruit" },
  { dish: "Figue séchée", kcal: 249, protein_g: 3.3, carbs_g: 64, fat_g: 0.9, portion_g: 30, category: "fruit" },
  { dish: "Abricot sec", kcal: 241, protein_g: 3.4, carbs_g: 63, fat_g: 0.5, portion_g: 30, category: "fruit" },
  { dish: "Raisins secs", kcal: 299, protein_g: 3.1, carbs_g: 79, fat_g: 0.5, portion_g: 30, category: "fruit" },
  { dish: "Noix de coco fraîche", kcal: 354, protein_g: 3.3, carbs_g: 15, fat_g: 33, portion_g: 30, category: "fruit" },
  { dish: "Banane plantain cuite", kcal: 122, protein_g: 1.3, carbs_g: 32, fat_g: 0.3, portion_g: 100, category: "fruit" },
  { dish: "Physalis", kcal: 53, protein_g: 1.9, carbs_g: 11, fat_g: 0.7, portion_g: 100, category: "fruit" },
  { dish: "Goyave", kcal: 68, protein_g: 2.6, carbs_g: 14, fat_g: 1, portion_g: 100, category: "fruit" },
  { dish: "Carambole", kcal: 31, protein_g: 1, carbs_g: 7, fat_g: 0.3, portion_g: 100, category: "fruit" },
  // ---- LÉGUMES (suite) ----
  { dish: "Panais cuit", kcal: 65, protein_g: 1.3, carbs_g: 15, fat_g: 0.3, portion_g: 100, category: "légume" },
  { dish: "Navet cuit", kcal: 22, protein_g: 0.9, carbs_g: 5, fat_g: 0.1, portion_g: 100, category: "légume" },
  { dish: "Topinambour cuit", kcal: 73, protein_g: 2, carbs_g: 17, fat_g: 0.1, portion_g: 100, category: "légume" },
  { dish: "Blettes cuites", kcal: 20, protein_g: 1.8, carbs_g: 3.7, fat_g: 0.2, portion_g: 100, category: "légume" },
  { dish: "Cresson", kcal: 11, protein_g: 2.3, carbs_g: 0.8, fat_g: 0.1, portion_g: 100, category: "légume" },
  { dish: "Endive braisée", kcal: 22, protein_g: 1.2, carbs_g: 3, fat_g: 0.3, portion_g: 100, category: "légume" },
  { dish: "Poireau cuit", kcal: 29, protein_g: 1.3, carbs_g: 6, fat_g: 0.3, portion_g: 100, category: "légume" },
  { dish: "Chou rouge cru", kcal: 31, protein_g: 1.4, carbs_g: 7, fat_g: 0.2, portion_g: 100, category: "légume" },
  { dish: "Choux de Bruxelles cuits", kcal: 36, protein_g: 3, carbs_g: 5, fat_g: 0.5, portion_g: 100, category: "légume" },
  { dish: "Courge butternut cuite", kcal: 40, protein_g: 1, carbs_g: 10, fat_g: 0.1, portion_g: 100, category: "légume" },
  { dish: "Potiron cuit", kcal: 34, protein_g: 1, carbs_g: 7, fat_g: 0.1, portion_g: 100, category: "légume" },
  { dish: "Pousses de soja", kcal: 30, protein_g: 3, carbs_g: 3, fat_g: 0.2, portion_g: 100, category: "légume" },
  { dish: "Roquette", kcal: 25, protein_g: 2.6, carbs_g: 3.7, fat_g: 0.7, portion_g: 100, category: "légume" },
  { dish: "Mâche", kcal: 21, protein_g: 2, carbs_g: 3.6, fat_g: 0.4, portion_g: 100, category: "légume" },
  { dish: "Gombo (okra) cuit", kcal: 33, protein_g: 2, carbs_g: 6, fat_g: 0.2, portion_g: 100, category: "légume" },
  { dish: "Igname cuite", kcal: 118, protein_g: 1.5, carbs_g: 28, fat_g: 0.2, portion_g: 100, category: "légume" },
  { dish: "Manioc cuit", kcal: 160, protein_g: 1.4, carbs_g: 38, fat_g: 0.3, portion_g: 100, category: "légume" },
  { dish: "Salsifis cuits", kcal: 82, protein_g: 3.3, carbs_g: 18, fat_g: 0.3, portion_g: 100, category: "légume" },
  { dish: "Petits pois carottes", kcal: 65, protein_g: 3, carbs_g: 10, fat_g: 1, portion_g: 100, category: "légume" },
  // ---- POISSONS / FRUITS DE MER ----
  { dish: "Truite cuite", kcal: 148, protein_g: 21, carbs_g: 0, fat_g: 6.6, portion_g: 100, category: "poisson" },
  { dish: "Bar (loup) cuit", kcal: 124, protein_g: 21, carbs_g: 0, fat_g: 4, portion_g: 100, category: "poisson" },
  { dish: "Dorade cuite", kcal: 130, protein_g: 20, carbs_g: 0, fat_g: 5, portion_g: 100, category: "poisson" },
  { dish: "Merlan cuit", kcal: 90, protein_g: 19, carbs_g: 0, fat_g: 1.3, portion_g: 100, category: "poisson" },
  { dish: "Lieu noir cuit", kcal: 92, protein_g: 20, carbs_g: 0, fat_g: 1, portion_g: 100, category: "poisson" },
  { dish: "Maquereau grillé", kcal: 205, protein_g: 19, carbs_g: 0, fat_g: 14, portion_g: 100, category: "poisson" },
  { dish: "Sardines à l'huile", kcal: 208, protein_g: 20, carbs_g: 0, fat_g: 14, portion_g: 100, category: "poisson" },
  { dish: "Hareng fumé", kcal: 217, protein_g: 18, carbs_g: 0, fat_g: 15, portion_g: 100, category: "poisson" },
  { dish: "Anchois à l'huile", kcal: 210, protein_g: 25, carbs_g: 0, fat_g: 12, portion_g: 50, category: "poisson" },
  { dish: "Flétan cuit", kcal: 111, protein_g: 21, carbs_g: 0, fat_g: 2.3, portion_g: 100, category: "poisson" },
  { dish: "Sole cuite", kcal: 86, protein_g: 18, carbs_g: 0, fat_g: 1, portion_g: 100, category: "poisson" },
  { dish: "Colin cuit", kcal: 82, protein_g: 17, carbs_g: 0, fat_g: 0.7, portion_g: 100, category: "poisson" },
  { dish: "Lotte cuite", kcal: 76, protein_g: 17, carbs_g: 0, fat_g: 0.8, portion_g: 100, category: "poisson" },
  { dish: "Moules marinière (100g)", kcal: 86, protein_g: 12, carbs_g: 4, fat_g: 2.2, portion_g: 100, category: "poisson" },
  { dish: "Huîtres (6 pièces)", kcal: 100, protein_g: 12, carbs_g: 5, fat_g: 3, portion_g: 100, category: "poisson" },
  { dish: "Coquilles Saint-Jacques", kcal: 88, protein_g: 17, carbs_g: 3, fat_g: 0.8, portion_g: 100, category: "poisson" },
  { dish: "Calamars (encornets)", kcal: 92, protein_g: 16, carbs_g: 3, fat_g: 1.4, portion_g: 100, category: "poisson" },
  { dish: "Poulpe cuit", kcal: 82, protein_g: 15, carbs_g: 2, fat_g: 1, portion_g: 100, category: "poisson" },
  { dish: "Surimi", kcal: 95, protein_g: 12, carbs_g: 10, fat_g: 0.5, portion_g: 100, category: "poisson" },
  { dish: "Tarama", kcal: 380, protein_g: 4, carbs_g: 6, fat_g: 38, portion_g: 30, category: "poisson" },
  { dish: "Oeufs de saumon", kcal: 264, protein_g: 30, carbs_g: 4, fat_g: 15, portion_g: 30, category: "poisson" },
  { dish: "Poisson pané cuit", kcal: 220, protein_g: 12, carbs_g: 18, fat_g: 11, portion_g: 100, category: "poisson" },
  { dish: "Fish and chips", kcal: 450, protein_g: 18, carbs_g: 40, fat_g: 24, portion_g: 300, category: "poisson" },
  // ---- VIANDES / CHARCUTERIE ----
  { dish: "Côte de porc grillée", kcal: 250, protein_g: 27, carbs_g: 0, fat_g: 15, portion_g: 150, category: "protéine" },
  { dish: "Filet mignon de porc", kcal: 143, protein_g: 26, carbs_g: 0, fat_g: 4, portion_g: 100, category: "protéine" },
  { dish: "Escalope de porc", kcal: 156, protein_g: 28, carbs_g: 0, fat_g: 4, portion_g: 100, category: "protéine" },
  { dish: "Rôti de porc", kcal: 165, protein_g: 27, carbs_g: 0, fat_g: 6, portion_g: 100, category: "protéine" },
  { dish: "Gigot d'agneau", kcal: 217, protein_g: 25, carbs_g: 0, fat_g: 13, portion_g: 150, category: "protéine" },
  { dish: "Côtelettes d'agneau", kcal: 294, protein_g: 25, carbs_g: 0, fat_g: 21, portion_g: 150, category: "protéine" },
  { dish: "Foie de veau poêlé", kcal: 165, protein_g: 22, carbs_g: 4, fat_g: 6, portion_g: 100, category: "protéine" },
  { dish: "Foie de volaille", kcal: 167, protein_g: 24, carbs_g: 1, fat_g: 7, portion_g: 100, category: "protéine" },
  { dish: "Lapin rôti", kcal: 173, protein_g: 29, carbs_g: 0, fat_g: 6, portion_g: 150, category: "protéine" },
  { dish: "Cuisse de poulet rôtie", kcal: 209, protein_g: 26, carbs_g: 0, fat_g: 11, portion_g: 150, category: "protéine" },
  { dish: "Aile de poulet", kcal: 203, protein_g: 18, carbs_g: 0, fat_g: 14, portion_g: 100, category: "protéine" },
  { dish: "Blanc de poulet nature", kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, portion_g: 150, category: "protéine" },
  { dish: "Canard rôti", kcal: 337, protein_g: 19, carbs_g: 0, fat_g: 28, portion_g: 150, category: "protéine" },
  { dish: "Veau escalope", kcal: 172, protein_g: 31, carbs_g: 0, fat_g: 4.5, portion_g: 150, category: "protéine" },
  { dish: "Boeuf tartare", kcal: 200, protein_g: 21, carbs_g: 1, fat_g: 13, portion_g: 150, category: "protéine" },
  { dish: "Entrecôte grillée", kcal: 271, protein_g: 26, carbs_g: 0, fat_g: 18, portion_g: 200, category: "protéine" },
  { dish: "Faux-filet grillé", kcal: 250, protein_g: 27, carbs_g: 0, fat_g: 16, portion_g: 200, category: "protéine" },
  { dish: "Bacon (2 tranches)", kcal: 150, protein_g: 12, carbs_g: 0.5, fat_g: 11, portion_g: 30, category: "protéine" },
  { dish: "Lardons fumés", kcal: 280, protein_g: 21, carbs_g: 0.5, fat_g: 22, portion_g: 50, category: "protéine" },
  { dish: "Chorizo", kcal: 380, protein_g: 24, carbs_g: 2, fat_g: 31, portion_g: 50, category: "protéine" },
  { dish: "Saucisson sec", kcal: 400, protein_g: 24, carbs_g: 1, fat_g: 33, portion_g: 30, category: "protéine" },
  { dish: "Saucisse de Toulouse", kcal: 300, protein_g: 15, carbs_g: 1, fat_g: 26, portion_g: 100, category: "protéine" },
  { dish: "Merguez grillée", kcal: 290, protein_g: 16, carbs_g: 2, fat_g: 24, portion_g: 100, category: "protéine" },
  { dish: "Boudin noir", kcal: 300, protein_g: 15, carbs_g: 2, fat_g: 26, portion_g: 100, category: "protéine" },
  { dish: "Pâté de campagne", kcal: 350, protein_g: 13, carbs_g: 2, fat_g: 32, portion_g: 50, category: "protéine" },
  { dish: "Rillettes", kcal: 380, protein_g: 18, carbs_g: 0, fat_g: 34, portion_g: 50, category: "protéine" },
  { dish: "Andouillette grillée", kcal: 240, protein_g: 18, carbs_g: 1, fat_g: 18, portion_g: 150, category: "protéine" },
  { dish: "Terrine de campagne", kcal: 320, protein_g: 15, carbs_g: 1, fat_g: 28, portion_g: 50, category: "protéine" },
  // ---- LÉGUMINEUSES ----
  { dish: "Haricots blancs cuits", kcal: 139, protein_g: 9.7, carbs_g: 25, fat_g: 0.5, portion_g: 100, category: "légumineuse" },
  { dish: "Fèves cuites", kcal: 88, protein_g: 7.6, carbs_g: 17, fat_g: 0.5, portion_g: 100, category: "légumineuse" },
  { dish: "Edamame cuits", kcal: 122, protein_g: 11, carbs_g: 9, fat_g: 5, portion_g: 100, category: "légumineuse" },
  { dish: "Flageolets cuits", kcal: 130, protein_g: 8, carbs_g: 22, fat_g: 0.6, portion_g: 100, category: "légumineuse" },
  { dish: "Soja cuit", kcal: 173, protein_g: 18, carbs_g: 9, fat_g: 9, portion_g: 100, category: "légumineuse" },
  // ---- OLÉAGINEUX ----
  { dish: "Noix (30g)", kcal: 196, protein_g: 4.5, carbs_g: 4, fat_g: 19, portion_g: 30, category: "oléagineux" },
  { dish: "Noisettes (30g)", kcal: 188, protein_g: 4.5, carbs_g: 5, fat_g: 18, portion_g: 30, category: "oléagineux" },
  { dish: "Noix de cajou (30g)", kcal: 175, protein_g: 5.5, carbs_g: 9, fat_g: 14, portion_g: 30, category: "oléagineux" },
  { dish: "Pistaches (30g)", kcal: 173, protein_g: 6, carbs_g: 8, fat_g: 14, portion_g: 30, category: "oléagineux" },
  { dish: "Graines de tournesol (30g)", kcal: 175, protein_g: 6, carbs_g: 6, fat_g: 15, portion_g: 30, category: "oléagineux" },
  { dish: "Graines de courge (30g)", kcal: 170, protein_g: 9, carbs_g: 4, fat_g: 14, portion_g: 30, category: "oléagineux" },
  { dish: "Graines de chia (15g)", kcal: 73, protein_g: 2.5, carbs_g: 6, fat_g: 4.5, portion_g: 15, category: "oléagineux" },
  { dish: "Graines de lin (15g)", kcal: 75, protein_g: 2.7, carbs_g: 4, fat_g: 6, portion_g: 15, category: "oléagineux" },
  { dish: "Graines de sésame (15g)", kcal: 87, protein_g: 2.6, carbs_g: 3.5, fat_g: 7.5, portion_g: 15, category: "oléagineux" },
  { dish: "Noix du Brésil (30g)", kcal: 197, protein_g: 4.3, carbs_g: 3.5, fat_g: 20, portion_g: 30, category: "oléagineux" },
  { dish: "Noix de macadamia (30g)", kcal: 218, protein_g: 2.3, carbs_g: 4, fat_g: 23, portion_g: 30, category: "oléagineux" },
  // ---- LAITIER (suite) ----
  { dish: "Lait d'amande", kcal: 24, protein_g: 0.5, carbs_g: 2.5, fat_g: 1.1, portion_g: 200, category: "laitier" },
  { dish: "Lait de soja", kcal: 33, protein_g: 3, carbs_g: 1, fat_g: 1.8, portion_g: 200, category: "laitier" },
  { dish: "Lait de coco (boisson)", kcal: 42, protein_g: 0.3, carbs_g: 1, fat_g: 4, portion_g: 200, category: "laitier" },
  { dish: "Lait d'avoine", kcal: 46, protein_g: 1, carbs_g: 6.5, fat_g: 1.5, portion_g: 200, category: "laitier" },
  { dish: "Ricotta", kcal: 174, protein_g: 11, carbs_g: 3, fat_g: 13, portion_g: 100, category: "laitier" },
  { dish: "Parmesan râpé", kcal: 431, protein_g: 38, carbs_g: 4, fat_g: 29, portion_g: 20, category: "laitier" },
  { dish: "Roquefort", kcal: 369, protein_g: 19, carbs_g: 2, fat_g: 32, portion_g: 30, category: "laitier" },
  { dish: "Bleu d'Auvergne", kcal: 350, protein_g: 19, carbs_g: 2, fat_g: 30, portion_g: 30, category: "laitier" },
  { dish: "Reblochon", kcal: 330, protein_g: 20, carbs_g: 1, fat_g: 27, portion_g: 30, category: "laitier" },
  { dish: "Brie", kcal: 334, protein_g: 20, carbs_g: 0.5, fat_g: 28, portion_g: 30, category: "laitier" },
  { dish: "Cantal", kcal: 380, protein_g: 24, carbs_g: 0, fat_g: 31, portion_g: 30, category: "laitier" },
  { dish: "Gouda", kcal: 356, protein_g: 25, carbs_g: 2, fat_g: 27, portion_g: 30, category: "laitier" },
  { dish: "Cheddar", kcal: 402, protein_g: 25, carbs_g: 1, fat_g: 33, portion_g: 30, category: "laitier" },
  { dish: "Boursin ail et fines herbes", kcal: 380, protein_g: 7, carbs_g: 3, fat_g: 39, portion_g: 30, category: "laitier" },
  { dish: "Fromage à tartiner", kcal: 280, protein_g: 8, carbs_g: 4, fat_g: 25, portion_g: 30, category: "laitier" },
  { dish: "Yaourt à boire", kcal: 65, protein_g: 3, carbs_g: 9, fat_g: 1.5, portion_g: 200, category: "laitier" },
  { dish: "Yaourt aux fruits", kcal: 105, protein_g: 3.5, carbs_g: 17, fat_g: 2.5, portion_g: 125, category: "laitier" },
  { dish: "Yaourt grec au miel", kcal: 130, protein_g: 6, carbs_g: 16, fat_g: 4.5, portion_g: 150, category: "laitier" },
  { dish: "Crème fraîche légère 15%", kcal: 155, protein_g: 3, carbs_g: 4, fat_g: 15, portion_g: 30, category: "laitier" },
  { dish: "Mascarpone", kcal: 435, protein_g: 4.5, carbs_g: 4, fat_g: 45, portion_g: 30, category: "laitier" },
  // ---- CÉRÉALES / FÉCULENTS (suite) ----
  { dish: "Épeautre cuit", kcal: 127, protein_g: 5, carbs_g: 26, fat_g: 1, portion_g: 100, category: "céréale" },
  { dish: "Sarrasin cuit", kcal: 92, protein_g: 3.4, carbs_g: 20, fat_g: 0.6, portion_g: 100, category: "céréale" },
  { dish: "Millet cuit", kcal: 119, protein_g: 3.5, carbs_g: 23, fat_g: 1, portion_g: 100, category: "céréale" },
  { dish: "Orge perlé cuit", kcal: 123, protein_g: 2.3, carbs_g: 28, fat_g: 0.4, portion_g: 100, category: "céréale" },
  { dish: "Pain de mie (2 tranches)", kcal: 132, protein_g: 4, carbs_g: 24, fat_g: 2, portion_g: 50, category: "céréale" },
  { dish: "Pain aux céréales (2 tranches)", kcal: 150, protein_g: 5.5, carbs_g: 26, fat_g: 2.5, portion_g: 60, category: "céréale" },
  { dish: "Pain viennois", kcal: 290, protein_g: 9, carbs_g: 48, fat_g: 7, portion_g: 100, category: "céréale" },
  { dish: "Baguette (1/4)", kcal: 135, protein_g: 4.5, carbs_g: 27, fat_g: 0.6, portion_g: 50, category: "céréale" },
  { dish: "Pain d'épices", kcal: 320, protein_g: 5, carbs_g: 62, fat_g: 5, portion_g: 50, category: "céréale" },
  { dish: "Wrap / tortilla de blé", kcal: 290, protein_g: 8, carbs_g: 48, fat_g: 7, portion_g: 60, category: "céréale" },
  { dish: "Nouilles chinoises cuites", kcal: 138, protein_g: 4.5, carbs_g: 26, fat_g: 1.5, portion_g: 100, category: "céréale" },
  { dish: "Nouilles udon cuites", kcal: 99, protein_g: 2.5, carbs_g: 21, fat_g: 0.2, portion_g: 100, category: "céréale" },
  { dish: "Vermicelles de riz cuits", kcal: 109, protein_g: 1, carbs_g: 25, fat_g: 0.2, portion_g: 100, category: "céréale" },
  { dish: "Gnocchis cuits", kcal: 150, protein_g: 3.5, carbs_g: 31, fat_g: 0.5, portion_g: 150, category: "céréale" },
  { dish: "Ravioles fraîches", kcal: 250, protein_g: 10, carbs_g: 34, fat_g: 8, portion_g: 200, category: "céréale" },
  { dish: "Tortellini fromage", kcal: 280, protein_g: 12, carbs_g: 40, fat_g: 8, portion_g: 200, category: "céréale" },
  { dish: "Polenta cuite", kcal: 85, protein_g: 2, carbs_g: 18, fat_g: 0.5, portion_g: 150, category: "céréale" },
  // ---- ÉPICERIE / SAUCES / CONDIMENTS ----
  { dish: "Nesquik (poudre cacao)", kcal: 380, protein_g: 5, carbs_g: 80, fat_g: 3, portion_g: 15, category: "épicerie" },
  { dish: "Kinder Bueno", kcal: 300, protein_g: 5, carbs_g: 30, fat_g: 18, portion_g: 43, category: "épicerie" },
  { dish: "KitKat (2 doigts)", kcal: 240, protein_g: 3, carbs_g: 27, fat_g: 13, portion_g: 45, category: "épicerie" },
  { dish: "Twix", kcal: 250, protein_g: 2.5, carbs_g: 32, fat_g: 12, portion_g: 50, category: "épicerie" },
  { dish: "M&M's (sachet)", kcal: 240, protein_g: 3, carbs_g: 31, fat_g: 11, portion_g: 45, category: "épicerie" },
  { dish: "Oreo (3 biscuits)", kcal: 160, protein_g: 1.5, carbs_g: 24, fat_g: 7, portion_g: 33, category: "épicerie" },
  { dish: "Petit Beurre LU (4 biscuits)", kcal: 150, protein_g: 2.5, carbs_g: 26, fat_g: 4, portion_g: 32, category: "épicerie" },
  { dish: "Speculoos (3 biscuits)", kcal: 140, protein_g: 1.5, carbs_g: 22, fat_g: 5, portion_g: 25, category: "épicerie" },
  { dish: "Palmier (1 pièce)", kcal: 130, protein_g: 1.5, carbs_g: 13, fat_g: 8, portion_g: 25, category: "épicerie" },
  { dish: "Pâte à tartiner spéculoos", kcal: 545, protein_g: 5, carbs_g: 55, fat_g: 34, portion_g: 15, category: "épicerie" },
  { dish: "Sirop d'érable", kcal: 260, protein_g: 0, carbs_g: 67, fat_g: 0, portion_g: 20, category: "épicerie" },
  { dish: "Beurre de cacahuète crunchy", kcal: 590, protein_g: 25, carbs_g: 18, fat_g: 50, portion_g: 30, category: "épicerie" },
  { dish: "Houmous du commerce", kcal: 306, protein_g: 8, carbs_g: 14, fat_g: 25, portion_g: 50, category: "épicerie" },
  { dish: "Guacamole", kcal: 155, protein_g: 2, carbs_g: 6, fat_g: 14, portion_g: 50, category: "épicerie" },
  { dish: "Pesto", kcal: 460, protein_g: 5, carbs_g: 5, fat_g: 47, portion_g: 20, category: "épicerie" },
  { dish: "Sauce tomate (nappage)", kcal: 45, protein_g: 1.5, carbs_g: 8, fat_g: 1, portion_g: 100, category: "épicerie" },
  { dish: "Sauce soja", kcal: 53, protein_g: 8, carbs_g: 5, fat_g: 0.6, portion_g: 15, category: "épicerie" },
  { dish: "Sauce curry", kcal: 120, protein_g: 1.5, carbs_g: 8, fat_g: 9, portion_g: 50, category: "épicerie" },
  { dish: "Sauce barbecue", kcal: 172, protein_g: 1, carbs_g: 40, fat_g: 0.5, portion_g: 30, category: "épicerie" },
  { dish: "Sauce piment", kcal: 93, protein_g: 2, carbs_g: 18, fat_g: 1, portion_g: 15, category: "épicerie" },
  { dish: "Bouillon cube (1 unité)", kcal: 15, protein_g: 0.6, carbs_g: 2, fat_g: 0.5, portion_g: 10, category: "épicerie" },
  { dish: "Sucre en poudre", kcal: 400, protein_g: 0, carbs_g: 100, fat_g: 0, portion_g: 10, category: "épicerie" },
  { dish: "Chapelure", kcal: 395, protein_g: 13, carbs_g: 72, fat_g: 5, portion_g: 20, category: "épicerie" },
  { dish: "Pâte feuilletée (portion)", kcal: 335, protein_g: 5, carbs_g: 32, fat_g: 21, portion_g: 50, category: "épicerie" },
  { dish: "Pâte brisée (portion)", kcal: 380, protein_g: 6, carbs_g: 42, fat_g: 21, portion_g: 50, category: "épicerie" },
  // ---- SNACKS SALÉS ----
  { dish: "Bretzels", kcal: 380, protein_g: 10, carbs_g: 79, fat_g: 2.5, portion_g: 30, category: "snack" },
  { dish: "Crackers nature", kcal: 480, protein_g: 9, carbs_g: 65, fat_g: 20, portion_g: 30, category: "snack" },
  { dish: "Tuc", kcal: 500, protein_g: 8, carbs_g: 60, fat_g: 25, portion_g: 30, category: "snack" },
  { dish: "Cacahuètes salées (30g)", kcal: 170, protein_g: 7, carbs_g: 5, fat_g: 14, portion_g: 30, category: "snack" },
  { dish: "Pistaches salées (30g)", kcal: 173, protein_g: 6, carbs_g: 8, fat_g: 14, portion_g: 30, category: "snack" },
  { dish: "Olives vertes (10 pièces)", kcal: 60, protein_g: 0.5, carbs_g: 1, fat_g: 6, portion_g: 30, category: "snack" },
  { dish: "Olives noires (10 pièces)", kcal: 80, protein_g: 0.6, carbs_g: 2, fat_g: 8, portion_g: 30, category: "snack" },
  { dish: "Cornichons (5 pièces)", kcal: 12, protein_g: 0.6, carbs_g: 2, fat_g: 0.1, portion_g: 50, category: "snack" },
  { dish: "Mini-saucisses cocktail", kcal: 260, protein_g: 12, carbs_g: 2, fat_g: 22, portion_g: 60, category: "snack" },
  { dish: "Tapenade", kcal: 300, protein_g: 3, carbs_g: 4, fat_g: 30, portion_g: 30, category: "snack" },
  // ---- DESSERTS / PÂTISSERIES ----
  { dish: "Éclair au chocolat", kcal: 300, protein_g: 5, carbs_g: 30, fat_g: 18, portion_g: 100, category: "dessert" },
  { dish: "Paris-Brest", kcal: 380, protein_g: 6, carbs_g: 30, fat_g: 26, portion_g: 100, category: "dessert" },
  { dish: "Religieuse", kcal: 320, protein_g: 5, carbs_g: 32, fat_g: 19, portion_g: 100, category: "dessert" },
  { dish: "Forêt noire (part)", kcal: 350, protein_g: 4, carbs_g: 38, fat_g: 20, portion_g: 120, category: "dessert" },
  { dish: "Baba au rhum", kcal: 280, protein_g: 4, carbs_g: 35, fat_g: 12, portion_g: 100, category: "dessert" },
  { dish: "Chouquettes (5 pièces)", kcal: 220, protein_g: 4, carbs_g: 24, fat_g: 12, portion_g: 80, category: "dessert" },
  { dish: "Beignet", kcal: 260, protein_g: 4, carbs_g: 30, fat_g: 14, portion_g: 80, category: "dessert" },
  { dish: "Donut glacé", kcal: 300, protein_g: 4, carbs_g: 33, fat_g: 17, portion_g: 80, category: "dessert" },
  { dish: "Cannelé", kcal: 200, protein_g: 3, carbs_g: 28, fat_g: 8, portion_g: 60, category: "dessert" },
  { dish: "Far breton (part)", kcal: 220, protein_g: 5, carbs_g: 30, fat_g: 8, portion_g: 100, category: "dessert" },
  { dish: "Flan pâtissier (part)", kcal: 210, protein_g: 5, carbs_g: 30, fat_g: 8, portion_g: 120, category: "dessert" },
  { dish: "Riz au lait", kcal: 130, protein_g: 4, carbs_g: 20, fat_g: 3.5, portion_g: 150, category: "dessert" },
  { dish: "Panna cotta", kcal: 250, protein_g: 3, carbs_g: 20, fat_g: 17, portion_g: 100, category: "dessert" },
  { dish: "Cheesecake (part)", kcal: 320, protein_g: 5, carbs_g: 28, fat_g: 21, portion_g: 100, category: "dessert" },
  { dish: "Brownie", kcal: 405, protein_g: 5, carbs_g: 45, fat_g: 23, portion_g: 80, category: "dessert" },
  { dish: "Cookie pépites de chocolat", kcal: 480, protein_g: 5, carbs_g: 60, fat_g: 24, portion_g: 60, category: "dessert" },
  { dish: "Muffin chocolat", kcal: 400, protein_g: 5, carbs_g: 50, fat_g: 20, portion_g: 100, category: "dessert" },
  { dish: "Gaufre sucrée", kcal: 291, protein_g: 6, carbs_g: 33, fat_g: 15, portion_g: 100, category: "dessert" },
  { dish: "Crêpe sucrée nature", kcal: 200, protein_g: 5, carbs_g: 30, fat_g: 6, portion_g: 80, category: "dessert" },
  { dish: "Sorbet citron", kcal: 120, protein_g: 0.5, carbs_g: 30, fat_g: 0.1, portion_g: 100, category: "dessert" },
  { dish: "Milkshake vanille", kcal: 220, protein_g: 6, carbs_g: 30, fat_g: 8, portion_g: 250, category: "dessert" },
  { dish: "Tarte aux pommes (part)", kcal: 240, protein_g: 3, carbs_g: 34, fat_g: 10, portion_g: 120, category: "dessert" },
  { dish: "Tarte Tatin (part)", kcal: 260, protein_g: 3, carbs_g: 38, fat_g: 11, portion_g: 120, category: "dessert" },
  { dish: "Île flottante", kcal: 180, protein_g: 5, carbs_g: 24, fat_g: 6, portion_g: 150, category: "dessert" },
  { dish: "Profiteroles", kcal: 340, protein_g: 5, carbs_g: 32, fat_g: 21, portion_g: 120, category: "dessert" },
  // ---- BOISSONS (suite) ----
  { dish: "Café au lait", kcal: 40, protein_g: 2, carbs_g: 3, fat_g: 2, portion_g: 200, category: "boisson" },
  { dish: "Cappuccino", kcal: 80, protein_g: 4, carbs_g: 6, fat_g: 4, portion_g: 200, category: "boisson" },
  { dish: "Chocolat chaud", kcal: 150, protein_g: 6, carbs_g: 18, fat_g: 6, portion_g: 250, category: "boisson" },
  { dish: "Thé noir nature", kcal: 1, protein_g: 0, carbs_g: 0, fat_g: 0, portion_g: 250, category: "boisson" },
  { dish: "Infusion", kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, portion_g: 250, category: "boisson" },
  { dish: "Jus d'ananas", kcal: 53, protein_g: 0.3, carbs_g: 13, fat_g: 0.1, portion_g: 250, category: "boisson" },
  { dish: "Jus de raisin", kcal: 60, protein_g: 0.3, carbs_g: 15, fat_g: 0.1, portion_g: 250, category: "boisson" },
  { dish: "Jus de tomate", kcal: 17, protein_g: 0.8, carbs_g: 3.5, fat_g: 0.1, portion_g: 250, category: "boisson" },
  { dish: "Vin blanc (10cl)", kcal: 82, protein_g: 0.1, carbs_g: 2.6, fat_g: 0, portion_g: 100, category: "boisson" },
  { dish: "Champagne (10cl)", kcal: 80, protein_g: 0.3, carbs_g: 1.5, fat_g: 0, portion_g: 100, category: "boisson" },
  { dish: "Cidre (10cl)", kcal: 40, protein_g: 0, carbs_g: 4.5, fat_g: 0, portion_g: 100, category: "boisson" },
  { dish: "Kombucha", kcal: 30, protein_g: 0, carbs_g: 7, fat_g: 0, portion_g: 250, category: "boisson" },
  { dish: "Eau de coco", kcal: 19, protein_g: 0.7, carbs_g: 3.7, fat_g: 0.2, portion_g: 250, category: "boisson" },
  { dish: "Sirop à l'eau (menthe/grenadine)", kcal: 70, protein_g: 0, carbs_g: 17, fat_g: 0, portion_g: 250, category: "boisson" },
  { dish: "Milkshake fraise", kcal: 210, protein_g: 5, carbs_g: 32, fat_g: 6, portion_g: 250, category: "boisson" },
  { dish: "Thé glacé", kcal: 35, protein_g: 0, carbs_g: 9, fat_g: 0, portion_g: 330, category: "boisson" },
  { dish: "Energy drink", kcal: 45, protein_g: 0, carbs_g: 11, fat_g: 0, portion_g: 250, category: "boisson" },
  // ---- PLATS DU MONDE ----
  { dish: "Paella", kcal: 310, protein_g: 18, carbs_g: 34, fat_g: 11, portion_g: 300, category: "monde" },
  { dish: "Moussaka", kcal: 290, protein_g: 14, carbs_g: 18, fat_g: 18, portion_g: 300, category: "monde" },
  { dish: "Shawarma poulet", kcal: 420, protein_g: 26, carbs_g: 34, fat_g: 20, portion_g: 280, category: "monde" },
  { dish: "Bibimbap", kcal: 350, protein_g: 16, carbs_g: 48, fat_g: 10, portion_g: 350, category: "monde" },
  { dish: "Gyozas (6 pièces)", kcal: 260, protein_g: 10, carbs_g: 30, fat_g: 11, portion_g: 150, category: "monde" },
  { dish: "Dim sum (4 pièces)", kcal: 220, protein_g: 9, carbs_g: 26, fat_g: 9, portion_g: 150, category: "monde" },
  { dish: "Empanadas (2 pièces)", kcal: 320, protein_g: 10, carbs_g: 30, fat_g: 18, portion_g: 150, category: "monde" },
  { dish: "Burrito poulet", kcal: 480, protein_g: 24, carbs_g: 52, fat_g: 18, portion_g: 300, category: "monde" },
  { dish: "Enchiladas", kcal: 380, protein_g: 18, carbs_g: 34, fat_g: 20, portion_g: 250, category: "monde" },
  { dish: "Fajitas poulet", kcal: 350, protein_g: 22, carbs_g: 32, fat_g: 14, portion_g: 300, category: "monde" },
  { dish: "Chili con carne", kcal: 290, protein_g: 18, carbs_g: 26, fat_g: 12, portion_g: 300, category: "monde" },
  { dish: "Goulash", kcal: 280, protein_g: 20, carbs_g: 20, fat_g: 13, portion_g: 300, category: "monde" },
  { dish: "Poutine", kcal: 460, protein_g: 12, carbs_g: 45, fat_g: 26, portion_g: 300, category: "monde" },
  { dish: "Biryani poulet", kcal: 380, protein_g: 20, carbs_g: 48, fat_g: 12, portion_g: 350, category: "monde" },
  { dish: "Tikka masala poulet", kcal: 340, protein_g: 24, carbs_g: 16, fat_g: 20, portion_g: 300, category: "monde" },
  { dish: "Dahl de lentilles", kcal: 200, protein_g: 11, carbs_g: 28, fat_g: 5, portion_g: 250, category: "monde" },
  { dish: "Naan", kcal: 260, protein_g: 8, carbs_g: 46, fat_g: 5, portion_g: 90, category: "monde" },
  { dish: "Pho (soupe vietnamienne)", kcal: 280, protein_g: 18, carbs_g: 36, fat_g: 6, portion_g: 400, category: "monde" },
  { dish: "Bo bun", kcal: 380, protein_g: 20, carbs_g: 45, fat_g: 12, portion_g: 350, category: "monde" },
  { dish: "Poke bowl saumon", kcal: 420, protein_g: 26, carbs_g: 40, fat_g: 16, portion_g: 350, category: "monde" },
  { dish: "Ceviche", kcal: 140, protein_g: 20, carbs_g: 8, fat_g: 3, portion_g: 200, category: "monde" },
  { dish: "Fondue savoyarde (portion)", kcal: 550, protein_g: 28, carbs_g: 8, fat_g: 42, portion_g: 250, category: "monde" },
  { dish: "Raclette (portion)", kcal: 480, protein_g: 26, carbs_g: 12, fat_g: 36, portion_g: 250, category: "monde" },
  // ---- PETIT-DÉJEUNER (suite) ----
  { dish: "Toast avocat", kcal: 260, protein_g: 7, carbs_g: 22, fat_g: 16, portion_g: 150, category: "petit-déjeuner" },
  { dish: "Oeuf à la coque", kcal: 78, protein_g: 6.3, carbs_g: 0.6, fat_g: 5.3, portion_g: 60, category: "petit-déjeuner" },
  { dish: "Oeuf au plat", kcal: 90, protein_g: 6.3, carbs_g: 0.4, fat_g: 7, portion_g: 60, category: "petit-déjeuner" },
  { dish: "Oeuf poché", kcal: 71, protein_g: 6.3, carbs_g: 0.4, fat_g: 4.7, portion_g: 60, category: "petit-déjeuner" },
  { dish: "Bacon-oeufs", kcal: 260, protein_g: 18, carbs_g: 1, fat_g: 20, portion_g: 150, category: "petit-déjeuner" },
  { dish: "Pancakes nature (3)", kcal: 260, protein_g: 7, carbs_g: 40, fat_g: 8, portion_g: 150, category: "petit-déjeuner" },
  { dish: "Waffles (gaufres) nature", kcal: 291, protein_g: 6, carbs_g: 33, fat_g: 15, portion_g: 100, category: "petit-déjeuner" },
  { dish: "Pain perdu", kcal: 230, protein_g: 7, carbs_g: 28, fat_g: 9, portion_g: 100, category: "petit-déjeuner" },
  { dish: "Porridge à la banane", kcal: 210, protein_g: 6, carbs_g: 38, fat_g: 4, portion_g: 200, category: "petit-déjeuner" },
  { dish: "Bircher muesli", kcal: 200, protein_g: 6, carbs_g: 32, fat_g: 5, portion_g: 200, category: "petit-déjeuner" },
  { dish: "Oeufs brouillés au saumon", kcal: 250, protein_g: 20, carbs_g: 2, fat_g: 18, portion_g: 180, category: "petit-déjeuner" },
  // ---- SPORT / NUTRITION SPORTIVE (suite) ----
  { dish: "Barre énergétique", kcal: 220, protein_g: 5, carbs_g: 38, fat_g: 6, portion_g: 45, category: "sport" },
  { dish: "Gel énergétique", kcal: 100, protein_g: 0, carbs_g: 24, fat_g: 0, portion_g: 40, category: "sport" },
  { dish: "Boisson de récupération", kcal: 160, protein_g: 20, carbs_g: 15, fat_g: 2, portion_g: 350, category: "sport" },
  { dish: "BCAA (boisson)", kcal: 10, protein_g: 2, carbs_g: 0, fat_g: 0, portion_g: 300, category: "sport" },
  { dish: "Oeufs durs (2 pièces)", kcal: 155, protein_g: 13, carbs_g: 1, fat_g: 11, portion_g: 120, category: "sport" },
  { dish: "Wrap protéiné poulet", kcal: 380, protein_g: 32, carbs_g: 34, fat_g: 12, portion_g: 250, category: "sport" },
  { dish: "Salade de thon protéinée", kcal: 280, protein_g: 26, carbs_g: 10, fat_g: 14, portion_g: 250, category: "sport" },
  { dish: "Bowl végan protéiné", kcal: 380, protein_g: 18, carbs_g: 42, fat_g: 14, portion_g: 320, category: "sport" },
  { dish: "Porridge protéiné", kcal: 320, protein_g: 26, carbs_g: 34, fat_g: 8, portion_g: 250, category: "sport" },
  { dish: "Rice cakes (galettes de riz, 3)", kcal: 105, protein_g: 2, carbs_g: 24, fat_g: 0.5, portion_g: 30, category: "sport" },
  // ---- CUISINE FRANÇAISE RÉGIONALE (suite) ----
  { dish: "Cassoulet toulousain", kcal: 450, protein_g: 22, carbs_g: 35, fat_g: 24, portion_g: 350, category: "français" },
  { dish: "Pot-au-feu", kcal: 320, protein_g: 28, carbs_g: 15, fat_g: 16, portion_g: 400, category: "français" },
  { dish: "Aligot", kcal: 420, protein_g: 14, carbs_g: 45, fat_g: 20, portion_g: 300, category: "français" },
  { dish: "Bourride", kcal: 280, protein_g: 25, carbs_g: 8, fat_g: 15, portion_g: 350, category: "français" },
  { dish: "Potée auvergnate", kcal: 350, protein_g: 24, carbs_g: 20, fat_g: 18, portion_g: 400, category: "français" },
  { dish: "Kig ha farz", kcal: 400, protein_g: 22, carbs_g: 40, fat_g: 16, portion_g: 350, category: "français" },
  { dish: "Pâté lorrain", kcal: 380, protein_g: 14, carbs_g: 28, fat_g: 24, portion_g: 150, category: "français" },
  { dish: "Baeckeoffe", kcal: 400, protein_g: 24, carbs_g: 25, fat_g: 20, portion_g: 400, category: "français" },
  { dish: "Estouffade provençale", kcal: 320, protein_g: 26, carbs_g: 10, fat_g: 18, portion_g: 350, category: "français" },
  { dish: "Soupe au pistou", kcal: 180, protein_g: 8, carbs_g: 24, fat_g: 6, portion_g: 350, category: "français" },
  { dish: "Pissaladière (part)", kcal: 280, protein_g: 6, carbs_g: 32, fat_g: 14, portion_g: 150, category: "français" },
  // ---- ITALIEN (suite) ----
  { dish: "Osso buco", kcal: 380, protein_g: 30, carbs_g: 8, fat_g: 24, portion_g: 300, category: "italien" },
  { dish: "Saltimbocca alla romana", kcal: 340, protein_g: 32, carbs_g: 2, fat_g: 20, portion_g: 200, category: "italien" },
  { dish: "Risotto au safran (milanais)", kcal: 360, protein_g: 7, carbs_g: 58, fat_g: 9, portion_g: 300, category: "italien" },
  { dish: "Arancini (3 pièces)", kcal: 320, protein_g: 8, carbs_g: 42, fat_g: 12, portion_g: 180, category: "italien" },
  { dish: "Vitello tonnato", kcal: 280, protein_g: 26, carbs_g: 4, fat_g: 16, portion_g: 200, category: "italien" },
  { dish: "Panzanella", kcal: 180, protein_g: 4, carbs_g: 24, fat_g: 8, portion_g: 250, category: "italien" },
  { dish: "Caprese", kcal: 250, protein_g: 14, carbs_g: 6, fat_g: 19, portion_g: 200, category: "italien" },
  { dish: "Focaccia (portion)", kcal: 280, protein_g: 6, carbs_g: 40, fat_g: 10, portion_g: 100, category: "italien" },
  { dish: "Gnocchi al pesto", kcal: 420, protein_g: 10, carbs_g: 55, fat_g: 16, portion_g: 300, category: "italien" },
  { dish: "Cannelloni ricotta épinards", kcal: 380, protein_g: 16, carbs_g: 40, fat_g: 17, portion_g: 300, category: "italien" },
  { dish: "Panettone (part)", kcal: 320, protein_g: 6, carbs_g: 48, fat_g: 11, portion_g: 80, category: "italien" },
  { dish: "Tiramisu (part)", kcal: 350, protein_g: 6, carbs_g: 32, fat_g: 22, portion_g: 130, category: "italien" },
  { dish: "Panna cotta italienne", kcal: 260, protein_g: 3, carbs_g: 22, fat_g: 18, portion_g: 100, category: "italien" },
  { dish: "Bruschetta tomate basilic", kcal: 160, protein_g: 4, carbs_g: 22, fat_g: 6, portion_g: 100, category: "italien" },
  // ---- ASIATIQUE (suite) ----
  { dish: "Ramen porc", kcal: 480, protein_g: 24, carbs_g: 55, fat_g: 18, portion_g: 500, category: "asiatique" },
  { dish: "Ramen miso", kcal: 450, protein_g: 18, carbs_g: 58, fat_g: 16, portion_g: 500, category: "asiatique" },
  { dish: "Pad thaï crevettes", kcal: 420, protein_g: 20, carbs_g: 52, fat_g: 14, portion_g: 350, category: "asiatique" },
  { dish: "Curry vert thaï poulet", kcal: 380, protein_g: 24, carbs_g: 20, fat_g: 22, portion_g: 350, category: "asiatique" },
  { dish: "Curry rouge thaï", kcal: 400, protein_g: 20, carbs_g: 22, fat_g: 26, portion_g: 350, category: "asiatique" },
  { dish: "Riz cantonais", kcal: 380, protein_g: 12, carbs_g: 55, fat_g: 12, portion_g: 300, category: "asiatique" },
  { dish: "Rouleaux de printemps (2)", kcal: 150, protein_g: 6, carbs_g: 22, fat_g: 4, portion_g: 120, category: "asiatique" },
  { dish: "Sushi saumon (8 pièces)", kcal: 320, protein_g: 16, carbs_g: 48, fat_g: 6, portion_g: 240, category: "asiatique" },
  { dish: "Maki avocat (8 pièces)", kcal: 260, protein_g: 5, carbs_g: 50, fat_g: 4, portion_g: 200, category: "asiatique" },
  { dish: "Sashimi saumon (8 pièces)", kcal: 180, protein_g: 26, carbs_g: 0, fat_g: 8, portion_g: 160, category: "asiatique" },
  { dish: "Yakitori poulet (4 brochettes)", kcal: 220, protein_g: 22, carbs_g: 6, fat_g: 12, portion_g: 160, category: "asiatique" },
  { dish: "Teriyaki poulet", kcal: 380, protein_g: 28, carbs_g: 30, fat_g: 14, portion_g: 300, category: "asiatique" },
  { dish: "Tempura crevettes (5)", kcal: 320, protein_g: 14, carbs_g: 28, fat_g: 18, portion_g: 150, category: "asiatique" },
  { dish: "Bo bun boeuf", kcal: 400, protein_g: 22, carbs_g: 46, fat_g: 12, portion_g: 400, category: "asiatique" },
  { dish: "Riz gluant à la mangue", kcal: 320, protein_g: 4, carbs_g: 62, fat_g: 7, portion_g: 200, category: "asiatique" },
  { dish: "Wonton soup", kcal: 220, protein_g: 12, carbs_g: 24, fat_g: 8, portion_g: 350, category: "asiatique" },
  { dish: "Char siu (porc laqué)", kcal: 340, protein_g: 26, carbs_g: 14, fat_g: 20, portion_g: 200, category: "asiatique" },
  { dish: "Canard laqué (portion)", kcal: 380, protein_g: 24, carbs_g: 10, fat_g: 26, portion_g: 200, category: "asiatique" },
  // ---- VÉGÉTARIEN / VÉGAN (suite) ----
  { dish: "Curry de légumes au lait de coco", kcal: 280, protein_g: 6, carbs_g: 28, fat_g: 16, portion_g: 350, category: "végétarien" },
  { dish: "Falafels (5 pièces)", kcal: 320, protein_g: 12, carbs_g: 34, fat_g: 16, portion_g: 150, category: "végétarien" },
  { dish: "Houmous maison + crudités", kcal: 260, protein_g: 8, carbs_g: 24, fat_g: 15, portion_g: 250, category: "végétarien" },
  { dish: "Galette de légumes", kcal: 220, protein_g: 7, carbs_g: 26, fat_g: 9, portion_g: 150, category: "végétarien" },
  { dish: "Tofu grillé mariné", kcal: 180, protein_g: 16, carbs_g: 5, fat_g: 11, portion_g: 150, category: "végétarien" },
  { dish: "Seitan grillé", kcal: 220, protein_g: 30, carbs_g: 8, fat_g: 6, portion_g: 150, category: "végétarien" },
  { dish: "Tempeh sauté", kcal: 240, protein_g: 20, carbs_g: 12, fat_g: 13, portion_g: 150, category: "végétarien" },
  { dish: "Quiche aux légumes", kcal: 320, protein_g: 10, carbs_g: 26, fat_g: 20, portion_g: 150, category: "végétarien" },
  { dish: "Curry de pois chiches", kcal: 300, protein_g: 12, carbs_g: 38, fat_g: 11, portion_g: 300, category: "végétarien" },
  { dish: "Gratin de légumes", kcal: 220, protein_g: 8, carbs_g: 20, fat_g: 12, portion_g: 300, category: "végétarien" },
  { dish: "Wrap végétarien", kcal: 340, protein_g: 11, carbs_g: 44, fat_g: 13, portion_g: 220, category: "végétarien" },
  { dish: "Burger végétal", kcal: 380, protein_g: 18, carbs_g: 38, fat_g: 17, portion_g: 220, category: "végétarien" },
  // ---- PROTÉINES (suite) ----
  { dish: "Steak de thon grillé", kcal: 200, protein_g: 30, carbs_g: 0, fat_g: 8, portion_g: 150, category: "protéine" },
  { dish: "Espadon grillé", kcal: 175, protein_g: 27, carbs_g: 0, fat_g: 6, portion_g: 150, category: "protéine" },
  { dish: "Saumon fumé (4 tranches)", kcal: 180, protein_g: 22, carbs_g: 0, fat_g: 10, portion_g: 80, category: "protéine" },
  { dish: "Oeufs brouillés (3)", kcal: 230, protein_g: 19, carbs_g: 2, fat_g: 17, portion_g: 180, category: "protéine" },
  { dish: "Omelette nature (3 oeufs)", kcal: 260, protein_g: 18, carbs_g: 2, fat_g: 20, portion_g: 180, category: "protéine" },
  { dish: "Blanc d'oeuf (100g)", kcal: 52, protein_g: 11, carbs_g: 0.7, fat_g: 0.2, portion_g: 100, category: "protéine" },
  { dish: "Boeuf haché 5% (150g)", kcal: 210, protein_g: 30, carbs_g: 0, fat_g: 9, portion_g: 150, category: "protéine" },
  { dish: "Confit de canard (cuisse)", kcal: 320, protein_g: 22, carbs_g: 0, fat_g: 26, portion_g: 150, category: "protéine" },
  { dish: "Poitrine de dinde fumée", kcal: 110, protein_g: 20, carbs_g: 1, fat_g: 3, portion_g: 80, category: "protéine" },
  { dish: "Cordon bleu", kcal: 320, protein_g: 22, carbs_g: 14, fat_g: 19, portion_g: 150, category: "protéine" },
  { dish: "Nuggets de poulet (6)", kcal: 280, protein_g: 16, carbs_g: 18, fat_g: 16, portion_g: 120, category: "protéine" },
  { dish: "Poisson blanc vapeur", kcal: 100, protein_g: 21, carbs_g: 0, fat_g: 1.5, portion_g: 150, category: "protéine" },
  // ---- ACCOMPAGNEMENTS (suite) ----
  { dish: "Frites maison", kcal: 312, protein_g: 3.4, carbs_g: 41, fat_g: 14, portion_g: 150, category: "accompagnement" },
  { dish: "Pommes de terre sautées", kcal: 190, protein_g: 3, carbs_g: 26, fat_g: 9, portion_g: 200, category: "accompagnement" },
  { dish: "Riz pilaf", kcal: 200, protein_g: 4, carbs_g: 40, fat_g: 3, portion_g: 200, category: "accompagnement" },
  { dish: "Ratatouille (accompagnement)", kcal: 90, protein_g: 2, carbs_g: 10, fat_g: 5, portion_g: 200, category: "accompagnement" },
  { dish: "Haricots verts vapeur", kcal: 44, protein_g: 2.4, carbs_g: 7, fat_g: 0.2, portion_g: 150, category: "accompagnement" },
  { dish: "Carottes vapeur", kcal: 50, protein_g: 1, carbs_g: 10, fat_g: 0.3, portion_g: 150, category: "accompagnement" },
  { dish: "Épinards à la crème", kcal: 140, protein_g: 5, carbs_g: 8, fat_g: 10, portion_g: 150, category: "accompagnement" },
  { dish: "Poêlée de légumes", kcal: 90, protein_g: 3, carbs_g: 12, fat_g: 4, portion_g: 200, category: "accompagnement" },
  { dish: "Semoule au beurre", kcal: 180, protein_g: 4, carbs_g: 33, fat_g: 4, portion_g: 150, category: "accompagnement" },
  { dish: "Lentilles corail cuites", kcal: 116, protein_g: 9, carbs_g: 20, fat_g: 0.4, portion_g: 150, category: "accompagnement" },
  // ---- PETIT-DÉJEUNER (suite) ----
  { dish: "Croissant nature", kcal: 231, protein_g: 5, carbs_g: 26, fat_g: 12, portion_g: 60, category: "petit-déjeuner" },
  { dish: "Chausson aux pommes", kcal: 260, protein_g: 3, carbs_g: 34, fat_g: 13, portion_g: 90, category: "petit-déjeuner" },
  { dish: "Brioche tranche", kcal: 120, protein_g: 3, carbs_g: 18, fat_g: 4, portion_g: 40, category: "petit-déjeuner" },
  { dish: "Granola maison", kcal: 400, protein_g: 9, carbs_g: 55, fat_g: 16, portion_g: 50, category: "petit-déjeuner" },
  { dish: "Smoothie bowl fruits rouges", kcal: 220, protein_g: 5, carbs_g: 42, fat_g: 4, portion_g: 300, category: "petit-déjeuner" },
  { dish: "Tartine beurre confiture", kcal: 220, protein_g: 5, carbs_g: 34, fat_g: 8, portion_g: 80, category: "petit-déjeuner" },
  { dish: "Pain complet avocat oeuf", kcal: 320, protein_g: 14, carbs_g: 26, fat_g: 18, portion_g: 180, category: "petit-déjeuner" },
  { dish: "Blinis (3) + saumon", kcal: 220, protein_g: 12, carbs_g: 20, fat_g: 10, portion_g: 120, category: "petit-déjeuner" },
  { dish: "Yaourt granola miel", kcal: 260, protein_g: 8, carbs_g: 40, fat_g: 7, portion_g: 220, category: "petit-déjeuner" },
  // ---- DESSERTS (suite) ----
  { dish: "Clafoutis aux cerises", kcal: 220, protein_g: 5, carbs_g: 30, fat_g: 9, portion_g: 150, category: "dessert" },
  { dish: "Tarte au citron meringuée", kcal: 320, protein_g: 4, carbs_g: 44, fat_g: 15, portion_g: 120, category: "dessert" },
  { dish: "Tarte aux fraises", kcal: 260, protein_g: 3, carbs_g: 36, fat_g: 12, portion_g: 120, category: "dessert" },
  { dish: "Macarons (3 pièces)", kcal: 270, protein_g: 4, carbs_g: 40, fat_g: 11, portion_g: 60, category: "dessert" },
  { dish: "Éclair au café", kcal: 300, protein_g: 5, carbs_g: 30, fat_g: 18, portion_g: 100, category: "dessert" },
  { dish: "Fraisier (part)", kcal: 320, protein_g: 5, carbs_g: 38, fat_g: 16, portion_g: 130, category: "dessert" },
  { dish: "Opéra (part)", kcal: 380, protein_g: 6, carbs_g: 34, fat_g: 24, portion_g: 110, category: "dessert" },
  { dish: "Verrine chocolat-poire", kcal: 240, protein_g: 4, carbs_g: 28, fat_g: 13, portion_g: 120, category: "dessert" },
  { dish: "Salade de fruits frais", kcal: 90, protein_g: 1, carbs_g: 22, fat_g: 0.3, portion_g: 200, category: "dessert" },
  // ---- SNACKS (suite) ----
  { dish: "Barre chocolatée type Mars", kcal: 230, protein_g: 2.5, carbs_g: 34, fat_g: 9, portion_g: 51, category: "snack" },
  { dish: "Barre chocolatée type Snickers", kcal: 250, protein_g: 4.5, carbs_g: 30, fat_g: 12, portion_g: 50, category: "snack" },
  { dish: "Gaufrette", kcal: 140, protein_g: 1.5, carbs_g: 18, fat_g: 7, portion_g: 25, category: "snack" },
  { dish: "Pain d'épices tranche", kcal: 90, protein_g: 1.5, carbs_g: 18, fat_g: 1, portion_g: 30, category: "snack" },
  { dish: "Fruits secs mélangés (30g)", kcal: 140, protein_g: 4, carbs_g: 15, fat_g: 8, portion_g: 30, category: "snack" },
  { dish: "Barre de céréales fruits", kcal: 100, protein_g: 1.5, carbs_g: 18, fat_g: 2.5, portion_g: 25, category: "snack" },
  { dish: "Chips de légumes", kcal: 500, protein_g: 5, carbs_g: 55, fat_g: 30, portion_g: 30, category: "snack" },
  { dish: "Rice crackers (galettes salées)", kcal: 380, protein_g: 6, carbs_g: 82, fat_g: 2, portion_g: 30, category: "snack" },
  { dish: "Pop-corn caramel", kcal: 480, protein_g: 4, carbs_g: 78, fat_g: 18, portion_g: 30, category: "snack" },
  // ---- BOISSONS (suite) ----
  { dish: "Smoothie banane fraise", kcal: 130, protein_g: 2, carbs_g: 28, fat_g: 1, portion_g: 250, category: "boisson" },
  { dish: "Smoothie mangue passion", kcal: 140, protein_g: 1.5, carbs_g: 32, fat_g: 0.5, portion_g: 250, category: "boisson" },
  { dish: "Jus d'orange frais", kcal: 45, protein_g: 0.7, carbs_g: 10, fat_g: 0.2, portion_g: 250, category: "boisson" },
  { dish: "Jus multifruits", kcal: 48, protein_g: 0.3, carbs_g: 11, fat_g: 0.1, portion_g: 250, category: "boisson" },
  { dish: "Limonade artisanale", kcal: 42, protein_g: 0, carbs_g: 10, fat_g: 0, portion_g: 330, category: "boisson" },
  { dish: "Thé glacé pêche", kcal: 32, protein_g: 0, carbs_g: 8, fat_g: 0, portion_g: 330, category: "boisson" },
  { dish: "Café allongé", kcal: 2, protein_g: 0.3, carbs_g: 0, fat_g: 0, portion_g: 200, category: "boisson" },
  { dish: "Espresso", kcal: 3, protein_g: 0.1, carbs_g: 0.5, fat_g: 0, portion_g: 30, category: "boisson" },
  { dish: "Latte macchiato", kcal: 120, protein_g: 6, carbs_g: 12, fat_g: 5, portion_g: 250, category: "boisson" },
  { dish: "Frappuccino", kcal: 250, protein_g: 4, carbs_g: 42, fat_g: 8, portion_g: 350, category: "boisson" },
  { dish: "Boisson protéinée chocolat", kcal: 160, protein_g: 25, carbs_g: 8, fat_g: 3, portion_g: 330, category: "boisson" },
  { dish: "Kéfir", kcal: 41, protein_g: 3.3, carbs_g: 4.5, fat_g: 1, portion_g: 250, category: "boisson" },
  // ---- SALADES (suite) ----
  { dish: "Salade César poulet", kcal: 420, protein_g: 30, carbs_g: 18, fat_g: 25, portion_g: 350, category: "salade" },
  { dish: "Salade grecque", kcal: 280, protein_g: 10, carbs_g: 12, fat_g: 22, portion_g: 300, category: "salade" },
  { dish: "Salade de quinoa légumes", kcal: 320, protein_g: 10, carbs_g: 42, fat_g: 12, portion_g: 300, category: "salade" },
  { dish: "Salade de chèvre chaud", kcal: 380, protein_g: 14, carbs_g: 22, fat_g: 26, portion_g: 250, category: "salade" },
  { dish: "Salade de lentilles", kcal: 280, protein_g: 14, carbs_g: 34, fat_g: 9, portion_g: 300, category: "salade" },
  // ---- SANDWICHS (suite) ----
  { dish: "Club sandwich", kcal: 480, protein_g: 26, carbs_g: 40, fat_g: 24, portion_g: 280, category: "sandwich" },
  { dish: "Bagel saumon fromage frais", kcal: 420, protein_g: 20, carbs_g: 44, fat_g: 18, portion_g: 220, category: "sandwich" },
  { dish: "Panini jambon fromage", kcal: 420, protein_g: 20, carbs_g: 40, fat_g: 20, portion_g: 200, category: "sandwich" },
  { dish: "Croque-monsieur", kcal: 400, protein_g: 20, carbs_g: 30, fat_g: 22, portion_g: 180, category: "sandwich" },
  { dish: "Croque-madame", kcal: 450, protein_g: 23, carbs_g: 30, fat_g: 26, portion_g: 200, category: "sandwich" },
  // ---- SOUPES (suite) ----
  { dish: "Soupe à l'oignon gratinée", kcal: 280, protein_g: 12, carbs_g: 24, fat_g: 15, portion_g: 300, category: "soupe" },
  { dish: "Velouté de champignons", kcal: 130, protein_g: 3, carbs_g: 12, fat_g: 8, portion_g: 300, category: "soupe" },
  { dish: "Gaspacho", kcal: 60, protein_g: 1.5, carbs_g: 10, fat_g: 1.5, portion_g: 300, category: "soupe" },
  { dish: "Bouillon de légumes", kcal: 25, protein_g: 1, carbs_g: 4, fat_g: 0.2, portion_g: 300, category: "soupe" },
  { dish: "Soupe de lentilles corail", kcal: 180, protein_g: 10, carbs_g: 28, fat_g: 3, portion_g: 300, category: "soupe" },
  // ---- FAST-FOOD (suite) ----
  { dish: "Hamburger classique", kcal: 480, protein_g: 24, carbs_g: 38, fat_g: 26, portion_g: 220, category: "fast-food" },
  { dish: "Cheeseburger double", kcal: 650, protein_g: 36, carbs_g: 40, fat_g: 38, portion_g: 280, category: "fast-food" },
  { dish: "Chicken burger", kcal: 520, protein_g: 26, carbs_g: 44, fat_g: 26, portion_g: 240, category: "fast-food" },
  { dish: "Hot-dog", kcal: 380, protein_g: 14, carbs_g: 32, fat_g: 22, portion_g: 180, category: "fast-food" },
  { dish: "Tacos français (viande+frites)", kcal: 780, protein_g: 30, carbs_g: 70, fat_g: 40, portion_g: 400, category: "fast-food" },
  { dish: "Pizza margherita (part)", kcal: 250, protein_g: 10, carbs_g: 30, fat_g: 10, portion_g: 150, category: "fast-food" },
  { dish: "Pizza 4 fromages (part)", kcal: 300, protein_g: 13, carbs_g: 28, fat_g: 16, portion_g: 150, category: "fast-food" },
  { dish: "Pizza pepperoni (part)", kcal: 310, protein_g: 13, carbs_g: 28, fat_g: 17, portion_g: 150, category: "fast-food" },
  { dish: "Onion rings (6)", kcal: 280, protein_g: 4, carbs_g: 34, fat_g: 14, portion_g: 100, category: "fast-food" },
  { dish: "Nuggets sauce (6)", kcal: 340, protein_g: 16, carbs_g: 22, fat_g: 21, portion_g: 150, category: "fast-food" },
  // ---- SPORT (suite) ----
  { dish: "Shake protéiné whey", kcal: 130, protein_g: 24, carbs_g: 3, fat_g: 2, portion_g: 300, category: "sport" },
  { dish: "Barre protéinée chocolat", kcal: 200, protein_g: 20, carbs_g: 18, fat_g: 7, portion_g: 50, category: "sport" },
  { dish: "Riz + poulet + brocoli (bowl fitness)", kcal: 480, protein_g: 40, carbs_g: 55, fat_g: 8, portion_g: 400, category: "sport" },
  { dish: "Omelette blancs d'oeufs légumes", kcal: 180, protein_g: 24, carbs_g: 6, fat_g: 6, portion_g: 250, category: "sport" },
  { dish: "Overnight oats protéinés", kcal: 380, protein_g: 28, carbs_g: 45, fat_g: 9, portion_g: 300, category: "sport" },
  { dish: "Pancakes avoine banane", kcal: 320, protein_g: 14, carbs_g: 48, fat_g: 8, portion_g: 200, category: "sport" },
  { dish: "Boisson BCAA", kcal: 5, protein_g: 1, carbs_g: 0, fat_g: 0, portion_g: 300, category: "sport" },
  { dish: "Créatine (dose)", kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, portion_g: 5, category: "sport" },
  // ---- ÉPICERIE / MARQUES (suite) ----
  { dish: "Boursin cuisine (crème culinaire)", kcal: 180, protein_g: 3, carbs_g: 4, fat_g: 17, portion_g: 100, category: "épicerie" },
  { dish: "Vache qui rit (portion)", kcal: 190, protein_g: 8, carbs_g: 3, fat_g: 16, portion_g: 20, category: "épicerie" },
  { dish: "Kiri (portion)", kcal: 260, protein_g: 7, carbs_g: 3, fat_g: 24, portion_g: 20, category: "épicerie" },
  { dish: "Babybel", kcal: 300, protein_g: 24, carbs_g: 0, fat_g: 24, portion_g: 20, category: "épicerie" },
  { dish: "Philadelphia nature", kcal: 253, protein_g: 5, carbs_g: 4, fat_g: 24, portion_g: 30, category: "épicerie" },
  { dish: "St Môret", kcal: 235, protein_g: 6, carbs_g: 3, fat_g: 22, portion_g: 30, category: "épicerie" },
  { dish: "Danette chocolat", kcal: 130, protein_g: 3, carbs_g: 20, fat_g: 4, portion_g: 125, category: "épicerie" },
  { dish: "Danonino", kcal: 90, protein_g: 4, carbs_g: 13, fat_g: 2, portion_g: 100, category: "épicerie" },
  { dish: "Activia nature", kcal: 65, protein_g: 4, carbs_g: 5, fat_g: 3, portion_g: 125, category: "épicerie" },
  { dish: "Actimel", kcal: 75, protein_g: 3, carbs_g: 12, fat_g: 1.5, portion_g: 100, category: "épicerie" },
  // ---- BOISSONS (suite) ----
  { dish: "Perrier tranche", kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, portion_g: 330, category: "boisson" },
  { dish: "Orangina", kcal: 45, protein_g: 0.2, carbs_g: 11, fat_g: 0, portion_g: 330, category: "boisson" },
  { dish: "Oasis tropical", kcal: 45, protein_g: 0, carbs_g: 11, fat_g: 0, portion_g: 330, category: "boisson" },
  { dish: "Schweppes agrumes", kcal: 38, protein_g: 0, carbs_g: 9.5, fat_g: 0, portion_g: 330, category: "boisson" },
  { dish: "Red Bull", kcal: 45, protein_g: 0, carbs_g: 11, fat_g: 0, portion_g: 250, category: "boisson" },
  { dish: "Ricoré", kcal: 40, protein_g: 2, carbs_g: 6, fat_g: 1, portion_g: 200, category: "boisson" },
  { dish: "Nesquik prêt à boire", kcal: 75, protein_g: 3, carbs_g: 12, fat_g: 1.5, portion_g: 200, category: "boisson" },
  // ---- ÉPICERIE / MARQUES (suite) ----
  { dish: "Nutri Grain barre", kcal: 120, protein_g: 2, carbs_g: 21, fat_g: 3, portion_g: 37, category: "épicerie" },
  { dish: "Pim's LU", kcal: 130, protein_g: 1, carbs_g: 21, fat_g: 5, portion_g: 30, category: "épicerie" },
  { dish: "Granola LU", kcal: 130, protein_g: 1.5, carbs_g: 18, fat_g: 6, portion_g: 25, category: "épicerie" },
  { dish: "Barquette Milka", kcal: 90, protein_g: 1, carbs_g: 11, fat_g: 4.5, portion_g: 20, category: "épicerie" },
  { dish: "Milka tablette (30g)", kcal: 160, protein_g: 2, carbs_g: 17, fat_g: 9, portion_g: 30, category: "épicerie" },
  { dish: "Lindt tablette (30g)", kcal: 170, protein_g: 2, carbs_g: 15, fat_g: 11, portion_g: 30, category: "épicerie" },
  { dish: "Ferrero Rocher (2 pièces)", kcal: 150, protein_g: 2, carbs_g: 11, fat_g: 11, portion_g: 25, category: "épicerie" },
  { dish: "Toblerone (30g)", kcal: 155, protein_g: 2, carbs_g: 17, fat_g: 9, portion_g: 30, category: "épicerie" },
  { dish: "Daim (barre)", kcal: 200, protein_g: 1.5, carbs_g: 24, fat_g: 11, portion_g: 40, category: "épicerie" },
  { dish: "Bounty (barre)", kcal: 240, protein_g: 2, carbs_g: 27, fat_g: 13, portion_g: 57, category: "épicerie" },
  { dish: "Twix (barre)", kcal: 250, protein_g: 2.5, carbs_g: 34, fat_g: 12, portion_g: 50, category: "épicerie" },
  { dish: "Lion (barre)", kcal: 245, protein_g: 3, carbs_g: 32, fat_g: 11, portion_g: 42, category: "épicerie" },
  { dish: "Crunch (tablette 30g)", kcal: 160, protein_g: 2, carbs_g: 18, fat_g: 8, portion_g: 30, category: "épicerie" },
  { dish: "Petit écolier LU (4)", kcal: 160, protein_g: 2, carbs_g: 20, fat_g: 8, portion_g: 32, category: "épicerie" },
  { dish: "Génoise Savane (part)", kcal: 130, protein_g: 2, carbs_g: 17, fat_g: 6, portion_g: 33, category: "épicerie" },
  { dish: "Barre Fitness Nestlé", kcal: 90, protein_g: 1.5, carbs_g: 16, fat_g: 2, portion_g: 23, category: "épicerie" },
  { dish: "Yop nature", kcal: 130, protein_g: 5, carbs_g: 18, fat_g: 3, portion_g: 250, category: "épicerie" },
  { dish: "Fjord Yoplait", kcal: 130, protein_g: 8, carbs_g: 15, fat_g: 4, portion_g: 150, category: "épicerie" },
  { dish: "Panier de Yoplait", kcal: 130, protein_g: 4, carbs_g: 21, fat_g: 3, portion_g: 130, category: "épicerie" },
  { dish: "Compote Pom'Potes", kcal: 60, protein_g: 0.3, carbs_g: 14, fat_g: 0.1, portion_g: 90, category: "épicerie" },
  { dish: "Pom'Potes fraise", kcal: 65, protein_g: 0.3, carbs_g: 15, fat_g: 0.1, portion_g: 90, category: "épicerie" },
  { dish: "Petit Filous", kcal: 220, protein_g: 6, carbs_g: 32, fat_g: 6, portion_g: 130, category: "épicerie" },
  { dish: "Gervita", kcal: 200, protein_g: 5, carbs_g: 25, fat_g: 8, portion_g: 100, category: "épicerie" },
  { dish: "Boursin ail fines herbes (portion)", kcal: 130, protein_g: 2.5, carbs_g: 1, fat_g: 13, portion_g: 20, category: "épicerie" },
  { dish: "Sauce curry Amora", kcal: 110, protein_g: 1, carbs_g: 6, fat_g: 9, portion_g: 30, category: "épicerie" },
  { dish: "Mayonnaise Amora", kcal: 690, protein_g: 1, carbs_g: 3, fat_g: 76, portion_g: 15, category: "épicerie" },
  { dish: "Ketchup Heinz", kcal: 112, protein_g: 1.2, carbs_g: 26.7, fat_g: 0.2, portion_g: 15, category: "épicerie" },
  { dish: "Cornichons Amora (portion)", kcal: 12, protein_g: 0.5, carbs_g: 2, fat_g: 0.1, portion_g: 30, category: "épicerie" },
  { dish: "Pesto Barilla", kcal: 450, protein_g: 4, carbs_g: 6, fat_g: 45, portion_g: 20, category: "épicerie" },
  { dish: "Sauce bolognaise Panzani", kcal: 65, protein_g: 4, carbs_g: 7, fat_g: 2.5, portion_g: 250, category: "épicerie" },
  // ---- CÉRÉALES (suite) ----
  { dish: "Pâtes Barilla cuites", kcal: 158, protein_g: 5.7, carbs_g: 31, fat_g: 1.3, portion_g: 100, category: "céréale" },
  { dish: "Riz Uncle Ben's cuit", kcal: 130, protein_g: 2.6, carbs_g: 28, fat_g: 0.3, portion_g: 150, category: "céréale" },
  { dish: "Céréales Chocapic", kcal: 385, protein_g: 6, carbs_g: 78, fat_g: 6, portion_g: 30, category: "céréale" },
  { dish: "Céréales Miel Pops", kcal: 380, protein_g: 5, carbs_g: 85, fat_g: 1, portion_g: 30, category: "céréale" },
  { dish: "Céréales Frosties", kcal: 375, protein_g: 5, carbs_g: 87, fat_g: 0.5, portion_g: 30, category: "céréale" },
  { dish: "Céréales Spécial K", kcal: 378, protein_g: 15, carbs_g: 75, fat_g: 1.5, portion_g: 30, category: "céréale" },
  { dish: "Céréales All-Bran", kcal: 260, protein_g: 10, carbs_g: 46, fat_g: 3.5, portion_g: 40, category: "céréale" },
  { dish: "Biscottes Heudebert", kcal: 415, protein_g: 10, carbs_g: 74, fat_g: 6, portion_g: 20, category: "céréale" },
  { dish: "Pain de mie complet Harrys", kcal: 230, protein_g: 9, carbs_g: 40, fat_g: 3, portion_g: 50, category: "céréale" },
  // ---- PLATS PRÉPARÉS / SURGELÉS ----
  { dish: "Lasagnes surgelées (portion)", kcal: 180, protein_g: 9, carbs_g: 18, fat_g: 8, portion_g: 350, category: "français" },
  { dish: "Hachis parmentier surgelé", kcal: 150, protein_g: 7, carbs_g: 15, fat_g: 7, portion_g: 300, category: "français" },
  // ---- PLATS PRÉPARÉS / SURGELÉS (suite) ----
  { dish: "Pizza surgelée jambon (part)", kcal: 240, protein_g: 10, carbs_g: 28, fat_g: 10, portion_g: 150, category: "fast-food" },
  { dish: "Nuggets surgelés (6)", kcal: 260, protein_g: 14, carbs_g: 20, fat_g: 15, portion_g: 120, category: "fast-food" },
  // ---- PROTÉINES (suite) ----
  { dish: "Cordon bleu surgelé", kcal: 250, protein_g: 16, carbs_g: 12, fat_g: 15, portion_g: 120, category: "protéine" },
  // ---- PLATS PRÉPARÉS (suite) ----
  { dish: "Poêlée asiatique surgelée", kcal: 90, protein_g: 4, carbs_g: 12, fat_g: 3, portion_g: 300, category: "asiatique" },
  // ---- LÉGUMES (suite) ----
  { dish: "Wok de légumes surgelé", kcal: 60, protein_g: 2, carbs_g: 9, fat_g: 1.5, portion_g: 300, category: "légume" },
  // ---- PLATS PRÉPARÉS / SURGELÉS ----
  { dish: "Quenelles nature", kcal: 220, protein_g: 10, carbs_g: 18, fat_g: 12, portion_g: 150, category: "français" },
  // ---- PLATS PRÉPARÉS (suite) ----
  { dish: "Raviolis en boîte", kcal: 100, protein_g: 3.5, carbs_g: 16, fat_g: 2.5, portion_g: 250, category: "italien" },
  // ---- PLATS PRÉPARÉS / SURGELÉS ----
  { dish: "Cassoulet en conserve", kcal: 140, protein_g: 7, carbs_g: 12, fat_g: 7, portion_g: 300, category: "français" },
  // ---- PLATS PRÉPARÉS (suite) ----
  { dish: "Chili con carne en boîte", kcal: 110, protein_g: 7, carbs_g: 12, fat_g: 4, portion_g: 300, category: "monde" },
  // ---- FRUITS (suite) ----
  { dish: "Prune", kcal: 46, protein_g: 0.7, carbs_g: 11, fat_g: 0.3, portion_g: 100, category: "fruit" },
  { dish: "Nashi (poire asiatique)", kcal: 42, protein_g: 0.5, carbs_g: 11, fat_g: 0.2, portion_g: 100, category: "fruit" },
  { dish: "Kumquat", kcal: 71, protein_g: 1.9, carbs_g: 16, fat_g: 0.9, portion_g: 100, category: "fruit" },
  { dish: "Longane", kcal: 60, protein_g: 1.3, carbs_g: 15, fat_g: 0.1, portion_g: 100, category: "fruit" },
  { dish: "Ramboutan", kcal: 68, protein_g: 0.9, carbs_g: 16, fat_g: 0.2, portion_g: 100, category: "fruit" },
  { dish: "Jacque (jackfruit)", kcal: 95, protein_g: 1.7, carbs_g: 23, fat_g: 0.6, portion_g: 100, category: "fruit" },
  // ---- LÉGUMES (suite) ----
  { dish: "Chayotte cuite", kcal: 19, protein_g: 0.8, carbs_g: 4.5, fat_g: 0.1, portion_g: 100, category: "légume" },
  { dish: "Bette à carde", kcal: 19, protein_g: 1.8, carbs_g: 3.7, fat_g: 0.2, portion_g: 100, category: "légume" },
  { dish: "Chou kale cru", kcal: 49, protein_g: 4.3, carbs_g: 8.8, fat_g: 0.9, portion_g: 100, category: "légume" },
  { dish: "Chou romanesco cuit", kcal: 28, protein_g: 3, carbs_g: 5, fat_g: 0.3, portion_g: 100, category: "légume" },
  { dish: "Poivron grillé", kcal: 37, protein_g: 1.2, carbs_g: 7, fat_g: 0.5, portion_g: 100, category: "légume" },
  { dish: "Tomates séchées (30g)", kcal: 85, protein_g: 3, carbs_g: 18, fat_g: 1, portion_g: 30, category: "légume" },
  { dish: "Tomates cerises", kcal: 18, protein_g: 0.9, carbs_g: 3.9, fat_g: 0.2, portion_g: 100, category: "légume" },
  { dish: "Courge spaghetti cuite", kcal: 27, protein_g: 0.6, carbs_g: 6.5, fat_g: 0.5, portion_g: 150, category: "légume" },
  // ---- PROTÉINES (suite) ----
  { dish: "Rôti de boeuf froid", kcal: 180, protein_g: 28, carbs_g: 0, fat_g: 7, portion_g: 100, category: "protéine" },
  { dish: "Paupiette de veau", kcal: 220, protein_g: 20, carbs_g: 4, fat_g: 14, portion_g: 150, category: "protéine" },
  { dish: "Jarret de porc", kcal: 250, protein_g: 24, carbs_g: 0, fat_g: 17, portion_g: 200, category: "protéine" },
  { dish: "Travers de porc grillés", kcal: 320, protein_g: 22, carbs_g: 0, fat_g: 25, portion_g: 200, category: "protéine" },
  { dish: "Pilon de poulet rôti", kcal: 180, protein_g: 24, carbs_g: 0, fat_g: 9, portion_g: 120, category: "protéine" },
  { dish: "Foie gras (30g)", kcal: 130, protein_g: 3, carbs_g: 1, fat_g: 13, portion_g: 30, category: "protéine" },
  { dish: "Rillettes de thon", kcal: 220, protein_g: 18, carbs_g: 1, fat_g: 16, portion_g: 60, category: "protéine" },
  // ---- POISSONS (suite) ----
  { dish: "Tarama maison", kcal: 350, protein_g: 5, carbs_g: 5, fat_g: 35, portion_g: 30, category: "poisson" },
  { dish: "Brandade de morue", kcal: 220, protein_g: 12, carbs_g: 14, fat_g: 13, portion_g: 200, category: "poisson" },
  { dish: "Quenelle de brochet", kcal: 190, protein_g: 9, carbs_g: 16, fat_g: 10, portion_g: 150, category: "poisson" },
  // ---- LÉGUMINEUSES (suite) ----
  { dish: "Houmous nature (portion)", kcal: 166, protein_g: 4, carbs_g: 8, fat_g: 13, portion_g: 50, category: "légumineuse" },
  { dish: "Falafel maison (3 pièces)", kcal: 210, protein_g: 8, carbs_g: 22, fat_g: 10, portion_g: 90, category: "légumineuse" },
  { dish: "Dahl de lentilles corail", kcal: 180, protein_g: 10, carbs_g: 26, fat_g: 3, portion_g: 250, category: "légumineuse" },
  // ---- OLÉAGINEUX (suite) ----
  { dish: "Amandes effilées (20g)", kcal: 118, protein_g: 4.3, carbs_g: 4.4, fat_g: 10, portion_g: 20, category: "oléagineux" },
  { dish: "Purée d'amandes", kcal: 614, protein_g: 21, carbs_g: 19, fat_g: 56, portion_g: 30, category: "oléagineux" },
  { dish: "Purée de noisettes", kcal: 646, protein_g: 15, carbs_g: 17, fat_g: 60, portion_g: 30, category: "oléagineux" },
  { dish: "Tahini (purée de sésame)", kcal: 595, protein_g: 17, carbs_g: 21, fat_g: 54, portion_g: 30, category: "oléagineux" },
  // ---- DESSERTS (suite) ----
  { dish: "Baba au rhum (part)", kcal: 290, protein_g: 4, carbs_g: 36, fat_g: 12, portion_g: 100, category: "dessert" },
  { dish: "Kouign-amann (part)", kcal: 420, protein_g: 5, carbs_g: 42, fat_g: 26, portion_g: 100, category: "dessert" },
  { dish: "Paris-brest (part)", kcal: 400, protein_g: 6, carbs_g: 32, fat_g: 27, portion_g: 110, category: "dessert" },
  { dish: "Religieuse au café", kcal: 330, protein_g: 5, carbs_g: 33, fat_g: 20, portion_g: 100, category: "dessert" },
  { dish: "Number cake (part)", kcal: 350, protein_g: 5, carbs_g: 40, fat_g: 18, portion_g: 120, category: "dessert" },
  { dish: "Cookie géant", kcal: 520, protein_g: 6, carbs_g: 62, fat_g: 26, portion_g: 100, category: "dessert" },
  { dish: "Muffin myrtille", kcal: 380, protein_g: 5, carbs_g: 48, fat_g: 18, portion_g: 100, category: "dessert" },
  { dish: "Cheesecake New-York (part)", kcal: 340, protein_g: 6, carbs_g: 30, fat_g: 22, portion_g: 110, category: "dessert" },
  { dish: "Red velvet cake (part)", kcal: 380, protein_g: 5, carbs_g: 46, fat_g: 19, portion_g: 120, category: "dessert" },
  { dish: "Carrot cake (part)", kcal: 360, protein_g: 5, carbs_g: 44, fat_g: 18, portion_g: 120, category: "dessert" },
  // ---- BOISSONS (suite) ----
  { dish: "Thé vert nature", kcal: 1, protein_g: 0, carbs_g: 0, fat_g: 0, portion_g: 250, category: "boisson" },
  { dish: "Chocolat chaud viennois", kcal: 220, protein_g: 7, carbs_g: 24, fat_g: 11, portion_g: 250, category: "boisson" },
  { dish: "Matcha latte", kcal: 130, protein_g: 5, carbs_g: 18, fat_g: 4, portion_g: 250, category: "boisson" },
  { dish: "Chai latte", kcal: 150, protein_g: 5, carbs_g: 24, fat_g: 4, portion_g: 250, category: "boisson" },
  { dish: "Golden latte (curcuma)", kcal: 110, protein_g: 3, carbs_g: 14, fat_g: 5, portion_g: 250, category: "boisson" },
  { dish: "Bissap (hibiscus)", kcal: 40, protein_g: 0, carbs_g: 10, fat_g: 0, portion_g: 250, category: "boisson" },
  { dish: "Thé à la menthe marocain", kcal: 60, protein_g: 0, carbs_g: 15, fat_g: 0, portion_g: 200, category: "boisson" },
];

const CATEGORY_EMOJIS = {
  "français": "🇫🇷", "italien": "🇮🇹", "asiatique": "🍜", "végétarien": "🥗",
  "protéine": "🥩", "accompagnement": "🍚", "petit-déjeuner": "🥐", "dessert": "🍰",
  "snack": "🥜", "boisson": "🥤", "fast-food": "🍔", "soupe": "🍲",
  "sandwich": "🥪", "salade": "🥬", "sport": "💪",
  "fruit": "🍎", "légume": "🥦", "laitier": "🧀", "céréale": "🌾", "épicerie": "🛒",
  "poisson": "🐟", "légumineuse": "🫘", "oléagineux": "🌰", "monde": "🌍",
};

function searchFood(query) {
  if (!query || query.trim().length < 1) return [];
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return FOOD_DATABASE
    .map((item) => {
      const dishNorm = item.dish.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const catNorm = item.category.toLowerCase();
      let score = 0;
      if (dishNorm === q) score = 100;
      else if (dishNorm.startsWith(q)) score = 80;
      else if (dishNorm.includes(q)) score = 60;
      else if (catNorm.includes(q)) score = 40;
      else if (q.length >= 2) {
        const words = dishNorm.split(/\s+/);
        for (const w of words) {
          if (w.startsWith(q)) { score = 50; break; }
          if (w.includes(q)) { score = 30; break; }
        }
      }
      return { ...item, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

function adjustPortion(food, targetPortionG) {
  const ratio = targetPortionG / food.portion_g;
  return {
    ...food,
    portion_g: targetPortionG,
    kcal: Math.round(food.kcal * ratio),
    protein_g: Math.round(food.protein_g * ratio * 10) / 10,
    carbs_g: Math.round(food.carbs_g * ratio * 10) / 10,
    fat_g: Math.round(food.fat_g * ratio * 10) / 10,
  };
}

// ---------- ÉCRAN SCAN CODE-BARRES (CameraView native Expo SDK 52+) ----------
function BarcodeScanScreen({ go, goBack, params }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [fallbackQuery, setFallbackQuery] = useState('');
  const [scanPortions, setScanPortions] = useState(1);
  const [scanPortionWeight, setScanPortionWeight] = useState('');

  const onAddProduct = params?.onAddProduct;
  const fallbackResults = fallbackQuery.trim().length > 0 ? searchFood(fallbackQuery) : [];

  useEffect(() => {
    (async () => {
      const h = await getProductHistory();
      setHistory(h);
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    setError(null);

    const result = await fetchProductFromBarcode(data);
    setLoading(false);

    if (result) {
      setProduct(result);
      setScanPortions(1);
      setScanPortionWeight(String(result.portion_g || ''));
      const h = await getProductHistory();
      setHistory(h);
    } else {
      setError(`Produit non trouvé dans la base Open Food Facts.\nCode: ${data}`);
    }
  };

  const handleAddToLog = () => {
    if (product && onAddProduct) {
      onAddProduct(product, scanPortions, scanPortionWeight || product.portion_g);
      goBack();
    }
  };

  const handleSelectFromHistory = (item) => {
    const historyProduct = {
      barcode: item.barcode,
      dish: item.name,
      brand: item.brand,
      portion_g: item.portion_g,
      kcal: item.kcal,
      protein_g: item.protein_g,
      carbs_g: item.carbs_g,
      fat_g: item.fat_g,
      fromCache: true,
    };
    setProduct(historyProduct);
    setShowHistory(false);
  };

  const handleSelectFromDatabase = (food) => {
    const searchProduct = {
      barcode: `local-${food.dish.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}`,
      dish: food.dish,
      brand: '',
      portion_g: food.portion_g,
      kcal: food.kcal,
      protein_g: food.protein_g,
      carbs_g: food.carbs_g,
      fat_g: food.fat_g,
      kcal_per_100g: Math.round((food.kcal / food.portion_g) * 100),
      protein_per_100g: Math.round(((food.protein_g / food.portion_g) * 100) * 10) / 10,
      carbs_per_100g: Math.round(((food.carbs_g / food.portion_g) * 100) * 10) / 10,
      fat_per_100g: Math.round(((food.fat_g / food.portion_g) * 100) * 10) / 10,
      fromCache: false,
      fromSearch: true,
    };
    setProduct(searchProduct);
    setScanPortions(1);
    setScanPortionWeight(String(food.portion_g || ''));
    setError(null);
    setFallbackQuery('');
  };

  // Écran de demande de permission
  if (!permission) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B14', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={C.primary} size="large" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Demande de permission caméra...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B14', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Ionicons name="camera-outline" size={64} color={C.primary} />
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 16, textAlign: 'center' }}>Caméra requise</Text>
        <Text style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 8 }}>
          Autorise l'accès à la caméra pour scanner les codes-barres de tes produits alimentaires.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={{ marginTop: 24 }}>
          <Grad colors={C.gradOrangePink} style={[s.startBtn, { paddingHorizontal: 32 }]}>
            <Text style={s.startText}>📷 AUTORISER</Text>
          </Grad>
        </TouchableOpacity>
        <TouchableOpacity onPress={goBack} style={{ marginTop: 16 }}>
          <Text style={{ color: C.light, fontSize: 14 }}>← Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B14' }}>
      <Header title="Scanner un produit" onBack={goBack} />

      {/* Toggle historique */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 }}>
        <TouchableOpacity
          onPress={() => setShowHistory(false)}
          style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: !showHistory ? C.primary : 'rgba(255,255,255,0.06)' }}
        >
          <Text style={{ fontWeight: '800', fontSize: 12, color: !showHistory ? '#fff' : 'rgba(255,255,255,0.5)' }}>📷 SCANNER</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowHistory(true)}
          style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: showHistory ? C.primary : 'rgba(255,255,255,0.06)' }}
        >
          <Text style={{ fontWeight: '800', fontSize: 12, color: showHistory ? '#fff' : 'rgba(255,255,255,0.5)' }}>
            📜 HISTORIQUE ({history.length})
          </Text>
        </TouchableOpacity>
      </View>

      {!showHistory ? (
        <>
          {/* Zone de scan avec CameraView */}
          <View style={{ flex: 1, marginHorizontal: 16, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: C.primary }}>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['ean13', 'ean8', 'upc_e'],
              }}
            />

            {/* Overlay de scan */}
            <View style={{ position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center' }} pointerEvents="none">
              <View style={{ width: 260, height: 160, borderWidth: 2, borderColor: 'rgba(91,79,233,0.8)', borderRadius: 20, borderStyle: 'dashed' }} />
              <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: 16, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 }}>
                Place le code-barres dans le cadre
              </Text>
            </View>
          </View>

          {/* Résultat du scan */}
          {loading ? (
            <View style={{ margin: 16, padding: 20, backgroundColor: C.card, borderRadius: 20, alignItems: 'center' }}>
              <ActivityIndicator color={C.primary} size="large" />
              <Text style={{ color: C.dark, fontWeight: '700', marginTop: 12 }}>Recherche du produit...</Text>
              <Text style={{ color: C.gray, fontSize: 12, marginTop: 4 }}>Open Food Facts</Text>
            </View>
          ) : error ? (
            <View style={{ margin: 16, padding: 20, backgroundColor: '#FEE2E2', borderRadius: 20, borderWidth: 1, borderColor: '#FCA5A5' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="warning-outline" size={24} color={C.danger} />
                <Text style={{ color: C.danger, fontWeight: '800', fontSize: 14, flex: 1 }}>Produit non trouvé</Text>
              </View>
              <Text style={{ color: C.gray, fontSize: 12, marginTop: 8, lineHeight: 18 }}>{error}</Text>
              <TouchableOpacity
                style={[s.submitBtn, { marginTop: 16 }]}
                onPress={() => { setScanned(false); setError(null); }}
              >
                <Text style={s.submitText}>RÉESSAYER LE SCAN</Text>
              </TouchableOpacity>

              {/* Ce produit n'est pas dans Open Food Facts : on propose automatiquement
                  la base de données de l'app pour le retrouver par son nom à la place. */}
              <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#FCA5A5' }}>
                <Text style={{ color: C.dark, fontWeight: '800', fontSize: 13, marginBottom: 10 }}>
                  Ou retrouve-le dans notre base ({FOOD_DATABASE.length} produits)
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border }}>
                  <Ionicons name="search" size={16} color={C.light} />
                  <TextInput
                    style={{ flex: 1, color: C.dark, paddingVertical: 10, paddingHorizontal: 10, fontSize: 14 }}
                    placeholder="Ex: Nutella, pomme, yaourt..."
                    placeholderTextColor={C.light}
                    value={fallbackQuery}
                    onChangeText={setFallbackQuery}
                  />
                  {fallbackQuery.length > 0 ? (
                    <TouchableOpacity onPress={() => setFallbackQuery('')}>
                      <Ionicons name="close-circle" size={16} color={C.light} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {fallbackResults.length > 0 ? (
                  <View style={{ marginTop: 10 }}>
                    {fallbackResults.map((food) => (
                      <TouchableOpacity
                        key={food.dish}
                        onPress={() => handleSelectFromDatabase(food)}
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.border }}
                      >
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 16 }}>{CATEGORY_EMOJIS[food.category] || '🍽️'}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={{ fontWeight: '800', fontSize: 13, color: C.dark }} numberOfLines={1}>{food.dish}</Text>
                          <Text style={{ color: C.gray, fontSize: 10, marginTop: 1 }}>
                            {food.kcal} kcal · {food.portion_g}g
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={C.light} />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : fallbackQuery.trim().length > 0 ? (
                  <Text style={{ color: C.gray, fontSize: 12, marginTop: 10, textAlign: 'center' }}>Aucun résultat</Text>
                ) : null}
              </View>
            </View>
          ) : product ? (
            <View style={{ margin: 16, padding: 20, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border }}>
              {/* Badge cache */}
              {product.fromSearch ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EEF0FF', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginBottom: 12 }}>
                  <Ionicons name="search" size={14} color={C.primary} />
                  <Text style={{ color: C.primary, fontWeight: '800', fontSize: 11 }}>AJOUTÉ DEPUIS LA BASE</Text>
                </View>
              ) : product.fromCache ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DCFCE7', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginBottom: 12 }}>
                  <Ionicons name="checkmark-circle" size={14} color="#15803D" />
                  <Text style={{ color: '#15803D', fontWeight: '800', fontSize: 11 }}>PRODUIT EN CACHE</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DBEAFE', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginBottom: 12 }}>
                  <Ionicons name="globe" size={14} color="#2563EB" />
                  <Text style={{ color: '#2563EB', fontWeight: '800', fontSize: 11 }}>OPEN FOOD FACTS</Text>
                </View>
              )}

              {/* Image du produit */}
              {product.image_url ? (
                <Image source={{ uri: product.image_url }} style={{ width: '100%', height: 150, borderRadius: 14, marginBottom: 12, resizeMode: 'contain', backgroundColor: C.chip }} />
              ) : null}

              <Text style={{ fontWeight: '800', fontSize: 18, color: C.dark }}>{product.dish}</Text>
              {product.brand ? <Text style={{ color: C.gray, fontSize: 13, marginTop: 2 }}>{product.brand}</Text> : null}
              <Text style={{ color: C.light, fontSize: 11, marginTop: 4 }}>Code: {product.barcode}</Text>

              {/* Macros */}
              <View style={{ flexDirection: 'row', marginTop: 16, marginBottom: 8 }}>
                <View style={[s.macroCell, { backgroundColor: '#FEF3C7', borderRadius: 12, paddingVertical: 10, marginRight: 6 }]}>
                  <Text style={[s.macroValue, { fontSize: 20 }]}>{product.kcal}</Text>
                  <Text style={s.macroLabel}>KCAL</Text>
                  <Text style={{ fontSize: 9, color: C.light, marginTop: 2 }}>pour {product.portion_g}g</Text>
                </View>
                <View style={[s.macroCell, { backgroundColor: '#DBEAFE', borderRadius: 12, paddingVertical: 10, marginHorizontal: 3 }]}>
                  <Text style={[s.macroValue, { fontSize: 20 }]}>{product.protein_g}g</Text>
                  <Text style={s.macroLabel}>PROTÉINES</Text>
                </View>
                <View style={[s.macroCell, { backgroundColor: '#DCFCE7', borderRadius: 12, paddingVertical: 10, marginHorizontal: 3 }]}>
                  <Text style={[s.macroValue, { fontSize: 20 }]}>{product.carbs_g}g</Text>
                  <Text style={s.macroLabel}>GLUCIDES</Text>
                </View>
                <View style={[s.macroCell, { backgroundColor: '#FCE7F3', borderRadius: 12, paddingVertical: 10, marginLeft: 6 }]}>
                  <Text style={[s.macroValue, { fontSize: 20 }]}>{product.fat_g}g</Text>
                  <Text style={s.macroLabel}>LIPIDES</Text>
                </View>
              </View>

              {/* Infos pour 100g */}
              <Text style={{ color: C.light, fontSize: 11, textAlign: 'center', marginBottom: 16 }}>
                Pour 100g: {product.kcal_per_100g} kcal · P {product.protein_per_100g}g · G {product.carbs_per_100g}g · L {product.fat_per_100g}g
              </Text>

              {/* Contrôles de portions pour le produit scanné */}
              <View style={{ backgroundColor: C.chip, borderRadius: 14, padding: 14, marginTop: 16, marginBottom: 16 }}>
                <Text style={{ fontWeight: '800', fontSize: 13, color: C.dark, marginBottom: 12 }}>🍽️ Portions</Text>

                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.subLabel, { marginBottom: 6 }]}>NOMBRE</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TouchableOpacity 
                        style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}
                        onPress={() => setScanPortions(Math.max(1, scanPortions - 1))}
                      >
                        <Ionicons name="remove" size={18} color={C.primary} />
                      </TouchableOpacity>
                      <TextInput 
                        style={[s.input, { flex: 1, textAlign: 'center', paddingHorizontal: 8, paddingVertical: 10 }]} 
                        keyboardType="numeric" 
                        value={String(scanPortions)} 
                        onChangeText={(v) => setScanPortions(Math.max(1, parseInt(v, 10) || 1))} 
                      />
                      <TouchableOpacity 
                        style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}
                        onPress={() => setScanPortions(scanPortions + 1)}
                      >
                        <Ionicons name="add" size={18} color={C.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.subLabel, { marginBottom: 6 }]}>POIDS/PORTION (g)</Text>
                    <TextInput 
                      style={[s.input, { paddingVertical: 10 }]} 
                      placeholder={String(product.portion_g || 100)} 
                      keyboardType="numeric" 
                      value={scanPortionWeight} 
                      onChangeText={setScanPortionWeight} 
                    />
                  </View>
                </View>

                <View style={{ backgroundColor: '#EEF0FF', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: C.gray, fontWeight: '700' }}>
                    TOTAL: <Text style={{ fontSize: 15, fontWeight: '900', color: C.primary }}>
                      {scanPortions * (parseFloat(scanPortionWeight) || product.portion_g || 100)} g
                    </Text>
                    <Text style={{ fontSize: 11, color: C.light, marginLeft: 4 }}>
                      ({scanPortions} × {parseFloat(scanPortionWeight) || product.portion_g || 100}g)
                    </Text>
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <View style={[s.macroCell, { backgroundColor: '#FEF3C7', borderRadius: 10, paddingVertical: 8, flex: 1 }]}>
                    <Text style={[s.macroValue, { fontSize: 16 }]}>
                      {Math.round((product.kcal || 0) * (scanPortions * (parseFloat(scanPortionWeight) || product.portion_g || 100) / (product.portion_g || 100)))}
                    </Text>
                    <Text style={s.macroLabel}>KCAL TOT</Text>
                  </View>
                  <View style={[s.macroCell, { backgroundColor: '#DBEAFE', borderRadius: 10, paddingVertical: 8, flex: 1 }]}>
                    <Text style={[s.macroValue, { fontSize: 16 }]}>
                      {Math.round(((product.protein_g || 0) * (scanPortions * (parseFloat(scanPortionWeight) || product.portion_g || 100) / (product.portion_g || 100))) * 10) / 10}g
                    </Text>
                    <Text style={s.macroLabel}>PROT TOT</Text>
                  </View>
                  <View style={[s.macroCell, { backgroundColor: '#DCFCE7', borderRadius: 10, paddingVertical: 8, flex: 1 }]}>
                    <Text style={[s.macroValue, { fontSize: 16 }]}>
                      {Math.round(((product.carbs_g || 0) * (scanPortions * (parseFloat(scanPortionWeight) || product.portion_g || 100) / (product.portion_g || 100))) * 10) / 10}g
                    </Text>
                    <Text style={s.macroLabel}>GLUC TOT</Text>
                  </View>
                  <View style={[s.macroCell, { backgroundColor: '#FCE7F3', borderRadius: 10, paddingVertical: 8, flex: 1 }]}>
                    <Text style={[s.macroValue, { fontSize: 16 }]}>
                      {Math.round(((product.fat_g || 0) * (scanPortions * (parseFloat(scanPortionWeight) || product.portion_g || 100) / (product.portion_g || 100))) * 10) / 10}g
                    </Text>
                    <Text style={s.macroLabel}>LIP TOT</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={s.submitBtn} onPress={handleAddToLog}>
                <Text style={s.submitText}>✓ AJOUTER AU JOURNAL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ alignItems: 'center', marginTop: 12 }}
                onPress={() => { setScanned(false); setProduct(null); setScanPortions(1); setScanPortionWeight(''); }}
              >
                <Text style={{ color: C.gray, fontSize: 13 }}>Scanner un autre produit</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </>
      ) : (
        /* Historique des scans */
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0 }}>
          {history.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="time-outline" size={40} color={C.light} />
              <Text style={{ color: C.gray, marginTop: 8 }}>Aucun produit scanné encore</Text>
              <Text style={{ color: C.light, fontSize: 12, marginTop: 4 }}>Scanne ton premier produit !</Text>
            </View>
          ) : (
            history.map((item) => (
              <TouchableOpacity
                key={item.barcode}
                onPress={() => handleSelectFromHistory(item)}
                style={{ backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="barcode-outline" size={22} color={C.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontWeight: '800', fontSize: 14, color: C.dark }} numberOfLines={1}>{item.name}</Text>
                    {item.brand ? <Text style={{ color: C.gray, fontSize: 11, marginTop: 1 }}>{item.brand}</Text> : null}
                    <Text style={{ color: C.light, fontSize: 10, marginTop: 2 }}>
                      {item.kcal} kcal · {item.portion_g}g · Scanné {item.scanCount} fois
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={C.light} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function NutritionScreen({ go, goBack }) {
  const [goal, setGoal] = useState({ targetKcal: 2000, mealsPerDay: 3, dietName: '' });
  const [log, setLog] = useState([]);
  const [manual, setManual] = useState({ dish: '', portion_g: '200', portions: '1', portionWeightG: '200', kcal: '', protein_g: '', carbs_g: '', fat_g: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [foodSuggestions, setFoodSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fonction appelée quand un produit scanné est ajouté
  const handleAddScannedProduct = (product, numPortions = 1, portionWeightG = null) => {
    const portions = Math.max(1, parseInt(numPortions, 10) || 1);
    const weightPerPortion = portionWeightG ? parseFloat(portionWeightG) : (product.portion_g || 100);
    const totalWeight = portions * weightPerPortion;
    const ratio = totalWeight / (product.portion_g || 100);

    const entry = {
      dish: product.dish,
      portion_g: totalWeight,
      portions: portions,
      portionWeightG: weightPerPortion,
      kcal: Math.round((product.kcal || 0) * ratio),
      protein_g: Math.round(((product.protein_g || 0) * ratio) * 10) / 10,
      carbs_g: Math.round(((product.carbs_g || 0) * ratio) * 10) / 10,
      fat_g: Math.round(((product.fat_g || 0) * ratio) * 10) / 10,
      barcode: product.barcode,
      fromScan: true,
    };
    addToLog(entry);
  };

  useEffect(() => {
    (async () => {
      try {
        const g = await AsyncStorage.getItem('nutrition_goal');
        if (g) setGoal(JSON.parse(g));
        const l = await AsyncStorage.getItem(todayKey());
        if (l) setLog(JSON.parse(l));
      } catch (e) {}
    })();
  }, []);

  // Recherche de suggestions quand le nom du plat change
  useEffect(() => {
    if (manual.dish.trim().length > 0) {
      const results = searchFood(manual.dish);
      setFoodSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setFoodSuggestions([]);
      setShowSuggestions(false);
    }
  }, [manual.dish]);

  const consumed = log.reduce((sum, m) => sum + (m.kcal || 0), 0);
  const remaining = goal.targetKcal - consumed;
  const progress = Math.min(1, consumed / Math.max(1, goal.targetKcal));

  const addToLog = async (entry) => {
    const newLog = [...log, { ...entry, id: String(Date.now()) }];
    setLog(newLog);
    try {
      await AsyncStorage.setItem(todayKey(), JSON.stringify(newLog));
    } catch (e) {}
    setShowAddForm(false);
    setManual({ dish: '', portion_g: '200', portions: '1', portionWeightG: '200', kcal: '', protein_g: '', carbs_g: '', fat_g: '' });
    setShowSuggestions(false);
  };

  const removeFromLog = async (id) => {
    const newLog = log.filter((m) => m.id !== id);
    setLog(newLog);
    try {
      await AsyncStorage.setItem(todayKey(), JSON.stringify(newLog));
    } catch (e) {}
  };

  const handleAddManual = () => {
    const portions = Math.max(1, parseInt(manual.portions, 10) || 1);
    const portionWeightG = parseFloat(manual.portionWeightG) || parseFloat(manual.portion_g) || 100;
    const totalWeight = portions * portionWeightG;
    const ratio = totalWeight / (parseFloat(manual.portion_g) || 100);

    const entry = {
      dish: manual.dish || 'Plat',
      portion_g: totalWeight,
      portions: portions,
      portionWeightG: portionWeightG,
      kcal: Math.round((parseInt(manual.kcal, 10) || 0) * ratio),
      protein_g: Math.round(((parseInt(manual.protein_g, 10) || 0) * ratio) * 10) / 10,
      carbs_g: Math.round(((parseInt(manual.carbs_g, 10) || 0) * ratio) * 10) / 10,
      fat_g: Math.round(((parseInt(manual.fat_g, 10) || 0) * ratio) * 10) / 10,
    };
    addToLog(entry);
  };

  // Sélectionner un plat depuis les suggestions
  const selectFood = (food) => {
    const portion = parseInt(manual.portion_g, 10) || food.portion_g;
    const adjusted = adjustPortion(food, portion);
    setManual({
      dish: adjusted.dish,
      portion_g: String(adjusted.portion_g),
      kcal: String(adjusted.kcal),
      protein_g: String(adjusted.protein_g),
      carbs_g: String(adjusted.carbs_g),
      fat_g: String(adjusted.fat_g),
    });
    setShowSuggestions(false);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={s.brandRow}>
        <Text style={s.brand}>
          NUTRI <Text style={{ color: C.primary }}>• SPORT</Text>
        </Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: '900' }}>NUTRITION</Text>
        <TouchableOpacity onPress={() => go('nutritionGoal')}>
          <Ionicons name="flag-outline" size={24} color={C.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* DASHBOARD */}
        <View style={s.nutriDashboard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={s.nutriDashLabel}>OBJECTIF DU JOUR</Text>
              <Text style={s.nutriDashValue}>{goal.targetKcal} kcal</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.nutriDashLabel}>RESTANT</Text>
              <Text style={[s.nutriDashValue, { color: remaining < 0 ? C.danger : C.primary }]}>{remaining} kcal</Text>
            </View>
          </View>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${progress * 100}%`, backgroundColor: remaining < 0 ? C.danger : C.primary }]} />
          </View>
          <Text style={s.nutriDashSub}>
            {consumed} kcal consommées · {goal.mealsPerDay} repas/jour{goal.dietName ? ` · ${goal.dietName}` : ''}
          </Text>
          {remaining < 0 ? (
            <Text style={{ color: C.danger, fontSize: 12, marginTop: 8, fontWeight: '700' }}>
              ⚠️ Objectif dépassé de {Math.abs(remaining)} kcal
            </Text>
          ) : null}
        </View>

        {/* BOUTONS AJOUTER UN REPAS / SCANNER */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <TouchableOpacity 
            onPress={() => setShowAddForm(!showAddForm)}
            style={{ 
              flex: 1,
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 8, 
              backgroundColor: C.primary, 
              borderRadius: 999, 
              paddingVertical: 14,
            }}
          >
            <Ionicons name={showAddForm ? "close" : "add"} size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
              {showAddForm ? 'ANNULER' : 'SAISIE MANUELLE'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => go('barcodeScan', { onAddProduct: handleAddScannedProduct })}
            style={{ 
              flex: 1,
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 8, 
              backgroundColor: '#0B0B14', 
              borderRadius: 999, 
              paddingVertical: 14,
              borderWidth: 2,
              borderColor: C.primary,
            }}
          >
            <Ionicons name="barcode-outline" size={18} color={C.primary} />
            <Text style={{ color: C.primary, fontWeight: '800', fontSize: 14 }}>
              SCANNER
            </Text>
          </TouchableOpacity>
        </View>

        {/* FORMULAIRE D'AJOUT MANUEL */}
        {showAddForm ? (
          <View style={{ backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ fontWeight: '800', fontSize: 14, color: C.dark, marginBottom: 12 }}>📝 Saisie manuelle</Text>

            <Text style={[s.subLabel, { marginBottom: 6 }]}>NOM DU PLAT</Text>
            <TextInput 
              style={s.input} 
              placeholder="Ex: Poulet riz légumes — tape pour voir les suggestions" 
              placeholderTextColor={C.light}
              value={manual.dish} 
              onChangeText={(v) => setManual({ ...manual, dish: v })} 
            />

            {/* SUGGESTIONS DE PLATS */}
            {showSuggestions && foodSuggestions.length > 0 ? (
              <View style={{
                backgroundColor: C.card,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: C.border,
                overflow: 'hidden',
                marginBottom: 16,
                maxHeight: 320,
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  backgroundColor: C.chip,
                  borderBottomWidth: 1,
                  borderBottomColor: C.border,
                }}>
                  <Ionicons name="search" size={14} color={C.primary} />
                  <Text style={{ marginLeft: 8, fontWeight: '700', fontSize: 12, color: C.primary }}>
                    {foodSuggestions.length} SUGGESTION{foodSuggestions.length > 1 ? 'S' : ''}
                  </Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {foodSuggestions.map((food, index) => {
                    const portion = parseInt(manual.portion_g, 10) || food.portion_g;
                    const adjusted = adjustPortion(food, portion);
                    const emoji = CATEGORY_EMOJIS[food.category] || "🍽️";
                    return (
                      <TouchableOpacity 
                        key={index}
                        onPress={() => selectFood(food)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 12,
                          paddingHorizontal: 14,
                          borderBottomWidth: 1,
                          borderBottomColor: C.border,
                          backgroundColor: C.card,
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 24, marginRight: 12 }}>{emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '700', fontSize: 14, color: C.dark }}>
                            {food.dish}
                          </Text>
                          <Text style={{ color: C.gray, fontSize: 11, marginTop: 2 }}>
                            {food.portion_g}g · {food.kcal} kcal · P {food.protein_g}g · G {food.carbs_g}g · L {food.fat_g}g
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontWeight: '800', fontSize: 14, color: C.primary }}>
                            {adjusted.kcal} kcal
                          </Text>
                          <Text style={{ color: C.light, fontSize: 10 }}>
                            pour {portion}g
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {/* Nombre de portions et poids par portion */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[s.subLabel, { marginBottom: 6 }]}>NOMBRE DE PORTIONS</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity 
                    style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}
                    onPress={() => setManual({ ...manual, portions: String(Math.max(1, (parseInt(manual.portions, 10) || 1) - 1)) })}
                  >
                    <Ionicons name="remove" size={18} color={C.primary} />
                  </TouchableOpacity>
                  <TextInput 
                    style={[s.input, { flex: 1, textAlign: 'center', paddingHorizontal: 8 }]} 
                    keyboardType="numeric" 
                    value={manual.portions} 
                    onChangeText={(v) => setManual({ ...manual, portions: v })} 
                  />
                  <TouchableOpacity 
                    style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}
                    onPress={() => setManual({ ...manual, portions: String((parseInt(manual.portions, 10) || 1) + 1) })}
                  >
                    <Ionicons name="add" size={18} color={C.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.subLabel, { marginBottom: 6 }]}>POIDS PAR PORTION (g)</Text>
                <TextInput 
                  style={s.input} 
                  placeholder="200" 
                  keyboardType="numeric" 
                  value={manual.portionWeightG} 
                  onChangeText={(v) => setManual({ ...manual, portionWeightG: v, portion_g: v })} 
                />
              </View>
            </View>

            {/* Poids total calculé */}
            <View style={{ backgroundColor: C.chip, borderRadius: 12, padding: 12, marginTop: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: C.gray, fontWeight: '700' }}>
                POIDS TOTAL: <Text style={{ fontSize: 16, fontWeight: '900', color: C.primary }}>
                  {((parseInt(manual.portions, 10) || 1) * (parseFloat(manual.portionWeightG) || parseFloat(manual.portion_g) || 0))} g
                </Text>
                <Text style={{ fontSize: 11, color: C.light, marginLeft: 4 }}>
                  ({(parseInt(manual.portions, 10) || 1)} × {(parseFloat(manual.portionWeightG) || parseFloat(manual.portion_g) || 0)}g)
                </Text>
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[s.subLabel, { marginBottom: 6 }]}>CALORIES (pour 1 portion)</Text>
                <TextInput 
                  style={s.input} 
                  placeholder="kcal" 
                  keyboardType="numeric" 
                  value={manual.kcal} 
                  onChangeText={(v) => setManual({ ...manual, kcal: v })} 
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[s.subLabel, { marginBottom: 6 }]}>PROTÉINES (g)</Text>
                <TextInput 
                  style={s.input} 
                  placeholder="0" 
                  keyboardType="numeric" 
                  value={manual.protein_g} 
                  onChangeText={(v) => setManual({ ...manual, protein_g: v })} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.subLabel, { marginBottom: 6 }]}>GLUCIDES (g)</Text>
                <TextInput 
                  style={s.input} 
                  placeholder="0" 
                  keyboardType="numeric" 
                  value={manual.carbs_g} 
                  onChangeText={(v) => setManual({ ...manual, carbs_g: v })} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.subLabel, { marginBottom: 6 }]}>LIPIDES (g)</Text>
                <TextInput 
                  style={s.input} 
                  placeholder="0" 
                  keyboardType="numeric" 
                  value={manual.fat_g} 
                  onChangeText={(v) => setManual({ ...manual, fat_g: v })} 
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[s.submitBtn, { marginTop: 16 }]} 
              onPress={handleAddManual}
              disabled={!manual.dish.trim() || !manual.kcal}
            >
              <Text style={s.submitText}>+ AJOUTER AU JOURNAL</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* LISTE DES REPAS */}
        <Text style={[s.subLabel, { marginBottom: 10 }]}>REPAS D'AUJOURD'HUI ({log.length})</Text>
        {log.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 30, backgroundColor: C.card, borderRadius: 18 }}>
            <Ionicons name="restaurant-outline" size={40} color={C.light} />
            <Text style={{ color: C.gray, marginTop: 8 }}>Aucun repas enregistré</Text>
            <Text style={{ color: C.light, fontSize: 12, marginTop: 4 }}>Appuyez sur "+ Ajouter un repas" pour commencer</Text>
          </View>
        ) : (
          log.map((m) => (
            <View key={m.id} style={s.mealRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.mealDish}>{m.dish}</Text>
                <Text style={s.mealMeta}>
                  {m.portion_g}g · {m.kcal} kcal · P {m.protein_g}g · G {m.carbs_g}g · L {m.fat_g}g
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeFromLog(m.id)}>
                <Ionicons name="trash-outline" size={18} color={C.light} />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* RÉSUMÉ JOURNALIER */}
        {log.length > 0 ? (
          <View style={{ backgroundColor: C.card, borderRadius: 18, padding: 16, marginTop: 16, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ fontWeight: '800', fontSize: 14, color: C.dark, marginBottom: 12 }}>📊 Résumé journalier</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: C.dark }}>{consumed}</Text>
                <Text style={{ fontSize: 10, color: C.gray, fontWeight: '700' }}>KCAL</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: C.dark }}>
                  {log.reduce((sum, m) => sum + (m.protein_g || 0), 0)}g
                </Text>
                <Text style={{ fontSize: 10, color: C.gray, fontWeight: '700' }}>PROTÉINES</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: C.dark }}>
                  {log.reduce((sum, m) => sum + (m.carbs_g || 0), 0)}g
                </Text>
                <Text style={{ fontSize: 10, color: C.gray, fontWeight: '700' }}>GLUCIDES</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: C.dark }}>
                  {log.reduce((sum, m) => sum + (m.fat_g || 0), 0)}g
                </Text>
                <Text style={{ fontSize: 10, color: C.gray, fontWeight: '700' }}>LIPIDES</Text>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function NutritionGoalScreen({ goBack }) {
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [targetKcal, setTargetKcal] = useState('2000');
  const [dietName, setDietName] = useState('');
  const [autoMode, setAutoMode] = useState(true); // true = nom déduit automatiquement

  useEffect(() => {
    (async () => {
      try {
        const g = await AsyncStorage.getItem('nutrition_goal');
        if (g) {
          const parsed = JSON.parse(g);
          setMealsPerDay(parsed.mealsPerDay || 3);
          setTargetKcal(String(parsed.targetKcal || 2000));
          setDietName(parsed.dietName || '');
          setAutoMode(parsed.autoMode !== false);
        } else {
          setDietName(suggestDietName(3, 2000));
        }
      } catch (e) {
        setDietName(suggestDietName(3, 2000));
      }
    })();
  }, []);

  // Recalcule le nom du régime dès que repas/calories changent, tant que le mode auto est actif.
  useEffect(() => {
    if (autoMode) {
      setDietName(suggestDietName(mealsPerDay, targetKcal));
    }
    // eslint-disable-next-line
  }, [mealsPerDay, targetKcal, autoMode]);

  const save = async () => {
    const goal = { mealsPerDay, targetKcal: parseInt(targetKcal, 10) || 2000, dietName, autoMode };
    try {
      await AsyncStorage.setItem('nutrition_goal', JSON.stringify(goal));
    } catch (e) {}
    goBack();
  };

  const tip = tipForDiet(dietName);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title="Fixer un objectif" onBack={goBack} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={s.label}>NOMBRE DE REPAS PAR JOUR</Text>
        <View style={s.stepperRow}>
          <TouchableOpacity style={s.stepperBtnLight} onPress={() => setMealsPerDay((n) => Math.max(1, n - 1))}>
            <Ionicons name="remove" size={20} color={C.primary} />
          </TouchableOpacity>
          <Text style={s.stepperValue}>{mealsPerDay}</Text>
          <TouchableOpacity style={s.stepperBtnLight} onPress={() => setMealsPerDay((n) => Math.min(6, n + 1))}>
            <Ionicons name="add" size={20} color={C.primary} />
          </TouchableOpacity>
        </View>
        <Text style={s.helper}>1 repas = jeûne OMAD, 3 = classique, jusqu’à 6 pour du fractionné.</Text>

        <Text style={s.label}>APPORT CALORIQUE JOURNALIER (KCAL)</Text>
        <TextInput style={s.input} keyboardType="numeric" value={targetKcal} onChangeText={setTargetKcal} />

        <Text style={s.label}>NOM DU RÉGIME</Text>

        <View style={s.dietAutoBox}>
          <View style={{ flex: 1 }}>
            <Text style={s.dietAutoLabel}>{autoMode ? 'Déduit automatiquement' : 'Saisi manuellement'}</Text>
            <Text style={s.dietAutoValue}>{dietName || '—'}</Text>
          </View>
          <TouchableOpacity
            style={[s.autoToggleBtn, autoMode && s.autoToggleBtnOn]}
            onPress={() => {
              const next = !autoMode;
              setAutoMode(next);
              if (next) setDietName(suggestDietName(mealsPerDay, targetKcal));
            }}
          >
            <Ionicons name={autoMode ? 'sync' : 'create-outline'} size={14} color={autoMode ? '#fff' : C.primary} />
            <Text style={[s.autoToggleText, autoMode && s.autoToggleTextOn]}>{autoMode ? 'AUTO' : 'MANUEL'}</Text>
          </TouchableOpacity>
        </View>

        {!autoMode ? (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              {DIET_PRESETS.map((d) => (
                <Chip key={d} label={d} selected={dietName === d} onPress={() => setDietName(d)} />
              ))}
            </View>
            <TextInput style={[s.input, { marginTop: 8 }]} placeholder="Ou saisis librement (ex: Sans gluten)" value={dietName} onChangeText={setDietName} />
          </>
        ) : (
          <Text style={s.helper}>Le nom s’adapte automatiquement selon le nombre de repas et les calories ci-dessus. Passe en mode MANUEL pour le personnaliser.</Text>
        )}

        {tip ? (
          <View style={s.nutriTipBox}>
            <Ionicons name="bulb-outline" size={18} color={C.primary} />
            <Text style={s.nutriTipBoxText}>{tip}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={s.submitBtn} onPress={save}>
          <Text style={s.submitText}>ENREGISTRER L’OBJECTIF</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- TAB BAR ----------
function TabBar({ active, onTabPress, profilePhoto }) {
  const tabs = [
    { key: 'home', icon: 'flash', grad: C.gradPurple },
    { key: 'track', icon: 'navigate', grad: C.gradBlue },
    { key: 'nutrition', icon: 'restaurant', grad: C.gradOrangePink },
    { key: 'match', icon: 'heart', grad: C.gradOrangePink },
    { key: 'chats', icon: 'chatbubble', grad: C.gradPurple },
    { key: 'profile', icon: 'person', grad: C.gradPurple },
  ];
  return (
    <View style={s.tabBar}>
      {tabs.map((t) => {
        const on = active === t.key;
        if (t.key === 'profile' && profilePhoto) {
          return (
            <TouchableOpacity key={t.key} onPress={() => onTabPress(t.key)} style={{ alignItems: 'center' }}>
              <Image source={{ uri: profilePhoto }} style={[s.tabAvatarImg, on && s.tabAvatarImgOn]} />
            </TouchableOpacity>
          );
        }
        return (
          <TouchableOpacity key={t.key} onPress={() => onTabPress(t.key)} style={{ alignItems: 'center' }}>
            {on ? (
              <Grad colors={t.grad} style={s.tabIconOn}>
                <Ionicons name={t.icon} size={19} color="#fff" />
              </Grad>
            ) : (
              <Ionicons name={t.icon} size={20} color={C.light} style={{ padding: 12 }} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ---------- ROOT APP ----------
const TAB_SCREENS = { home: HomeScreen, track: TrackScreen, nutrition: NutritionScreen, match: MatchScreen, chats: ChatsScreen, profile: ProfileScreen };
const STACK_SCREENS = {
  events: EventsScreen,
  newEvent: NewEventScreen,
  matchChat: MatchChatScreen,
  barcodeScan: BarcodeScanScreen,
  contacts: ContactsScreen,
  venues: VenuesScreen,
  teams: TeamsScreen,
  partners: PartnersScreen,
  leaderboard: LeaderboardScreen,
  challenges: ChallengesScreen,
  pushup: PushupScreen,
  nutritionGoal: NutritionGoalScreen,
  chatDetail: ChatDetailScreen,
  qrScan: QRScanScreen,
  stories: StoriesScreen,
  teammates: TeammatesScreen,
  coachCertification: CoachCertificationScreen,
  practiceHistory: SportPracticeHistoryScreen,
};

// Fonds personnalisés par onglet (sauf track)
const TAB_BACKGROUNDS = {
  home: C.gradPurple,
  nutrition: C.gradOrangePink,
  match: ['#FF7A45', '#EC4899'],
  chats: C.gradBlue,
  profile: C.gradPurple,
};

export default function App() {
  // La navigation est une vraie pile : "go" empile un écran (avec des paramètres optionnels),
  // "goBack" le dépile. Ça permet un vrai bouton Retour (flèche en haut ET bouton physique
  // Android), et de transmettre des données précises (ex: un événement) entre écrans.
  const [stack, setStack] = useState([{ key: 'home' }]);
  const [profilePhoto, setProfilePhoto] = useState(null);

  // ---- Authentification ----
  // authUser === undefined -> on vérifie encore s'il y a une session sauvegardée
  // authUser === null -> personne n'est connecté, on affiche AuthScreen
  // authUser === {...} -> utilisateur connecté
  const [authUser, setAuthUser] = useState(undefined);

  useEffect(() => {
    let done = false;
    // Filet de sécurité : si AsyncStorage ne répond pas (bug natif sur certains
    // appareils), on ne reste pas bloqué sur l'écran de chargement indéfiniment.
    const safety = setTimeout(() => {
      if (!done) {
        done = true;
        setAuthUser(null);
      }
    }, 3000);

    (async () => {
      try {
        const raw = await AsyncStorage.getItem('currentUser');
        if (!done) {
          done = true;
          clearTimeout(safety);
          setAuthUser(raw ? JSON.parse(raw) : null);
        }
      } catch (e) {
        if (!done) {
          done = true;
          clearTimeout(safety);
          setAuthUser(null);
        }
      }
    })();

    return () => clearTimeout(safety);
  }, []);

  const current = stack[stack.length - 1];
  const screen = current.key;
  const params = current.params;

  const go = (key, routeParams) => setStack((prev) => [...prev, { key, params: routeParams }]);
  const goBack = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const onTabPress = (key) => setStack([{ key }]); // taper un onglet réinitialise la pile sur cet onglet

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 1) {
        goBack();
        return true; // empêche l'app de se fermer, revient à l'écran précédent
      }
      return false;
    });
    return () => sub.remove();
  }, [stack]);

  useEffect(() => {
    (async () => {
      try {
        const uri = await AsyncStorage.getItem('profile_photo_uri');
        if (uri) setProfilePhoto(uri);
      } catch (e) {}
    })();
  }, []);

  const isTab = Object.keys(TAB_SCREENS).includes(screen);
  const Screen = TAB_SCREENS[screen] || STACK_SCREENS[screen] || HomeScreen;

  // Fond par onglet (sauf track qui a son propre fond)
  const tabBackground = isTab && screen !== 'track' ? TAB_BACKGROUNDS[screen] : null;

  // Tant qu'on n'a pas fini de vérifier s'il existe une session sauvegardée,
  // on affiche un écran vide plutôt que de flasher l'écran de connexion.
  if (authUser === undefined) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={C.primary} />
      </SafeAreaView>
    );
  }

  // Personne n'est connecté -> écran de connexion / inscription
  if (!authUser) {
    return <AuthScreen onAuthSuccess={(user) => setAuthUser(user)} />;
  }

  // Déconnexion : efface la session sauvegardée et repasse par AuthScreen.
  // Utilisable depuis n'importe quel écran via la prop `logout`.
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('currentUser');
    } catch (e) {}
    setAuthUser(null);
    setStack([{ key: 'home' }]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {tabBackground ? (
        <Grad colors={tabBackground} style={{ flex: 1 }} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(248,249,253,0.93)' }}>
            <Screen go={go} goBack={goBack} params={params} profilePhoto={profilePhoto} setProfilePhoto={setProfilePhoto} authUser={authUser} logout={logout} />
          </View>
          {isTab ? <TabBar active={screen} onTabPress={onTabPress} profilePhoto={profilePhoto} /> : null}
        </Grad>
      ) : (
        <View style={{ flex: 1 }}>
          <Screen go={go} goBack={goBack} params={params} profilePhoto={profilePhoto} setProfilePhoto={setProfilePhoto} authUser={authUser} logout={logout} />
          {isTab ? <TabBar active={screen} onTabPress={onTabPress} profilePhoto={profilePhoto} /> : null}
        </View>
      )}
    </SafeAreaView>
  );
}

// ---------- STYLES ----------
const s = StyleSheet.create({
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  brand: { fontSize: 23, fontWeight: '900', color: C.dark, letterSpacing: 1.5 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerSide: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 15, color: C.dark },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, marginRight: 8, marginBottom: 8 },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontWeight: '700', fontSize: 13, color: C.dark },
  chipTextOn: { color: '#fff' },
  empty: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 64 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 19, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  emptySub: { color: C.gray, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  emptyCta: { backgroundColor: C.primary, paddingVertical: 14, borderRadius: 999, width: '100%', alignItems: 'center' },
  emptyCtaText: { color: '#fff', fontWeight: '800' },
  banner: { flexDirection: 'row', alignItems: 'center', borderRadius: 22, padding: 18, marginHorizontal: 16, marginBottom: 16, shadowColor: C.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.28, shadowRadius: 20, elevation: 8 },
  bannerIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  bannerEyebrow: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  bannerSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2 },
  bannerBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  bannerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '800' },
  link: { color: C.primary, fontWeight: '800', fontSize: 12 },
  createCard: { width: 140, height: 190, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: C.card },
  eventCardShadow: { shadowColor: C.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 16, elevation: 6 },
  plusCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  createTitle: { fontWeight: '800', fontSize: 12 },
  createSub: { color: C.gray, fontSize: 11, textAlign: 'center', marginTop: 4, paddingHorizontal: 8 },
  eventCard: { width: 220, height: 190, borderRadius: 20, padding: 16, marginRight: 16, justifyContent: 'space-between' },
  eventCardTitle: { color: '#fff', fontWeight: '800', fontSize: 17, marginTop: 8 },
  eventCardLoc: { color: '#fff', fontSize: 12 },
  eventCardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  eventCardBadge: { color: '#fff', fontWeight: '700', fontSize: 12 },
  eventCardVoir: { color: '#fff', fontWeight: '800', fontSize: 12 },
  actionsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  primaryBtn: { flex: 1, backgroundColor: C.primary, paddingVertical: 14, borderRadius: 999, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  secondaryBtn: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, paddingVertical: 14, borderRadius: 999, alignItems: 'center' },
  secondaryBtnText: { color: C.dark, fontWeight: '800', fontSize: 11 },
  runnerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 18, padding: 14, ...C.shadow },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  runnerName: { fontWeight: '800', fontSize: 15 },
  runnerMeta: { color: C.gray, fontSize: 13, marginTop: 2 },
  eventListCard: { backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 14, ...C.shadow },
  eventListIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  eventListTitle: { fontWeight: '800', fontSize: 16 },
  eventListHost: { color: C.gray, fontSize: 12, marginTop: 2 },
  eventListMeta: { fontSize: 12, marginTop: 10, color: C.dark },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  eventListFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventListParticipants: { color: C.primary, fontWeight: '700', fontSize: 12 },
  fullBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  fullBadgeText: { color: C.danger, fontWeight: '800', fontSize: 11 },
  joinBtn: { backgroundColor: C.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  joinBtnText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  label: { fontSize: 12, fontWeight: '800', marginTop: 18, marginBottom: 8 },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14 },
  submitBtn: { backgroundColor: C.primary, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginTop: 28, shadowColor: C.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  swipeCard: { position: 'absolute', width: 300, height: 420, borderRadius: 24, overflow: 'hidden', backgroundColor: C.card },
  swipeInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)', padding: 20 },
  swipeName: { color: '#fff', fontSize: 24, fontWeight: '900' },
  swipeMeta: { color: '#fff', marginTop: 4 },
  swipeChip: { color: '#fff', fontWeight: '700', marginTop: 8, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  swipeActions: { flexDirection: 'row', justifyContent: 'center', gap: 32, paddingBottom: 16 },
  roundBtn: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  startBtn: { paddingVertical: 18, borderRadius: 999, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 6 },
  startText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
  trackInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(91,79,233,0.15)', marginHorizontal: 16, marginTop: 16, padding: 12, borderRadius: 12 },
  trackInfoText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, flex: 1, lineHeight: 18 },
  mapImage: { height: 180, marginHorizontal: 16, marginTop: 16, borderRadius: 16, backgroundColor: '#1a1a2e' },
  mapPlaceholder: { height: 140, marginHorizontal: 16, marginTop: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', gap: 8 },
  mapPlaceholderText: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  recordsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 16, marginTop: 16, borderRadius: 18, paddingVertical: 16 },
  recordItem: { flex: 1, alignItems: 'center' },
  recordDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.1)' },
  recordEmoji: { fontSize: 18, marginBottom: 4 },
  recordValue: { color: '#fff', fontSize: 15, fontWeight: '800' },
  recordLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, marginTop: 2, fontWeight: '700' },
  modesRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 16 },
  modeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)' },
  modeBtnOn: { backgroundColor: C.primary },
  modeText: { color: 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 12 },
  modeTextOn: { color: '#fff' },
  trackError: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(239,68,68,0.15)', marginHorizontal: 16, marginTop: 16, padding: 12, borderRadius: 12 },
  trackErrorText: { color: '#FCA5A5', fontSize: 13, flex: 1, lineHeight: 18 },
  trackStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 16, marginTop: 32, borderRadius: 18, padding: 16 },
  trackStatCell: { width: '50%', alignItems: 'center', marginBottom: 16 },
  trackStatLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  trackStatValue: { color: '#fff', fontSize: 22, fontWeight: '800' },
  trackStatUnit: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 2 },
  resetBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  resetText: { color: 'rgba(255,255,255,0.7)', fontWeight: '800', fontSize: 12 },
  filterLabel: { fontSize: 11, fontWeight: '800', color: C.gray, letterSpacing: 1, paddingHorizontal: 16, marginBottom: 6 },
  trialBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.chip, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, marginBottom: 16 },
  trialText: { color: C.primary, fontWeight: '800', fontSize: 12 },
  subLabel: { fontSize: 11, fontWeight: '700', color: C.gray, letterSpacing: 0.5, marginBottom: 8 },
  formatCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: 16, padding: 14, marginBottom: 8 },
  formatCardOn: { borderColor: C.primary, backgroundColor: C.chip },
  formatTitle: { fontWeight: '800', fontSize: 13, color: C.dark, marginBottom: 4 },
  formatTitleOn: { color: C.primary },
  formatDesc: { color: C.gray, fontSize: 12, lineHeight: 17 },
  formatHint: { color: C.primary, fontWeight: '700', fontSize: 11, marginTop: 6 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  radioOn: { borderColor: C.primary },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: C.primary },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.chip, borderWidth: 1, borderColor: C.primary, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 12, marginTop: 8 },
  gpsBtnText: { color: C.primary, fontWeight: '800', fontSize: 12 },
  helper: { color: C.gray, fontSize: 11, marginTop: 6, fontStyle: 'italic' },
  lockedInput: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  lockedText: { color: C.light, fontStyle: 'italic', fontSize: 12 },
  chatCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 18, padding: 14 },
  chatAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  venueCard: { backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 14, ...C.shadow },
  venueTitle: { fontWeight: '800', fontSize: 15, marginBottom: 4 },
  venueDistanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.chip, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  venueDistanceText: { color: C.primary, fontWeight: '800', fontSize: 11 },
  bookBtn: { flexDirection: 'row', backgroundColor: C.primary, borderRadius: 999, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  bookText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  catBadge: { backgroundColor: C.chip, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginBottom: 6 },
  profileHero: { alignItems: 'center', paddingVertical: 32 },
  profileAvatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  profileAvatarImg: { width: 76, height: 76, borderRadius: 38, marginBottom: 10 },
  avatarEditBadge: { position: 'absolute', bottom: 12, right: -2, width: 26, height: 26, borderRadius: 13, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarPickerBox: { backgroundColor: C.card, marginHorizontal: 16, marginTop: -12, borderRadius: 16, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  avatarPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  avatarPickerText: { color: C.dark, fontWeight: '700', fontSize: 13 },
  tabAvatarImg: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'transparent' },
  tabAvatarImgOn: { borderColor: C.primary },
  statsBar: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 18, paddingVertical: 14 },
  hubItem: { width: '31%', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, paddingVertical: 16 },
  tabBar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 12, paddingBottom: 12, backgroundColor: C.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, shadowColor: '#1B1C57', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.1, shadowRadius: 18, elevation: 20 },
  tabIconOn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 10, elevation: 8 },
  nutriDashboard: { backgroundColor: C.card, borderRadius: 20, padding: 16, marginBottom: 16 },
  nutriDashLabel: { fontSize: 10, fontWeight: '700', color: C.gray, letterSpacing: 0.5 },
  nutriDashValue: { fontSize: 22, fontWeight: '900', color: C.dark, marginTop: 2 },
  progressTrack: { height: 8, backgroundColor: C.chip, borderRadius: 4, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: C.primary, borderRadius: 4 },
  nutriDashSub: { color: C.gray, fontSize: 12, marginTop: 8 },
  nutriTip: { color: C.primary, fontSize: 12, marginTop: 10, lineHeight: 17 },
  apiKeyBox: { backgroundColor: C.chip, borderRadius: 14, padding: 14, marginBottom: 16 },
  apiKeyTitle: { color: C.dark, fontWeight: '700', fontSize: 13, marginBottom: 8 },
  nutriActionsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  nutriActionBtn: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingVertical: 18 },
  nutriActionText: { fontSize: 12, fontWeight: '700', color: C.dark, textAlign: 'center' },
  nutriResultCard: { backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 16 },
  nutriPhoto: { width: '100%', height: 180, borderRadius: 14, marginBottom: 12, backgroundColor: C.chip },
  nutriDish: { fontSize: 18, fontWeight: '800', color: C.dark },
  nutriPortion: { color: C.gray, fontSize: 13, marginTop: 2, marginBottom: 12 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  macroCell: { alignItems: 'center', flex: 1 },
  macroValue: { fontSize: 16, fontWeight: '800', color: C.dark },
  macroLabel: { fontSize: 9, color: C.gray, fontWeight: '700', marginTop: 2 },
  trackErrorLight: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12, marginBottom: 12 },
  trackErrorLightText: { color: C.danger, fontSize: 13, flex: 1, lineHeight: 18 },
  mealRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 12, marginBottom: 8 },
  mealDish: { fontWeight: '700', fontSize: 14, color: C.dark },
  mealMeta: { color: C.gray, fontSize: 11, marginTop: 2 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 4 },
  stepperBtnLight: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontSize: 22, fontWeight: '800', color: C.dark, minWidth: 30, textAlign: 'center' },
  nutriTipBox: { flexDirection: 'row', gap: 10, backgroundColor: C.chip, borderRadius: 14, padding: 14, marginTop: 16 },
  nutriTipBoxText: { flex: 1, color: C.dark, fontSize: 13, lineHeight: 18 },
  dietAutoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14 },
  dietAutoLabel: { fontSize: 10, fontWeight: '700', color: C.gray, letterSpacing: 0.5 },
  dietAutoValue: { fontSize: 16, fontWeight: '800', color: C.dark, marginTop: 2 },
  autoToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: C.primary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  autoToggleBtnOn: { backgroundColor: C.primary },
  autoToggleText: { fontSize: 11, fontWeight: '800', color: C.primary },
  autoToggleTextOn: { color: '#fff' },
  pushupHint: { color: 'rgba(255,255,255,0.4)', fontSize: 11, paddingHorizontal: 16, marginTop: 6, fontStyle: 'italic' },
  amplitudeBox: { backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 14 },
  amplitudeLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  amplitudeTrack: { height: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' },
  amplitudeFill: { height: 10, backgroundColor: C.primary, borderRadius: 5 },
  amplitudeSub: { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 8, lineHeight: 15 },
  thresholdBox: { backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16 },
  thresholdValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  stepperBtnDark: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  calibrateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(91,79,233,0.2)', borderRadius: 12, paddingVertical: 12, marginTop: 14 },
  calibrateBtnText: { color: C.primary, fontWeight: '800', fontSize: 11, textAlign: 'center' },
  calibrateResultBad: { color: '#FCA5A5', fontSize: 12, marginTop: 10, lineHeight: 17 },
  calibrateResultGood: { color: '#86EFAC', fontSize: 12, marginTop: 10, lineHeight: 17 },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: C.primary, borderRadius: 999, paddingVertical: 14 },
  sendBtnText: { color: C.primary, fontWeight: '800', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, maxHeight: '85%' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.dark },
  modalRecordChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.chip, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, marginBottom: 16 },
  modalRecordText: { color: C.primary, fontWeight: '800', fontSize: 13 },
  friendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  friendAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  friendName: { fontWeight: '700', fontSize: 14, color: C.dark },
  friendPseudo: { color: C.gray, fontSize: 12, marginTop: 1 },
  orDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  orLine: { flex: 1, height: 1, backgroundColor: C.border },
  orText: { color: C.light, fontWeight: '700', fontSize: 11 },
  sentConfirm: { alignItems: 'center', paddingVertical: 20 },
  sentConfirmText: { fontSize: 16, fontWeight: '800', color: C.dark, marginTop: 12 },
  cacheSearchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.chip, borderRadius: 12, paddingVertical: 12, marginBottom: 12 },
  cacheSearchBtnText: { color: C.primary, fontWeight: '700', fontSize: 12, textAlign: 'center' },
  cacheBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DCFCE7', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginBottom: 10 },
  cacheBadgeText: { color: '#15803D', fontWeight: '700', fontSize: 11 },
  suggestionsBox: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, marginTop: 6, overflow: 'hidden' },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  suggestionName: { fontWeight: '700', fontSize: 13, color: C.dark },
  suggestionCity: { color: C.gray, fontSize: 11, marginTop: 1 },
  joinedBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DCFCE7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  joinedBtnText: { color: '#15803D', fontWeight: '800', fontSize: 12 },
  directionsCard: { backgroundColor: C.chip, borderRadius: 14, padding: 14, marginTop: 14 },
  directionsTitle: { fontWeight: '800', fontSize: 13, color: C.dark, flex: 1 },
  directionsError: { color: C.danger, fontSize: 12, lineHeight: 17 },
  directionsDistance: { color: C.dark, fontSize: 14 },
  directionsBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.primary, borderRadius: 999, paddingVertical: 11 },
  directionsBtnText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  directionsRefreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  chatDetailHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 14 },
  emptyChatBox: { alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 24, marginTop: 10 },
  matchJoinedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#DCFCE7', marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  matchJoinedText: { color: '#15803D', fontWeight: '700', fontSize: 12 },
  modeSelector: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: C.border, marginHorizontal: 16, marginBottom: 12 },
  modeBtnSelector: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  modeBtnSelectorOn: { backgroundColor: C.primary },
  modeBtnSelectorDateOn: { backgroundColor: '#EC4899' },
  modeTextSelector: { fontWeight: '800', fontSize: 13, color: C.gray },
  modeTextSelectorOn: { color: '#fff' },
  storyBubble: { alignItems: 'center', marginRight: 14 },
  storyRing: { width: 72, height: 72, borderRadius: 36, padding: 3, borderWidth: 2.5 },
  storyAvatar: { flex: 1, borderRadius: 33, alignItems: 'center', justifyContent: 'center' },
  storyName: { fontSize: 11, fontWeight: '700', marginTop: 6, maxWidth: 72, textAlign: 'center' },
  // Styles scan code-barres
  scanOverlay: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 260, height: 160, borderWidth: 2, borderColor: 'rgba(91,79,233,0.8)', borderRadius: 20, borderStyle: 'dashed' },
  scanHint: { color: 'rgba(255,255,255,0.8)', marginTop: 16, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  productCard: { margin: 16, padding: 20, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  productBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginBottom: 12 },
  productImage: { width: '100%', height: 150, borderRadius: 14, marginBottom: 12, resizeMode: 'contain', backgroundColor: C.chip },
  productName: { fontWeight: '800', fontSize: 18, color: C.dark },
  productBrand: { color: C.gray, fontSize: 13, marginTop: 2 },
  productBarcode: { color: C.light, fontSize: 11, marginTop: 4 },
  macroGrid: { flexDirection: 'row', marginTop: 16, marginBottom: 8 },
  macroBox: { alignItems: 'center', flex: 1, borderRadius: 12, paddingVertical: 10 },
  macroBoxValue: { fontSize: 20, fontWeight: '800', color: C.dark },
  macroBoxLabel: { fontSize: 9, color: C.gray, fontWeight: '700', marginTop: 2 },
  macroBoxSub: { fontSize: 9, color: C.light, marginTop: 2 },
  per100gText: { color: C.light, fontSize: 11, textAlign: 'center', marginBottom: 16 },
  historyItem: { backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  historyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center' },
});

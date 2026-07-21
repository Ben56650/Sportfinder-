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


// Lightweight gradient replacement (no external package needed).
// Uses the first color of the array as a solid background so the app
// works with zero extra dependencies inside Expo Snack.
function Grad({ colors, style, children }) {
  return <View style={[style, { backgroundColor: colors[0] }]}>{children}</View>;
}

// ---------- THEME ----------
const C = {
  primary: '#5B4FE9',
  gradPurple: ['#5B4FE9', '#9B5CF6'],
  gradBlue: ['#3B9CF6', '#5B7CF6'],
  gradOrangePink: ['#FF7A45', '#EC4899'],
  bg: '#F5F5FA',
  card: '#FFFFFF',
  dark: '#161A2B',
  gray: '#6B7280',
  light: '#9CA3AF',
  border: '#EEF0F5',
  danger: '#EF4444',
  chip: '#EEF0FF',
  white: '#FFFFFF',
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

// Simule le profil utilisateur connecté (à remplacer par AsyncStorage plus tard)
const CURRENT_USER = { gender: 'male', age: 27 }; // Par défaut homme de 27 ans

function filterProfilesByGender(profiles, userGender) {
  // Hommes voient les femmes, femmes voient les hommes
  const targetGender = userGender === 'male' ? 'female' : 'male';
  return profiles.filter((p) => p.gender === targetGender);
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
];

const PARTNERS = [
  { id: 'p1', cat: 'CAFÉ', name: 'Café du Coureur', addr: '12 rue de Rivoli, Paris', offer: '-15% sur les boissons après un run' },
  { id: 'p2', cat: 'BOUTIQUE', name: 'Marathon Shop Paris', addr: '5 Rue de Rivoli, Paris', offer: '-10% sur les chaussures running' },
  { id: 'p3', cat: 'GYM', name: 'Iron Gym', addr: '44 rue de la Pompe, Paris', offer: '1 séance gratuite avec SportMatch' },
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
async function analyzeFoodPhoto(base64Image, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text:
                "Identifie le plat sur cette photo et estime sa valeur nutritionnelle pour la portion visible. Réponds UNIQUEMENT avec un objet JSON strict, sans texte autour, au format exact : " +
                '{"dish":"nom du plat en français","portion_g":nombre,"kcal":nombre,"protein_g":nombre,"carbs_g":nombre,"fat_g":nombre}',
            },
            { inline_data: { mime_type: 'image/jpeg', data: base64Image } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erreur API (${response.status}) : ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const text = parts.map((p) => p.text || '').join('');
  const clean = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);
  return parsed;
}

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

async function getDishCache() {
  try {
    const raw = await AsyncStorage.getItem('dish_cache_v1');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

async function saveDishToCache(entry) {
  const cache = await getDishCache();
  const key = normalizeDishKey(entry.dish);
  if (key) {
    cache[key] = { ...entry, cachedAt: new Date().toISOString() };
    try {
      await AsyncStorage.setItem('dish_cache_v1', JSON.stringify(cache));
    } catch (e) {}
  }
  return cache;
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
const PREMIUM_PRICE = '29.99€/mois';
const FREE_EVENT_LIMIT = 3;
const PAY_PER_EVENT_PRICE = 2; // 2€ par événement (création ou participation)

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

// ---------- SYSTÈME DE COACHS CERTIFIÉS ----------
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

async function verifyCoachPhone(phone, sports) {
  // Simulation de vérification par SMS (en production, appel API SMS)
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

async function isCoachForSport(sportKey) {
  const cert = await getCoachCertification();
  if (!cert.isCertified) return false;
  return cert.sports.includes(sportKey);
}

function isCombatSport(sportKey) {
  return COMBAT_SPORTS.includes(sportKey);
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
      setFriends(f);
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
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone'); // phone | code | success
  const [loading, setLoading] = useState(false);
  const [cert, setCert] = useState(null);
  const sport = params?.sport;

  const sendCode = async () => {
    if (!phone || phone.length < 10) {
      alert('Veuillez entrer un numéro de téléphone valide.');
      return;
    }
    setLoading(true);
    // Simulation d'envoi de SMS (en production, appel API)
    setTimeout(() => {
      setLoading(false);
      setStep('code');
      alert(`Code envoyé au ${phone} (simulation: 123456)`);
    }, 1500);
  };

  const verifyCode = async () => {
    if (code !== '123456') {
      alert('Code incorrect. Essayez 123456 pour la démo.');
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
      <Header title="Certification Coach" onBack={goBack} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>

        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(91,79,233,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Ionicons name="shield-checkmark" size={40} color={C.primary} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: C.dark, textAlign: 'center' }}>
            Devenir Coach Certifié
          </Text>
          <Text style={{ color: C.gray, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
            {sport ? `Certifiez-vous pour enseigner le ${ALL_SPORTS.find(s => s.key === sport)?.label || sport}` : 'Certifiez-vous pour proposer des séances de coach'}
          </Text>
        </View>

        {step === 'phone' ? (
          <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ fontWeight: '800', fontSize: 14, color: C.dark, marginBottom: 12 }}>📱 Vérification par SMS</Text>
            <Text style={{ color: C.gray, fontSize: 12, marginBottom: 16, lineHeight: 18 }}>
              Entrez votre numéro de téléphone. Vous recevrez un code de vérification par SMS.
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
              onPress={sendCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.submitText}>📲 ENVOYER LE CODE</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : step === 'code' ? (
          <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ fontWeight: '800', fontSize: 14, color: C.dark, marginBottom: 12 }}>🔐 Code de vérification</Text>
            <Text style={{ color: C.gray, fontSize: 12, marginBottom: 16, lineHeight: 18 }}>
              Entrez le code à 6 chiffres envoyé au {phone}.
            </Text>
            <Text style={s.label}>CODE SMS</Text>
            <TextInput
              style={s.input}
              placeholder="123456"
              placeholderTextColor={C.light}
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              maxLength={6}
            />
            <TouchableOpacity 
              style={[s.submitBtn, { marginTop: 20 }]} 
              onPress={verifyCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.submitText}>✓ VÉRIFIER</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('phone')} style={{ alignItems: 'center', marginTop: 12 }}>
              <Text style={{ color: C.gray, fontSize: 12 }}>Modifier le numéro</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#22C55E', alignItems: 'center' }}>
            <Ionicons name="shield-checkmark" size={48} color="#22C55E" />
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#15803D', marginTop: 16 }}>
              ✅ Certification réussie !
            </Text>
            <Text style={{ color: '#15803D', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
              Vous êtes maintenant coach certifié.
            </Text>
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 16, width: '100%' }}>
              <Text style={{ fontWeight: '800', fontSize: 13, color: C.dark, marginBottom: 8 }}>📋 Vos informations</Text>
              <Text style={{ color: C.gray, fontSize: 12 }}>Badge: <Text style={{ fontWeight: '800', color: C.primary }}>{cert?.badgeNumber}</Text></Text>
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
            {`• La certification est obligatoire pour les sports de combat et arts martiaux
• Vous pouvez fixer vos prix librement
• Sport Finder prélève une commission de 10% sur chaque séance
• Votre numéro est vérifié et sécurisé`}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
          SPORT <Text style={{ color: C.primary }}>• FINDER</Text>
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

      <TouchableOpacity onPress={() => go('match')}>
        <Banner icon="🤝" eyebrow="RENCONTRES SPORTIVES" title="Trouver une rencontre" subtitle="Événements à venir autour de toi · jusqu'à 800 km" />
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
              <Grad colors={C.gradBlue} style={[s.eventCard, { marginRight: 12 }]}>
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
        <TouchableOpacity style={s.primaryBtn} onPress={() => go('match')}>
          <Text style={s.primaryBtnText}>TROUVER UNE RENCONTRE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={() => go('track')}>
          <Text style={s.secondaryBtnText}>MES ACTIVITÉS</Text>
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
                    {item.isCoachSession ? ` · Badge ${item.coachBadge}` : ''}
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
                <Text style={{ color: C.dark, fontSize: 13, fontWeight: '600' }}>Abonnement Premium : <Text style={{ fontWeight: '900' }}>{PREMIUM_PRICE}</Text></Text>
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
  { key: 'team', title: 'Équipe', desc: 'Organise un match collectif avec plusieurs participants.', hint: 'Hôte : Capitaine' },
];

function NewEventScreen({ go, goBack, params }) {
  const [sport, setSport] = useState(null);
  const [format, setFormat] = useState('solo');
  const [title, setTitle] = useState('');
  const [place, setPlace] = useState('');
  const [date, setDate] = useState('2026-07-20');
  const [time, setTime] = useState('18:30');
  const [distance, setDistance] = useState('5');
  const [pace, setPace] = useState('6');
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
    showStadiumSuggestions && placeQuery.length >= 2
      ? FRENCH_STADIUMS.filter((st) => normalizeDishKey(`${st.name} ${st.city}`).includes(placeQuery)).slice(0, 6)
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
        alert('Vous devez être coach certifié pour proposer des séances de combat.');
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
    alert(`Événement "${title}" créé ! ${isCoachMode ? '🥋 Séance coach à ' + coachPrice + '€' : '🎉'}`);
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
        {FORMATS.filter((f) => (isSolo ? f.key !== 'team' : f.key !== 'solo')).map((f) => (
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
        <TouchableOpacity
          style={s.gpsBtn}
          onPress={async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
              alert('Permission GPS refusée.');
              return;
            }
            const loc = await Location.getCurrentPositionAsync({});
            setPlace(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
            setShowStadiumSuggestions(false);
          }}
        >
          <Ionicons name="locate" size={16} color={C.primary} />
          <Text style={s.gpsBtnText}>UTILISER MA POSITION GPS</Text>
        </TouchableOpacity>
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

        {isSolo ? (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>DISTANCE MINIMUM (KM)</Text>
              <TextInput style={s.input} keyboardType="numeric" value={distance} onChangeText={setDistance} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>ALLURE (MIN/KM)</Text>
              <TextInput style={s.input} keyboardType="numeric" value={pace} onChangeText={setPace} />
            </View>
          </View>
        ) : null}

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

        {/* OPTION COACH CERTIFIÉ — SPORTS DE COMBAT & ARTS MARTIAUX */}
        {sport && isCombatSport(sport) ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={s.label}>🥋 COACH CERTIFIÉ</Text>

            {coachCert.isCertified ? (
              <View style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#22C55E' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Ionicons name="shield-checkmark" size={20} color="#22C55E" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '800', fontSize: 13, color: '#15803D' }}>✓ Coach certifié — Badge {coachCert.badgeNumber}</Text>
                    <Text style={{ color: '#15803D', fontSize: 11, opacity: 0.8 }}>Tél: {coachCert.phone} · Vérifié le {new Date(coachCert.verifiedAt).toLocaleDateString('fr-FR')}</Text>
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
                      💡 Commission Sport Finder : {Math.round((parseFloat(coachPrice) || 0) * COMMISSION_RATE * 100) / 100}€ ({COMMISSION_RATE * 100}%). Vous recevrez : {Math.round((parseFloat(coachPrice) || 0) * (1 - COMMISSION_RATE) * 100) / 100}€
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
                  <Ionicons name="shield-outline" size={20} color={C.primary} />
                  <Text style={{ fontWeight: '800', fontSize: 13, color: C.dark, flex: 1 }}>Devenir coach certifié</Text>
                </View>
                <Text style={{ color: C.gray, fontSize: 12, lineHeight: 18, marginBottom: 10 }}>
                  Pour proposer des séances de {ALL_SPORTS.find(s => s.key === sport)?.label || sport}, vous devez être certifié. La vérification se fait par numéro de téléphone.
                </Text>
                <TouchableOpacity 
                  onPress={() => go('coachCertification', { sport })}
                  style={{ backgroundColor: C.primary, borderRadius: 999, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>🛡️ SE CERTIFIER</Text>
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
                <Text style={{ color: C.dark, fontSize: 13, fontWeight: '600' }}>Abonnement Premium : <Text style={{ fontWeight: '900' }}>{PREMIUM_PRICE}</Text></Text>
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
              <Text style={{ fontSize: 22, fontWeight: '900', color: C.dark }}>💎 Sport Finder Premium</Text>
              <TouchableOpacity onPress={() => setShowPremiumModal(false)}>
                <Ionicons name="close" size={24} color={C.gray} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: C.gray, fontSize: 14, lineHeight: 20, marginBottom: 20 }}>
              Déverrouille tout le potentiel de Sport Finder avec l'abonnement Premium.
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
              <Text style={{ fontSize: 36, fontWeight: '900', color: C.primary }}>29.99€</Text>
              <Text style={{ color: C.gray, fontSize: 14 }}>/mois</Text>
            </View>
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

function MatchScreen({ go, goBack }) {
  const [mode, setMode] = useState('battle'); // 'battle' ou 'date'
  const [profiles, setProfiles] = useState([]);
  const [likedProfiles, setLikedProfiles] = useState([]);
  const [lastMatch, setLastMatch] = useState(null);

  const loadDeck = () => {
    // Filtre : hommes voient les femmes, femmes voient les hommes
    let filtered = filterProfilesByGender(PROFILES, CURRENT_USER.gender);
    // Filtre par tranche d'âge compatible
    filtered = filterProfilesByAge(filtered, CURRENT_USER.age);
    // Filtre par mode (battle vs date)
    filtered = filtered.filter((p) => p.mode === mode);
    setProfiles(filtered);
  };

  useEffect(() => {
    loadDeck();
    // eslint-disable-next-line
  }, [mode]);

  const swipe = (liked) => {
    const top = profiles[0];
    if (liked && top) {
      setLikedProfiles((prev) => [...prev, top]);
      setLastMatch(top);
    }
    setProfiles((prev) => prev.slice(1));
  };

  const isDateMode = mode === 'date';

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title="Rencontres" onBack={goBack} right={<Ionicons name="calendar-outline" size={22} color={C.primary} onPress={() => go('events')} />} />

      {/* Sélecteur de mode Battle / Date */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', backgroundColor: C.card, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: C.border }}>
          <TouchableOpacity
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: !isDateMode ? C.primary : 'transparent' }}
            onPress={() => setMode('battle')}
          >
            <Ionicons name="flash" size={16} color={!isDateMode ? '#fff' : C.gray} />
            <Text style={{ fontWeight: '800', fontSize: 13, color: !isDateMode ? '#fff' : C.gray }}>BATTLE 1v1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: isDateMode ? '#EC4899' : 'transparent' }}
            onPress={() => setMode('date')}
          >
            <Ionicons name="heart" size={16} color={isDateMode ? '#fff' : C.gray} />
            <Text style={{ fontWeight: '800', fontSize: 13, color: isDateMode ? '#fff' : C.gray }}>DATE</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={{ paddingHorizontal: 16, color: C.gray, marginBottom: 12, fontSize: 13 }}>
        {isDateMode 
          ? "Glisse à droite pour matcher, à gauche pour passer — Rencontre amoureuse sportive 💕"
          : "Glisse à droite pour défier, à gauche pour passer — Défi sportif 1v1 ⚔️"}
      </Text>

      {lastMatch ? (
        <View style={[s.matchJoinedBanner, { backgroundColor: isDateMode ? '#FCE7F3' : '#DCFCE7' }]}>
          <Ionicons name={isDateMode ? "heart" : "checkmark-circle"} size={16} color={isDateMode ? '#EC4899' : '#15803D'} />
          <Text style={[s.matchJoinedText, { color: isDateMode ? '#BE185D' : '#15803D' }]}>
            {isDateMode ? `💕 Match avec ${lastMatch.name} !` : `⚔️ Défi lancé à ${lastMatch.name} !`}
          </Text>
        </View>
      ) : null}

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {profiles.length === 0 ? (
          <EmptyState
            icon={isDateMode ? "heart-outline" : "flash-outline"}
            title={isDateMode ? "Plus de profils à découvrir" : "Plus de challengers"}
            subtitle={isDateMode ? "Reviens plus tard pour de nouvelles rencontres !" : "Reviens plus tard pour de nouveaux défis !"}
            cta="RAFRAÎCHIR"
            onCta={loadDeck}
          />
        ) : (
          profiles
            .slice(0, 2)
            .reverse()
            .map((p, idx, arr) => <SwipeCard key={p.id} profile={p} isTop={idx === arr.length - 1} onSwipe={swipe} mode={mode} />)
        )}
      </View>

      {profiles.length > 0 ? (
        <View style={s.swipeActions}>
          <TouchableOpacity style={[s.roundBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => swipe(false)}>
            <Ionicons name="close" size={28} color={C.danger} />
          </TouchableOpacity>
          <TouchableOpacity style={[s.roundBtn, { backgroundColor: isDateMode ? '#FCE7F3' : C.chip }]} onPress={() => swipe(true)}>
            <Ionicons name={isDateMode ? "heart" : "flash"} size={26} color={isDateMode ? '#EC4899' : C.primary} />
          </TouchableOpacity>
        </View>
      ) : null}
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
  const [streetName, setStreetName] = useState(null);
  const [cityName, setCityName] = useState(null);

  // --- SANTÉ & MATÉRIEL ---
  const [heartRate, setHeartRate] = useState(0); // BPM via caméra
  const [measuringHR, setMeasuringHR] = useState(false);
  const [steps, setSteps] = useState(0);
  const [stepCountStart, setStepCountStart] = useState(0);
  const [recoveryScore, setRecoveryScore] = useState(null); // 0-100
  const [sleepHours, setSleepHours] = useState(0);
  const [overtrainingAlert, setOvertrainingAlert] = useState(false);
  const [hrHistory, setHrHistory] = useState([]); // historique FC
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
        { headers: { 'User-Agent': 'SportFinder/1.0' } }
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

  // --- CAPTEUR CARDIAQUE VIA CAMÉRA ---
  // Utilise le flash + caméra pour mesurer le pouls (photopléthysmographie)
  const measureHeartRate = async () => {
    setMeasuringHR(true);
    setHeartRate(0);

    // Simulation pour le moment (la vraie implémentation nécessiterait expo-camera avec flash)
    // En production, on utiliserait l'analyse des variations de couleur rouge du doigt sur la caméra
    setTimeout(() => {
      // Simule une mesure basée sur l'effort (plus on court vite, plus le coeur bat)
      const baseHR = 60;
      const effortBonus = liveSpeed > 0 ? Math.min(liveSpeed * 8, 120) : 0;
      const simulatedHR = Math.round(baseHR + effortBonus + (Math.random() * 10 - 5));
      setHeartRate(simulatedHR);
      setHrHistory((prev) => [...prev.slice(-19), simulatedHR]);
      setMeasuringHR(false);

      // Détection de surmenage
      if (simulatedHR > 180 && seconds > 600) {
        setOvertrainingAlert(true);
      }
    }, 3000);
  };

  // --- PODOMÈTRE NATIF ---
  const startPedometer = async () => {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) return;

    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const result = await Pedometer.getStepCountAsync(start, end);
    setStepCountStart(result ? result.steps : 0);

    pedometerSubRef.current = Pedometer.watchStepCount((result) => {
      setSteps(result.steps - stepCountStart);
    });
  };

  const stopPedometer = () => {
    if (pedometerSubRef.current) {
      pedometerSubRef.current.remove();
      pedometerSubRef.current = null;
    }
  };

  // --- SCORE DE RÉCUPÉRATION ---
  // Basé sur : FC moyenne, durée de la séance, heures de sommeil
  const calculateRecovery = () => {
    if (hrHistory.length === 0 || seconds === 0) return;

    const avgHR = hrHistory.reduce((a, b) => a + b, 0) / hrHistory.length;
    const intensity = avgHR / 200; // 0 à 1
    const durationFactor = Math.min(seconds / 3600, 2) / 2; // 0 à 1
    const sleepFactor = Math.min(sleepHours / 8, 1); // 0 à 1

    // Score : 100 = parfait, 0 = épuisé
    const score = Math.round((1 - (intensity * durationFactor * (1.5 - sleepFactor))) * 100);
    setRecoveryScore(Math.max(0, Math.min(100, score)));
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
    setOvertrainingAlert(false);
    setHrHistory([]);
    setRecoveryScore(null);
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
    calculateRecovery();
  };

  const resume = () => {
    if (currentPauseStart) {
      const pauseDuration = Math.floor((Date.now() - currentPauseStart) / 1000);
      setTotalPauseSeconds((prev) => prev + pauseDuration);
      setCurrentPauseStart(null);
    }
    start();
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchRef.current) { watchRef.current.remove(); watchRef.current = null; }
    stopPedometer();
    setRunning(false);
    setPaused(false);
    if (currentPauseStart) {
      const pauseDuration = Math.floor((Date.now() - currentPauseStart) / 1000);
      setTotalPauseSeconds((prev) => prev + pauseDuration);
      setCurrentPauseStart(null);
    }
    calculateRecovery();
    const cals = Math.round(km * (mode === 'course' ? 60 : mode === 'marche' ? 40 : 50));
    let isNewRecord = false;
    if (km > recordKm) { setRecordKm(km); isNewRecord = true; }
    if (maxSpeed > recordSpeed) { setRecordSpeed(maxSpeed); isNewRecord = true; }
    if (cals > recordKcal) { setRecordKcal(cals); isNewRecord = true; }
    if (isNewRecord) { setSessionType('personal'); }
    else if (km > 0) { setSessionType('exercise'); }
    else { setSessionType(null); }
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
    setStreetName(null);
    setCityName(null);
    setHeartRate(0);
    setMeasuringHR(false);
    setSteps(0);
    setStepCountStart(0);
    setRecoveryScore(null);
    setOvertrainingAlert(false);
    setHrHistory([]);
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

      {/* SANTÉ & MATÉRIEL */}
      <View style={{ marginHorizontal: 16, marginTop: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 12 }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 10 }}>❤️ SANTÉ & CAPTEURS</Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Fréquence cardiaque */}
          <TouchableOpacity 
            onPress={measureHeartRate}
            disabled={measuringHR}
            style={{ flex: 1, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' }}
          >
            <Ionicons name="heart" size={16} color={heartRate > 160 ? '#EF4444' : '#FCA5A5'} />
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 }}>
              {measuringHR ? '...' : (heartRate > 0 ? heartRate : '—')}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9 }}>BPM</Text>
            {heartRate > 0 && heartRate < 100 ? (
              <View style={{ backgroundColor: 'rgba(34,197,94,0.3)', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 }}>
                <Text style={{ color: '#22C55E', fontSize: 8, fontWeight: '700' }}>Z1</Text>
              </View>
            ) : heartRate >= 100 && heartRate < 140 ? (
              <View style={{ backgroundColor: 'rgba(59,130,246,0.3)', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 }}>
                <Text style={{ color: '#3B82F6', fontSize: 8, fontWeight: '700' }}>Z2</Text>
              </View>
            ) : heartRate >= 140 && heartRate < 170 ? (
              <View style={{ backgroundColor: 'rgba(245,158,11,0.3)', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 }}>
                <Text style={{ color: '#F59E0B', fontSize: 8, fontWeight: '700' }}>Z3</Text>
              </View>
            ) : heartRate >= 170 ? (
              <View style={{ backgroundColor: 'rgba(239,68,68,0.3)', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 }}>
                <Text style={{ color: '#EF4444', fontSize: 8, fontWeight: '700' }}>Z4+</Text>
              </View>
            ) : null}
          </TouchableOpacity>

          {/* Pas */}
          <View style={{ flex: 1, backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' }}>
            <Ionicons name="footsteps" size={16} color="#3B82F6" />
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 }}>{steps > 0 ? steps : '—'}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9 }}>PAS</Text>
          </View>

          {/* Récupération */}
          <View style={{ flex: 1, backgroundColor: recoveryScore !== null ? (recoveryScore > 70 ? 'rgba(34,197,94,0.1)' : recoveryScore > 40 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)') : 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: recoveryScore !== null ? (recoveryScore > 70 ? 'rgba(34,197,94,0.3)' : recoveryScore > 40 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)') : 'rgba(255,255,255,0.1)' }}>
            <Ionicons name="battery-charging" size={16} color={recoveryScore !== null ? (recoveryScore > 70 ? '#22C55E' : recoveryScore > 40 ? '#F59E0B' : '#EF4444') : 'rgba(255,255,255,0.3)'} />
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 }}>{recoveryScore !== null ? recoveryScore : '—'}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9 }}>RÉCUP %</Text>
          </View>
        </View>

        {/* Sommeil */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
          <Ionicons name="moon" size={14} color="rgba(255,255,255,0.5)" />
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Sommeil :</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
            <TouchableOpacity onPress={() => setSleepHours(Math.max(0, sleepHours - 0.5))} style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="remove" size={12} color="#fff" />
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13, minWidth: 40, textAlign: 'center' }}>{sleepHours}h</Text>
            <TouchableOpacity onPress={() => setSleepHours(Math.min(12, sleepHours + 0.5))} style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="add" size={12} color="#fff" />
            </TouchableOpacity>
          </View>
          {sleepHours < 6 ? (
            <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '700' }}>⚠️ Fatigue</Text>
          ) : sleepHours > 8 ? (
            <Text style={{ color: '#22C55E', fontSize: 10, fontWeight: '700' }}>✓ Reposé</Text>
          ) : null}
        </View>
      </View>

      {/* Alerte surmenage */}
      {overtrainingAlert ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.15)', marginHorizontal: 16, marginTop: 8, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' }}>
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FCA5A5', fontWeight: '800', fontSize: 12 }}>⚠️ ALERTE SURMENAGE</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>FC trop élevée pendant trop longtemps. Ralentis ou arrête.</Text>
          </View>
        </View>
      ) : null}

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

      {/* BOUTONS */}
      <View style={{ paddingHorizontal: 16, marginTop: 'auto', paddingBottom: 16 }}>
        {!running && !paused && seconds === 0 ? (
          <TouchableOpacity onPress={start}>
            <Grad colors={C.gradOrangePink} style={[s.startBtn, { paddingVertical: 14 }]}>
              <Text style={s.startText}>▶ DÉMARRER</Text>
            </Grad>
          </TouchableOpacity>
        ) : running ? (
          <TouchableOpacity onPress={pause}>
            <Grad colors={['#EF4444', '#F97316']} style={[s.startBtn, { paddingVertical: 14 }]}>
              <Text style={s.startText}>⏸ PAUSE</Text>
            </Grad>
          </TouchableOpacity>
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
        recordLabel={`${km.toFixed(2)} km en ${mm}:${ss}${pauseCount > 0 ? ` — ${pauseCount} pause${pauseCount > 1 ? 's' : ''} (${Math.floor(totalPauseSeconds / 60)}:${(totalPauseSeconds % 60).toString().padStart(2, '0')})` : ''}`}
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
    if (countRef.current > best) {
      setBest(countRef.current);
      setSessionType('personal');
      try {
        await AsyncStorage.setItem('pushup_best_score', String(countRef.current));
      } catch (e) {}
    } else if (countRef.current > 0) {
      setSessionType('exercise');
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
      await Share.share({ message: `💪 Je viens de faire ${count} pompes sur Sport Finder ! Record perso : ${best}.` });
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

function ContactsScreen({ go, goBack }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title="Contacts" onBack={goBack} />
      <EmptyState icon="people-outline" title="Aucun contact" subtitle="Acceptez une proposition de run ou ajoutez un runner depuis son profil." cta="VOIR LES ÉVÉNEMENTS" onCta={() => go('match')} />
    </SafeAreaView>
  );
}

function ChatsScreen({ go, goBack }) {
  const linkedEvent = EVENTS.find((e) => e.id === 'e2'); // "Rencontre de rugby 2"
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={s.brandRow}>
        <Text style={s.brand}>
          SPORT <Text style={{ color: C.primary }}>• FINDER</Text>
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

function VenuesScreen({ go, goBack }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title="Trouver un terrain" onBack={goBack} />
      <Banner icon="🏢" eyebrow="RÉSERVATION TERRAINS" title={`${VENUES.length} complexes dispo`} />
      <FlatList
        data={VENUES}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        renderItem={({ item }) => (
          <View style={s.venueCard}>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ fontSize: 26, marginRight: 12 }}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.venueTitle}>{item.name}</Text>
                <Text style={{ color: C.gray, fontSize: 12 }}>{item.tags.join(' · ')}</Text>
              </View>
              <Text style={{ fontWeight: '800', color: C.primary, fontSize: 18 }}>{item.price}</Text>
            </View>
            <Text style={{ color: C.gray, fontSize: 13, marginTop: 8 }}>📍 {item.addr}</Text>
            <TouchableOpacity style={s.bookBtn}>
              <Text style={s.bookText}>📅 CHOISIR UN CRÉNEAU</Text>
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
                    <TouchableOpacity onPress={async () => { const updated = await removeFriend(f.id); setFriends(updated); }}>
                      <Ionicons name="close-circle" size={20} color={C.light} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

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
function NutritionScreen({ go, goBack }) {
  const [goal, setGoal] = useState({ targetKcal: 2000, mealsPerDay: 3, dietName: '' });
  const [log, setLog] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyField, setShowKeyField] = useState(false);
  const [step, setStep] = useState('idle'); // idle | search | analyzing | result | manual | error
  const [photoUri, setPhotoUri] = useState(null);
  const [result, setResult] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [manual, setManual] = useState({ dish: '', portion_g: '200', kcal: '', protein_g: '', carbs_g: '', fat_g: '' });
  const [dishCache, setDishCache] = useState({});
  const [cacheQuery, setCacheQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const g = await AsyncStorage.getItem('nutrition_goal');
        if (g) setGoal(JSON.parse(g));
        const k = await AsyncStorage.getItem('gemini_api_key');
        if (k) setApiKey(k);
        const l = await AsyncStorage.getItem(todayKey());
        if (l) setLog(JSON.parse(l));
        const cache = await getDishCache();
        setDishCache(cache);
      } catch (e) {}
    })();
  }, []);

  const saveApiKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) return;
    setApiKey(trimmed);
    setApiKeyInput('');
    setShowKeyField(false);
    try {
      await AsyncStorage.setItem('gemini_api_key', trimmed);
    } catch (e) {}
  };

  const consumed = log.reduce((sum, m) => sum + (m.kcal || 0), 0);
  const remaining = goal.targetKcal - consumed;
  const progress = Math.min(1, consumed / Math.max(1, goal.targetKcal));

  const pickPhoto = async (fromCamera) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      setErrorMsg('Permission caméra/galerie refusée.');
      setStep('error');
      return;
    }
    const options = { base64: true, quality: 0.5, mediaTypes: ImagePicker.MediaTypeOptions.Images };
    const res = fromCamera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (res.canceled) return;
    const asset = res.assets[0];
    setPhotoUri(asset.uri);
    await runAnalysis(asset.base64);
  };

  const runAnalysis = async (base64) => {
    if (!apiKey) {
      setErrorMsg('Aucune clé API Gemini enregistrée. Ajoute-la ci-dessus, ou saisis les valeurs manuellement.');
      setStep('error');
      return;
    }
    setStep('analyzing');
    setFromCache(false);
    try {
      const parsed = await analyzeFoodPhoto(base64, apiKey);
      // Si ce plat existe déjà dans le cache, on garde les valeurs déjà validées plutôt que
      // de faire confiance à une nouvelle estimation qui pourrait légèrement varier.
      const key = normalizeDishKey(parsed.dish);
      const existing = dishCache[key];
      if (existing) {
        setResult(existing);
        setFromCache(true);
      } else {
        setResult(parsed);
        const updatedCache = await saveDishToCache(parsed);
        setDishCache(updatedCache);
      }
      setStep('result');
    } catch (e) {
      setErrorMsg(e.message || "L'analyse a échoué.");
      setStep('error');
    }
  };

  const useCachedDish = (entry) => {
    setPhotoUri(null);
    setResult(entry);
    setFromCache(true);
    setStep('result');
    setCacheQuery('');
  };

  const addToLog = async (entry) => {
    const newLog = [...log, { ...entry, id: String(Date.now()) }];
    setLog(newLog);
    try {
      await AsyncStorage.setItem(todayKey(), JSON.stringify(newLog));
    } catch (e) {}
    setStep('idle');
    setResult(null);
    setPhotoUri(null);
    setFromCache(false);
    setManual({ dish: '', portion_g: '200', kcal: '', protein_g: '', carbs_g: '', fat_g: '' });
  };

  const removeFromLog = async (id) => {
    const newLog = log.filter((m) => m.id !== id);
    setLog(newLog);
    try {
      await AsyncStorage.setItem(todayKey(), JSON.stringify(newLog));
    } catch (e) {}
  };

  const cacheEntries = Object.values(dishCache);
  const filteredCache = cacheQuery.trim()
    ? cacheEntries.filter((d) => normalizeDishKey(d.dish).includes(normalizeDishKey(cacheQuery)))
    : cacheEntries;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={s.brandRow}>
        <Text style={s.brand}>
          SPORT <Text style={{ color: C.primary }}>• FINDER</Text>
        </Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: '900' }}>NUTRITION IA</Text>
        <TouchableOpacity onPress={() => go('nutritionGoal')}>
          <Ionicons name="flag-outline" size={24} color={C.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
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
            <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={s.nutriDashSub}>
            {consumed} kcal consommées · {goal.mealsPerDay} repas/jour{goal.dietName ? ` · ${goal.dietName}` : ''}
          </Text>
          {goal.dietName ? <Text style={s.nutriTip}>💡 {tipForDiet(goal.dietName)}</Text> : null}
        </View>

        {!apiKey ? (
          <View style={s.apiKeyBox}>
            <Text style={s.apiKeyTitle}>🔑 Clé API Gemini requise pour l’analyse IA</Text>
            {showKeyField ? (
              <>
                <TextInput
                  style={s.input}
                  placeholder="AIza..."
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <TouchableOpacity style={[s.joinBtn, { marginTop: 8, alignSelf: 'flex-start' }]} onPress={saveApiKey}>
                  <Text style={s.joinBtnText}>ENREGISTRER LA CLÉ</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={() => setShowKeyField(true)}>
                <Text style={{ color: C.primary, fontWeight: '800', fontSize: 12 }}>+ Ajouter ma clé (gratuite sur aistudio.google.com)</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {step === 'idle' ? (
          <>
            <TouchableOpacity style={s.cacheSearchBtn} onPress={() => setStep('search')}>
              <Ionicons name="flash" size={16} color={C.primary} />
              <Text style={s.cacheSearchBtnText}>
                Choisir un plat déjà scanné ({cacheEntries.length}) — instantané, gratuit
              </Text>
            </TouchableOpacity>
            <View style={s.nutriActionsRow}>
              <TouchableOpacity style={s.nutriActionBtn} onPress={() => pickPhoto(true)}>
                <Ionicons name="camera" size={20} color={C.primary} />
                <Text style={s.nutriActionText}>Prendre une photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.nutriActionBtn} onPress={() => pickPhoto(false)}>
                <Ionicons name="images" size={20} color={C.primary} />
                <Text style={s.nutriActionText}>Depuis la galerie</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {step === 'search' ? (
          <View style={s.nutriResultCard}>
            <Text style={s.subLabel}>PLATS DÉJÀ DANS TA BASE</Text>
            <TextInput
              style={s.input}
              placeholder="Rechercher (ex: cheeseburger)"
              value={cacheQuery}
              onChangeText={setCacheQuery}
              autoCapitalize="none"
            />
            {filteredCache.length === 0 ? (
              <Text style={{ color: C.gray, fontSize: 13, marginTop: 12 }}>
                {cacheEntries.length === 0 ? 'Aucun plat scanné pour le moment.' : 'Aucun résultat pour cette recherche.'}
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 260, marginTop: 8 }}>
                {filteredCache.map((d) => (
                  <TouchableOpacity key={normalizeDishKey(d.dish)} style={s.mealRow} onPress={() => useCachedDish(d)}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.mealDish}>{d.dish}</Text>
                      <Text style={s.mealMeta}>
                        {d.portion_g} g · {d.kcal} kcal · P {d.protein_g}g · G {d.carbs_g}g · L {d.fat_g}g
                      </Text>
                    </View>
                    <Ionicons name="flash" size={16} color={C.primary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity onPress={() => { setStep('idle'); setCacheQuery(''); }} style={{ alignItems: 'center', marginTop: 14 }}>
              <Text style={{ color: C.gray, fontSize: 12 }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {step === 'analyzing' ? (
          <View style={s.nutriResultCard}>
            {photoUri ? <Image source={{ uri: photoUri }} style={s.nutriPhoto} /> : null}
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <ActivityIndicator color={C.primary} size="large" />
              <Text style={{ color: C.gray, marginTop: 10 }}>Analyse du plat par l’IA…</Text>
            </View>
          </View>
        ) : null}

        {step === 'result' && result ? (
          <View style={s.nutriResultCard}>
            {photoUri ? <Image source={{ uri: photoUri }} style={s.nutriPhoto} /> : null}
            {fromCache ? (
              <View style={s.cacheBadge}>
                <Ionicons name="flash" size={12} color={C.primary} />
                <Text style={s.cacheBadgeText}>Résultat instantané depuis ta base — aucun appel IA</Text>
              </View>
            ) : null}
            <Text style={s.nutriDish}>{result.dish}</Text>
            <Text style={s.nutriPortion}>Portion estimée : {result.portion_g} g</Text>
            <View style={s.macroRow}>
              <View style={s.macroCell}>
                <Text style={s.macroValue}>{result.kcal}</Text>
                <Text style={s.macroLabel}>KCAL</Text>
              </View>
              <View style={s.macroCell}>
                <Text style={s.macroValue}>{result.protein_g}g</Text>
                <Text style={s.macroLabel}>PROTÉINES</Text>
              </View>
              <View style={s.macroCell}>
                <Text style={s.macroValue}>{result.carbs_g}g</Text>
                <Text style={s.macroLabel}>GLUCIDES</Text>
              </View>
              <View style={s.macroCell}>
                <Text style={s.macroValue}>{result.fat_g}g</Text>
                <Text style={s.macroLabel}>LIPIDES</Text>
              </View>
            </View>
            <TouchableOpacity style={s.submitBtn} onPress={() => addToLog(result)}>
              <Text style={s.submitText}>+ AJOUTER AU JOURNAL</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setStep('idle'); setResult(null); setPhotoUri(null); setFromCache(false); }} style={{ alignItems: 'center', marginTop: 10 }}>
              <Text style={{ color: C.gray, fontSize: 12 }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {step === 'error' ? (
          <View style={s.nutriResultCard}>
            <View style={s.trackErrorLight}>
              <Ionicons name="warning-outline" size={18} color={C.danger} />
              <Text style={s.trackErrorLightText}>{errorMsg}</Text>
            </View>
            <Text style={s.subLabel}>SAISIE MANUELLE</Text>
            <TextInput style={s.input} placeholder="Nom du plat" value={manual.dish} onChangeText={(v) => setManual({ ...manual, dish: v })} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TextInput style={[s.input, { flex: 1 }]} placeholder="Portion (g)" keyboardType="numeric" value={manual.portion_g} onChangeText={(v) => setManual({ ...manual, portion_g: v })} />
              <TextInput style={[s.input, { flex: 1 }]} placeholder="Kcal" keyboardType="numeric" value={manual.kcal} onChangeText={(v) => setManual({ ...manual, kcal: v })} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TextInput style={[s.input, { flex: 1 }]} placeholder="Protéines (g)" keyboardType="numeric" value={manual.protein_g} onChangeText={(v) => setManual({ ...manual, protein_g: v })} />
              <TextInput style={[s.input, { flex: 1 }]} placeholder="Glucides (g)" keyboardType="numeric" value={manual.carbs_g} onChangeText={(v) => setManual({ ...manual, carbs_g: v })} />
              <TextInput style={[s.input, { flex: 1 }]} placeholder="Lipides (g)" keyboardType="numeric" value={manual.fat_g} onChangeText={(v) => setManual({ ...manual, fat_g: v })} />
            </View>
            <TouchableOpacity
              style={s.submitBtn}
              onPress={async () => {
                const entry = {
                  dish: manual.dish || 'Plat manuel',
                  portion_g: parseInt(manual.portion_g, 10) || 0,
                  kcal: parseInt(manual.kcal, 10) || 0,
                  protein_g: parseInt(manual.protein_g, 10) || 0,
                  carbs_g: parseInt(manual.carbs_g, 10) || 0,
                  fat_g: parseInt(manual.fat_g, 10) || 0,
                };
                const updatedCache = await saveDishToCache(entry);
                setDishCache(updatedCache);
                addToLog(entry);
              }}
            >
              <Text style={s.submitText}>+ AJOUTER AU JOURNAL</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('idle')} style={{ alignItems: 'center', marginTop: 10 }}>
              <Text style={{ color: C.gray, fontSize: 12 }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={[s.subLabel, { marginTop: 20 }]}>REPAS D’AUJOURD’HUI</Text>
        {log.length === 0 ? (
          <Text style={{ color: C.gray, fontSize: 13 }}>Aucun repas enregistré pour le moment.</Text>
        ) : (
          log.map((m) => (
            <View key={m.id} style={s.mealRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.mealDish}>{m.dish}</Text>
                <Text style={s.mealMeta}>
                  {m.portion_g} g · {m.kcal} kcal · P {m.protein_g}g · G {m.carbs_g}g · L {m.fat_g}g
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeFromLog(m.id)}>
                <Ionicons name="trash-outline" size={18} color={C.light} />
              </TouchableOpacity>
            </View>
          ))
        )}
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
};

export default function App() {
  // La navigation est une vraie pile : "go" empile un écran (avec des paramètres optionnels),
  // "goBack" le dépile. Ça permet un vrai bouton Retour (flèche en haut ET bouton physique
  // Android), et de transmettre des données précises (ex: un événement) entre écrans.
  const [stack, setStack] = useState([{ key: 'home' }]);
  const [profilePhoto, setProfilePhoto] = useState(null);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1 }}>
        <Screen go={go} goBack={goBack} params={params} profilePhoto={profilePhoto} setProfilePhoto={setProfilePhoto} />
      </View>
      {isTab ? <TabBar active={screen} onTabPress={onTabPress} profilePhoto={profilePhoto} /> : null}
    </SafeAreaView>
  );
}

// ---------- STYLES ----------
const s = StyleSheet.create({
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  brand: { fontSize: 22, fontWeight: '800', color: C.dark, letterSpacing: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerSide: { width: 36 },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', fontSize: 15 },
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
  banner: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 16, marginHorizontal: 16, marginBottom: 16 },
  bannerIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  bannerEyebrow: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700' },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  bannerSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2 },
  bannerBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  bannerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '800' },
  link: { color: C.primary, fontWeight: '800', fontSize: 12 },
  createCard: { width: 140, height: 190, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: C.card },
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
  primaryBtn: { flex: 1, backgroundColor: C.primary, paddingVertical: 14, borderRadius: 999, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  secondaryBtn: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, paddingVertical: 14, borderRadius: 999, alignItems: 'center' },
  secondaryBtnText: { color: C.dark, fontWeight: '800', fontSize: 11 },
  runnerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 18, padding: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  runnerName: { fontWeight: '800', fontSize: 15 },
  runnerMeta: { color: C.gray, fontSize: 13, marginTop: 2 },
  eventListCard: { backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 14 },
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
  submitBtn: { backgroundColor: C.primary, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  swipeCard: { position: 'absolute', width: 300, height: 420, borderRadius: 24, overflow: 'hidden', backgroundColor: C.card },
  swipeInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)', padding: 20 },
  swipeName: { color: '#fff', fontSize: 24, fontWeight: '900' },
  swipeMeta: { color: '#fff', marginTop: 4 },
  swipeChip: { color: '#fff', fontWeight: '700', marginTop: 8, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  swipeActions: { flexDirection: 'row', justifyContent: 'center', gap: 32, paddingBottom: 16 },
  roundBtn: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  startBtn: { paddingVertical: 18, borderRadius: 999, alignItems: 'center' },
  startText: { color: '#fff', fontWeight: '800', fontSize: 15 },
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
  venueCard: { backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 14 },
  venueTitle: { fontWeight: '800', fontSize: 15, marginBottom: 4 },
  bookBtn: { backgroundColor: C.primary, borderRadius: 999, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
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
  tabBar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 10, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border },
  tabIconOn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
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
});

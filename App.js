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

// Panneau réutilisable pour envoyer un record à un ami (liste) ou par pseudo (recherche libre).
function SendRecordPanel({ visible, onClose, recordLabel }) {
  const [pseudoInput, setPseudoInput] = useState('');
  const [sentTo, setSentTo] = useState(null);

  const reset = () => {
    setPseudoInput('');
    setSentTo(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const doSend = async (recipientLabel) => {
    await sendRecordToFriend(recordLabel, recipientLabel);
    setSentTo(recipientLabel);
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
            <Ionicons name="trophy" size={14} color={C.primary} />
            <Text style={s.modalRecordText}>{recordLabel}</Text>
          </View>

          {sentTo ? (
            <View style={s.sentConfirm}>
              <Ionicons name="checkmark-circle" size={40} color={C.success} />
              <Text style={s.sentConfirmText}>Envoyé à {sentTo} !</Text>
              <TouchableOpacity style={[s.joinBtn, { marginTop: 16 }]} onPress={close}>
                <Text style={s.joinBtnText}>FERMER</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={s.subLabel}>MES AMIS</Text>
              <ScrollView style={{ maxHeight: 220 }}>
                {FRIENDS.map((f) => (
                  <TouchableOpacity key={f.id} style={s.friendRow} onPress={() => doSend(`${f.name} (${f.pseudo})`)}>
                    <View style={s.friendAvatar}>
                      <Text style={{ fontSize: 18 }}>{f.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.friendName}>{f.name}</Text>
                      <Text style={s.friendPseudo}>{f.pseudo}</Text>
                    </View>
                    <Ionicons name="send" size={16} color={C.primary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={s.orDivider}>
                <View style={s.orLine} />
                <Text style={s.orText}>OU</Text>
                <View style={s.orLine} />
              </View>

              <Text style={s.subLabel}>ENVOYER PAR PSEUDO</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="@pseudo"
                  autoCapitalize="none"
                  value={pseudoInput}
                  onChangeText={setPseudoInput}
                />
                <TouchableOpacity
                  style={[s.joinBtn, !pseudoInput.trim() && { opacity: 0.4 }]}
                  disabled={!pseudoInput.trim()}
                  onPress={() => doSend(pseudoInput.trim())}
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

// ---------- SCREENS ----------
function HomeScreen({ go, goBack }) {
  const [filter, setFilter] = useState(null);
  const [sportSearch, setSportSearch] = useState('');

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

  const toggleJoin = async (id) => {
    const nowJoined = !joinedIds[id];
    setJoinedIds((prev) => ({ ...prev, [id]: nowJoined }));
    await setEventJoined(id, nowJoined);
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
                  <Text style={s.eventListTitle}>{item.title}</Text>
                  <Text style={s.eventListHost}>
                    Hôte: {item.host} · {item.when}
                  </Text>
                </View>
              </View>
              <Text style={s.eventListMeta}>
                📍 {item.loc}   🕐 {item.date}
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
                    <Text style={joined ? s.joinedBtnText : s.joinBtnText}>{joined ? '✓ INSCRIT' : '+ REJOINDRE'}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {joined ? <EventDirectionsCard event={item} /> : null}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const FORMATS = [
  { key: 'solo', title: 'Pratique individuelle', desc: "Tu t'entraînes seul·e. Pas d'autre participant." },
  { key: 'duo', title: 'Entraînement à 2', desc: 'Tu cherches UN partenaire. Max 2 personnes au total. L’hôte est le Modérateur.', hint: 'Hôte : Modérateur · Max 2 personnes' },
  { key: 'team', title: 'Équipe', desc: 'Organise un match collectif avec plusieurs participants.', hint: 'Hôte : Capitaine' },
];

function NewEventScreen({ go, goBack }) {
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

  const submit = () => {
    if (!sport || !title || !place) {
      alert('Sport, titre et lieu sont obligatoires.');
      return;
    }
    alert(`Événement "${title}" créé ! 🎉`);
    go('events');
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title="Nouvel événement" onBack={goBack} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <View style={s.trialBadge}>
          <Ionicons name="gift-outline" size={16} color={C.primary} />
          <Text style={s.trialText}>GRATUIT POUR 3 ESSAIS · 2 restants</Text>
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

        <TouchableOpacity style={s.submitBtn} onPress={submit}>
          <Text style={s.submitText}>⚡ CRÉER L’ÉVÉNEMENT</Text>
        </TouchableOpacity>
      </ScrollView>
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
  const [avgPace, setAvgPace] = useState(0); // allure en min/km
  const [heading, setHeading] = useState(0); // cap en degrés
  const [errorMsg, setErrorMsg] = useState(null);
  const [gpsReady, setGpsReady] = useState(false);
  const [coords, setCoords] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [recordKm, setRecordKm] = useState(0.02);
  const [recordSpeed, setRecordSpeed] = useState(0);
  const [recordKcal, setRecordKcal] = useState(1);
  const [sendPanelOpen, setSendPanelOpen] = useState(false);
  const [pathCoords, setPathCoords] = useState([]); // historique des points GPS
  const timerRef = useRef(null);
  const watchRef = useRef(null);
  const headingRef = useRef(null);
  const lastCoordRef = useRef(null);
  const speedBufferRef = useRef([]); // buffer pour lisser la vitesse
  const kmRef = useRef(0);
  const secondsRef = useRef(0);

  // Sync refs
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

  // Boussole - suivi du cap
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
    return () => {
      if (sub) sub.remove();
    };
  }, []);

  // Fonction pour obtenir la direction cardinale
  const getCardinalDirection = (deg) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  // Fonction pour lisser la vitesse (moyenne mobile sur 5 points)
  const smoothSpeed = (newSpeed) => {
    speedBufferRef.current.push(newSpeed);
    if (speedBufferRef.current.length > 5) {
      speedBufferRef.current.shift();
    }
    const avg = speedBufferRef.current.reduce((a, b) => a + b, 0) / speedBufferRef.current.length;
    return avg;
  };

  const start = async () => {
    setErrorMsg(null);
    setGpsReady(false);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission GPS refusée. Autorise la localisation pour suivre ta course.');
      return;
    }

    if (!paused) {
      // Nouvelle session (pas une reprise)
      lastCoordRef.current = null;
      speedBufferRef.current = [];
      setPathCoords([]);
    }

    timerRef.current = setInterval(() => setSeconds((x) => x + 1), 1000);

    try {
      watchRef.current = await Location.watchPositionAsync(
        { 
          accuracy: Location.Accuracy.BestForNavigation, 
          timeInterval: 1000, 
          distanceInterval: 1,
        },
        (loc) => {
          const { latitude, longitude, speed, accuracy } = loc.coords;
          setCoords(loc.coords);
          setGpsAccuracy(accuracy);
          setGpsReady(true);

          // Filtre de qualité GPS : ignore les points avec précision > 20m
          if (accuracy && accuracy > 20) return;

          // Calcul de distance avec le dernier point valide
          if (lastCoordRef.current) {
            const d = haversineKm(
              lastCoordRef.current.latitude, 
              lastCoordRef.current.longitude, 
              latitude, 
              longitude
            );
            // Filtre anti-saut : ignore les segments > 100m en 1s (impossible à pied/vélo)
            if (d < 0.1 && d > 0.001) {
              setKm((prev) => prev + d);
              setPathCoords((prev) => [...prev, { latitude, longitude }]);
            }
          }
          lastCoordRef.current = { latitude, longitude };

          // Vitesse lissée
          const rawKmh = speed && speed > 0 ? speed * 3.6 : 0;
          const smoothedKmh = smoothSpeed(rawKmh);
          setLiveSpeed(smoothedKmh);
          setMaxSpeed((prev) => Math.max(prev, smoothedKmh));

          // Allure (pace) en min/km
          if (kmRef.current > 0.01 && secondsRef.current > 0) {
            const pace = (secondsRef.current / 60) / kmRef.current;
            setAvgPace(pace);
          }
        }
      );
    } catch (e) {
      setErrorMsg('Impossible de démarrer le suivi GPS sur cet appareil.');
      clearInterval(timerRef.current);
      return;
    }
    setRunning(true);
    setPaused(false);
  };

  const pause = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setRunning(false);
    setPaused(true);
  };

  const resume = () => {
    start();
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setRunning(false);
    setPaused(false);
    if (km > recordKm) setRecordKm(km);
    if (maxSpeed > recordSpeed) setRecordSpeed(maxSpeed);
    const cals = Math.round(km * (mode === 'course' ? 60 : mode === 'marche' ? 40 : 50));
    if (cals > recordKcal) setRecordKcal(cals);
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
    lastCoordRef.current = null;
    speedBufferRef.current = [];
  };

  const mm = Math.floor(seconds / 60);
  const ss = (seconds % 60).toString().padStart(2, '0');
  const paceMin = avgPace > 0 ? Math.floor(avgPace) : 0;
  const paceSec = avgPace > 0 ? Math.round((avgPace - paceMin) * 60).toString().padStart(2, '0') : '00';
  const calorieFactor = mode === 'course' ? 60 : mode === 'marche' ? 40 : 50;
  const calories = Math.round(km * calorieFactor);

  const mapUri = coords
    ? `https://staticmap.openstreetmap.de/staticmap.php?center=${coords.latitude},${coords.longitude}&zoom=15&size=600x260&maptype=mapnik&markers=${coords.latitude},${coords.longitude},red-pushpin`
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B14' }}>
      <ScrollView>
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: C.primary, fontWeight: '800', letterSpacing: 1, marginTop: 8 }}>SOLO RUN</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#fff', fontSize: 38, fontWeight: '900' }}>TRACK</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Boussole */}
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: `${-heading}deg` }] }}>
                  <Ionicons name="navigate" size={18} color="#22C55E" style={{ transform: [{ rotate: '0deg' }] }} />
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', marginTop: 2 }}>{getCardinalDirection(heading)}</Text>
              </View>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: running ? '#22C55E' : gpsReady ? '#F59E0B' : '#EF4444' }} />
            </View>
          </View>
        </View>

        <View style={s.trackInfo}>
          <Ionicons name="information-circle" size={18} color={C.primary} />
          <Text style={s.trackInfoText}>
            GPS haute précision activé. Précision actuelle : {gpsAccuracy ? `±${gpsAccuracy.toFixed(0)}m` : 'calcul...'}
          </Text>
        </View>

        {mapUri ? (
          <Image source={{ uri: mapUri }} style={s.mapImage} />
        ) : (
          <View style={s.mapPlaceholder}>
            <Ionicons name="map-outline" size={26} color="rgba(255,255,255,0.3)" />
            <Text style={s.mapPlaceholderText}>Carte disponible après autorisation GPS</Text>
          </View>
        )}

        {errorMsg ? (
          <View style={s.trackError}>
            <Ionicons name="warning-outline" size={18} color="#FCA5A5" />
            <Text style={s.trackErrorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {running && !gpsReady ? (
          <View style={s.trackInfo}>
            <Ionicons name="locate-outline" size={16} color={C.primary} />
            <Text style={s.trackInfoText}>Recherche du signal GPS haute précision…</Text>
          </View>
        ) : null}

        <View style={s.recordsRow}>
          <View style={s.recordItem}>
            <Text style={s.recordEmoji}>🏆</Text>
            <Text style={s.recordValue}>{recordKm.toFixed(2)} km</Text>
            <Text style={s.recordLabel}>RECORD KM</Text>
          </View>
          <View style={s.recordDivider} />
          <View style={s.recordItem}>
            <Text style={s.recordEmoji}>⚡</Text>
            <Text style={s.recordValue}>{recordSpeed.toFixed(1)}</Text>
            <Text style={s.recordLabel}>RECORD KM/H</Text>
          </View>
          <View style={s.recordDivider} />
          <View style={s.recordItem}>
            <Text style={s.recordEmoji}>🔥</Text>
            <Text style={s.recordValue}>{recordKcal}</Text>
            <Text style={s.recordLabel}>RECORD KCAL</Text>
          </View>
        </View>

        <View style={s.modesRow}>
          {TRACK_MODES.map((m) => (
            <TouchableOpacity
              key={m.key}
              onPress={() => (m.redirect ? go('pushup') : setMode(m.key))}
              style={[s.modeBtn, mode === m.key && s.modeBtnOn]}
            >
              <Ionicons name={m.icon} size={14} color={mode === m.key ? '#fff' : 'rgba(255,255,255,0.6)'} />
              <Text style={[s.modeText, mode === m.key && s.modeTextOn]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: '#fff', fontSize: 52, fontWeight: '900' }}>{km.toFixed(2)}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '700' }}>KM</Text>
        </View>
        <View style={{ alignItems: 'center', marginTop: 14 }}>
          <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800' }}>
            {mm}:{ss}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '700' }}>DURÉE</Text>
        </View>

        <View style={s.trackStatsGrid}>
          <View style={s.trackStatCell}>
            <Text style={s.trackStatLabel}>VITESSE LIVE</Text>
            <Text style={s.trackStatValue}>{running && gpsReady ? liveSpeed.toFixed(1) : '—'}</Text>
            <Text style={s.trackStatUnit}>KM/H</Text>
          </View>
          <View style={s.trackStatCell}>
            <Text style={s.trackStatLabel}>VITESSE MAX</Text>
            <Text style={s.trackStatValue}>{maxSpeed > 0 ? maxSpeed.toFixed(1) : '—'}</Text>
            <Text style={s.trackStatUnit}>KM/H</Text>
          </View>
          <View style={s.trackStatCell}>
            <Text style={s.trackStatLabel}>ALLURE</Text>
            <Text style={s.trackStatValue}>{avgPace > 0 ? `${paceMin}:${paceSec}` : '—'}</Text>
            <Text style={s.trackStatUnit}>MIN/KM</Text>
          </View>
          <View style={s.trackStatCell}>
            <Text style={s.trackStatLabel}>CALORIES</Text>
            <Text style={s.trackStatValue}>{calories}</Text>
            <Text style={s.trackStatUnit}>KCAL</Text>
          </View>
        </View>

        {/* Boutons de contrôle */}
        {!running && !paused && seconds === 0 ? (
          <TouchableOpacity onPress={start} style={{ marginHorizontal: 24, marginTop: 32 }}>
            <Grad colors={C.gradOrangePink} style={s.startBtn}>
              <Text style={s.startText}>▶ DÉMARRER</Text>
            </Grad>
          </TouchableOpacity>
        ) : running ? (
          <TouchableOpacity onPress={pause} style={{ marginHorizontal: 24, marginTop: 32 }}>
            <Grad colors={['#EF4444', '#F97316']} style={s.startBtn}>
              <Text style={s.startText}>⏸ PAUSE</Text>
            </Grad>
          </TouchableOpacity>
        ) : paused ? (
          <View style={{ flexDirection: 'row', gap: 12, marginHorizontal: 24, marginTop: 32 }}>
            <TouchableOpacity onPress={resume} style={{ flex: 1 }}>
              <Grad colors={C.gradOrangePink} style={s.startBtn}>
                <Text style={s.startText}>▶ REPRENDRE</Text>
              </Grad>
            </TouchableOpacity>
            <TouchableOpacity onPress={stop} style={{ flex: 1 }}>
              <Grad colors={['#EF4444', '#F97316']} style={s.startBtn}>
                <Text style={s.startText}>⏹ FIN</Text>
              </Grad>
            </TouchableOpacity>
          </View>
        ) : null}

        {!running && seconds > 0 ? (
          <>
            <TouchableOpacity onPress={() => setSendPanelOpen(true)} style={{ marginHorizontal: 24, marginTop: 12 }}>
              <View style={s.sendBtn}>
                <Ionicons name="send" size={14} color={C.primary} />
                <Text style={s.sendBtnText}>ENVOYER LE RECORD</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={reset} style={{ marginHorizontal: 24, marginTop: 12, marginBottom: 24 }}>
              <View style={s.resetBtn}>
                <Text style={s.resetText}>RÉINITIALISER</Text>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ height: 24 }} />
        )}
      </ScrollView>

      <SendRecordPanel
        visible={sendPanelOpen}
        onClose={() => setSendPanelOpen(false)}
        recordLabel={`${km.toFixed(2)} km en ${mm}:${ss}`}
      />
    </SafeAreaView>
  );
}const PUSHUP_MIN_THRESHOLD = 0.02;
const PUSHUP_MAX_THRESHOLD = 0.5;
const PUSHUP_THRESHOLD_STEP = 0.01;
const PUSHUP_MIN_REP_INTERVAL_MS = 500; // anti-rebond : évite de compter 2x le même choc
const PUSHUP_CALIBRATION_MS = 5000;

function PushupScreen({ goBack }) {
  const [count, setCount] = useState(0);
  const [tracking, setTracking] = useState(false);
  const [best, setBest] = useState(0);
  const [sendPanelOpen, setSendPanelOpen] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [position, setPosition] = useState('up'); // 'up' = haut, 'down' = bas
  const [debugY, setDebugY] = useState(0);

  const cameraRef = useRef(null);
  const lastRepTimeRef = useRef(0);
  const positionRef = useRef('up');
  const countRef = useRef(0);
  const trackingRef = useRef(false);

  // Sync refs with state
  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { trackingRef.current = tracking; }, [tracking]);
  useEffect(() => { countRef.current = count; }, [count]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('pushup_best_score');
        if (saved) setBest(parseInt(saved, 10) || 0);
      } catch (e) {}
    })();
  }, []);

  // Demande la permission caméra au montage
  useEffect(() => {
    if (!cameraPermission?.granted) {
      requestCameraPermission();
    }
  }, [cameraPermission]);

  // Détection des visages via la caméra avant
  // On utilise la position Y du visage pour détecter le cycle haut/bas des pompes
  const handleFacesDetected = ({ faces }) => {
    if (!trackingRef.current || faces.length === 0) {
      setFaceDetected(false);
      return;
    }

    setFaceDetected(true);
    const face = faces[0]; // On prend le premier visage détecté
    const y = face.bounds.origin.y; // Position verticale du visage dans le frame
    setDebugY(y);

    // Logique de détection du cycle pompe
    // Quand on descend en pompe, le visage monte dans le frame (y diminue)
    // Quand on remonte, le visage redescend (y augmente)
    const UP_THRESHOLD = 80;   // Visage "haut" dans l'image = corps en bas (pompe descendue)
    const DOWN_THRESHOLD = 200; // Visage "bas" dans l'image = corps en haut (pompe remontée)
    const MIN_REP_INTERVAL = 800; // ms entre deux reps

    const now = Date.now();

    if (positionRef.current === 'up' && y < UP_THRESHOLD) {
      // On vient de passer de haut (corps en haut) à bas (corps en bas) = descente
      positionRef.current = 'down';
      setPosition('down');
    } else if (positionRef.current === 'down' && y > DOWN_THRESHOLD) {
      // On vient de passer de bas (corps en bas) à haut (corps en haut) = remontée = 1 rep !
      if (now - lastRepTimeRef.current > MIN_REP_INTERVAL) {
        lastRepTimeRef.current = now;
        positionRef.current = 'up';
        setPosition('up');
        setCount((c) => c + 1);
      }
    }
  };

  const start = () => {
    setCount(0);
    countRef.current = 0;
    lastRepTimeRef.current = 0;
    positionRef.current = 'up';
    setPosition('up');
    setTracking(true);
  };

  const stop = async () => {
    setTracking(false);
    if (countRef.current > best) {
      setBest(countRef.current);
      try {
        await AsyncStorage.setItem('pushup_best_score', String(countRef.current));
      } catch (e) {}
    }
  };

  const share = async () => {
    try {
      await Share.share({ message: `💪 Je viens de faire ${count} pompes sur Sport Finder ! Record perso : ${best}.` });
    } catch (e) {}
  };

  // Si pas de permission caméra
  if (!cameraPermission?.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B14', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Ionicons name="camera-outline" size={64} color={C.primary} />
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 16, textAlign: 'center' }}>Caméra requise</Text>
        <Text style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
          Le compteur de pompes utilise la caméra avant pour détecter ton mouvement. Autorise l'accès pour continuer.
        </Text>
        <TouchableOpacity onPress={requestCameraPermission} style={{ marginTop: 24 }}>
          <Grad colors={C.gradOrangePink} style={[s.startBtn, { paddingHorizontal: 32 }]}>
            <Text style={s.startText}>📷 AUTORISER LA CAMÉRA</Text>
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
            Place le téléphone devant toi (30-50 cm), caméra avant activée. Le compteur détecte automatiquement le mouvement de ton visage pendant les pompes. Assure-toi d'être bien éclairé et face à la caméra.
          </Text>
        </View>

        {/* Aperçu caméra */}
        <View style={{ marginHorizontal: 16, marginTop: 16, borderRadius: 20, overflow: 'hidden', height: 280, backgroundColor: '#1a1a2e', borderWidth: 2, borderColor: tracking ? (faceDetected ? '#22C55E' : '#F59E0B') : C.border }}>
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing="front"
            onCameraReady={() => setCameraReady(true)}
            onFacesDetected={tracking ? handleFacesDetected : undefined}
            faceDetectorSettings={{
              mode: 'fast',
              detectLandmarks: false,
              runClassifications: false,
              minDetectionInterval: 100,
              tracking: true,
            }}
          />

          {/* Overlay d'état sur la caméra */}
          <View style={{ position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>
                {tracking ? (faceDetected ? '👤 Visage détecté' : '🔍 Recherche visage...') : '⏸ En pause'}
              </Text>
            </View>
            {tracking ? (
              <View style={{ backgroundColor: position === 'down' ? 'rgba(239,68,68,0.8)' : 'rgba(34,197,94,0.8)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>
                  {position === 'down' ? '⬇️ BAS' : '⬆️ HAUT'}
                </Text>
              </View>
            ) : null}
          </View>

          {!cameraReady ? (
            <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
              <ActivityIndicator color={C.primary} size="large" />
              <Text style={{ color: '#fff', marginTop: 10, fontWeight: '700' }}>Démarrage caméra...</Text>
            </View>
          ) : null}
        </View>

        {/* Debug info (optionnel, visible seulement en tracking) */}
        {tracking ? (
          <View style={{ marginHorizontal: 16, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Position Y: {debugY.toFixed(0)}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>État: {position.toUpperCase()}</Text>
          </View>
        ) : null}

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
          <TouchableOpacity onPress={start} style={{ marginHorizontal: 24, marginTop: 32 }}>
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

      <SendRecordPanel visible={sendPanelOpen} onClose={() => setSendPanelOpen(false)} recordLabel={`${count} pompes`} />
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
  const links = [
    { key: 'contacts', label: 'Contacts', icon: 'people-outline' },
    { key: 'venues', label: 'Terrains', icon: 'business-outline' },
    { key: 'chats', label: 'Chats', icon: 'chatbubbles-outline' },
    { key: 'teams', label: 'Équipes', icon: 'shield-outline' },
    { key: 'partners', label: 'Partenaires', icon: 'gift-outline' },
    { key: 'leaderboard', label: 'Classement', icon: 'trophy-outline' },
    { key: 'challenges', label: 'Défis', icon: 'flash-outline' },
  ];

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
          <Text style={{ color: '#fff', fontWeight: '700', marginTop: 10 }}>ton.email@exemple.com</Text>
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

        <View style={{ padding: 16 }}>
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

// ---------- NUTRITION IA ----------
function todayKey() {
  return `nutrition_log_${new Date().toISOString().slice(0, 10)}`;
}

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
});

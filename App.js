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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';


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
  { id: 'e1', sport: 'handball', emoji: '🤾', title: 'Match interne handball', host: 'Alice Runner', when: 'dans 2j', date: '15 juil., 20:00', loc: 'Gymnase Bercy', p: 3, max: 3 },
  { id: 'e2', sport: 'rugby', emoji: '🏈', title: 'Rencontre de rugby 2', host: 'King on Set', when: 'dans 7j', date: '20 juil., 10:00', loc: 'Parc des sports Perpignan', p: 1, max: 12 },
  { id: 'e3', sport: 'course', emoji: '🏃', title: 'Sortie matinale', host: 'Alice Runner', when: 'dans 3j', date: '21 juil., 08:00', loc: 'Paris', p: 1, max: 10 },
];

const VENUES = [
  { id: 'v1', emoji: '⚽', name: 'Five — Paris Centre', tags: ['FOOTBALL', 'BASKET'], addr: '15 rue de Rivoli, Paris', price: '80€' },
  { id: 'v2', emoji: '🎾', name: 'Padel Lab Bercy', tags: ['PADEL', 'TENNIS'], addr: '40 quai de Bercy, Paris', price: '40€' },
  { id: 'v3', emoji: '🤸', name: 'Iron Gym Box', tags: ['CROSSFIT', 'BOXE'], addr: '44 rue de la Pompe, Paris', price: '25€' },
];

const PARTNERS = [
  { id: 'p1', cat: 'CAFÉ', name: 'Café du Coureur', addr: '12 rue de Rivoli, Paris', offer: '-15% sur les boissons après un run' },
  { id: 'p2', cat: 'BOUTIQUE', name: 'Marathon Shop Paris', addr: '5 Rue de Rivoli, Paris', offer: '-10% sur les chaussures running' },
  { id: 'p3', cat: 'GYM', name: 'Iron Gym', addr: '44 rue de la Pompe, Paris', offer: '1 séance gratuite avec SportMatch' },
];

const PROFILES = [
  { id: 'pr1', name: 'Alice', age: 27, city: 'Paris', sport: 'Course à pied', emoji: '🏃' },
  { id: 'pr2', name: 'Marc', age: 31, city: 'Paris', sport: 'Basket', emoji: '🏀' },
  { id: 'pr3', name: 'Sofia', age: 24, city: 'Boulogne', sport: 'Yoga', emoji: '🧘' },
];

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

// Appelle l'API Vision de Claude (Anthropic) pour analyser une photo de plat.
// Nécessite une clé API personnelle stockée localement (jamais partagée ailleurs).
async function analyzeFoodPhoto(base64Image, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
            {
              type: 'text',
              text:
                "Identifie le plat sur cette photo et estime sa valeur nutritionnelle pour la portion visible. Réponds UNIQUEMENT avec un objet JSON strict, sans texte autour, au format exact : " +
                '{"dish":"nom du plat en français","portion_g":nombre,"kcal":nombre,"protein_g":nombre,"carbs_g":nombre,"fat_g":nombre}',
            },
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
  const text = (data.content || []).map((b) => b.text || '').join('');
  const clean = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);
  return parsed;
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

// ---------- SCREENS ----------
function HomeScreen({ go, goBack }) {
  const [filter, setFilter] = useState(null);
  const next = EVENTS[0];
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={s.brandRow}>
        <Text style={s.brand}>
          SPORT <Text style={{ color: C.primary }}>• FINDER</Text>
        </Text>
        <Ionicons name="notifications-outline" size={22} color={C.primary} />
      </View>

      <TouchableOpacity onPress={() => go('match')}>
        <Banner icon="🤝" eyebrow="RENCONTRES SPORTIVES" title="Trouver une rencontre" subtitle="Profils actifs autour de toi · jusqu'à 800 km" />
      </TouchableOpacity>

      <View style={s.sectionRow}>
        <Text style={s.sectionTitle}>📅 TROUVER UN ÉVÉNEMENT</Text>
        <TouchableOpacity onPress={() => go('events')}>
          <Text style={s.link}>VOIR TOUT ›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
        <TouchableOpacity style={s.createCard} onPress={() => go('newEvent')}>
          <View style={s.plusCircle}>
            <Ionicons name="add" size={26} color={C.primary} />
          </View>
          <Text style={s.createTitle}>ORGANISER</Text>
          <Text style={s.createSub}>Lance ta propre rencontre</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => go('events')}>
          <Grad colors={C.gradBlue} style={s.eventCard}>
            <Text style={{ fontSize: 22 }}>{next.emoji}</Text>
            <Text style={s.eventCardTitle}>{next.title}</Text>
            <Text style={s.eventCardLoc}>📍 {next.loc}</Text>
            <View style={s.eventCardFooter}>
              <Text style={s.eventCardBadge}>
                {next.p}/{next.max}
              </Text>
              <Text style={s.eventCardVoir}>VOIR ›</Text>
            </View>
          </Grad>
        </TouchableOpacity>
      </ScrollView>

      <View style={s.actionsRow}>
        <TouchableOpacity style={s.primaryBtn} onPress={() => go('match')}>
          <Text style={s.primaryBtnText}>TROUVER UNE RENCONTRE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={() => go('track')}>
          <Text style={s.secondaryBtnText}>MES ACTIVITÉS</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, marginTop: 8 }}>
        {SPORTS_TEAM.slice(0, 5).map((sp) => (
          <Chip key={sp.key} label={sp.label} emoji={sp.emoji} selected={filter === sp.key} onPress={() => setFilter(filter === sp.key ? null : sp.key)} />
        ))}
      </ScrollView>

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
  const filtered = filter === 'tous' ? EVENTS : EVENTS.filter((e) => e.sport === filter);

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
                {full ? (
                  <View style={s.fullBadge}>
                    <Text style={s.fullBadgeText}>COMPLET</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={s.joinBtn}>
                    <Text style={s.joinBtnText}>+ REJOINDRE</Text>
                  </TouchableOpacity>
                )}
              </View>
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

  const isSolo = sport ? SPORTS_SOLO.some((s2) => s2.key === sport) : true;

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
        <TextInput style={s.input} placeholder="Parc Monceau, Paris" value={place} onChangeText={setPlace} placeholderTextColor={C.light} />
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

function SwipeCard({ profile, isTop, onSwipe }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const rotate = pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ['-15deg', '0deg', '15deg'] });
  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => isTop,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > 120 || g.dx < -120) {
          Animated.timing(pan, { toValue: { x: g.dx > 0 ? 500 : -500, y: g.dy }, duration: 200, useNativeDriver: false }).start(onSwipe);
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View {...(isTop ? responder.panHandlers : {})} style={[s.swipeCard, isTop && { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] }]}>
      <Grad colors={C.gradPurple} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 90 }}>{profile.emoji}</Text>
      </Grad>
      <View style={s.swipeInfo}>
        <Text style={s.swipeName}>
          {profile.name}, {profile.age}
        </Text>
        <Text style={s.swipeMeta}>📍 {profile.city}</Text>
        <Text style={s.swipeChip}>
          {profile.emoji} {profile.sport.toUpperCase()}
        </Text>
      </View>
    </Animated.View>
  );
}

function MatchScreen({ go, goBack }) {
  const [profiles, setProfiles] = useState(PROFILES);
  const swipe = () => setProfiles((p) => p.slice(1));
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title="Rencontres" onBack={goBack} />
      <Text style={{ paddingHorizontal: 16, color: C.gray, marginBottom: 12 }}>Glissez à droite pour aimer, à gauche pour passer</Text>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {profiles.length === 0 ? (
          <EmptyState icon="heart-dislike-outline" title="Plus de profils" subtitle="Revenez plus tard !" cta="RAFRAÎCHIR" onCta={() => setProfiles(PROFILES)} />
        ) : (
          profiles
            .slice(0, 2)
            .reverse()
            .map((p, idx, arr) => <SwipeCard key={p.id} profile={p} isTop={idx === arr.length - 1} onSwipe={swipe} />)
        )}
      </View>
      {profiles.length > 0 ? (
        <View style={s.swipeActions}>
          <TouchableOpacity style={[s.roundBtn, { backgroundColor: '#FEE2E2' }]} onPress={swipe}>
            <Ionicons name="close" size={28} color={C.danger} />
          </TouchableOpacity>
          <TouchableOpacity style={[s.roundBtn, { backgroundColor: C.chip }]} onPress={swipe}>
            <Ionicons name="heart" size={26} color={C.primary} />
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
  const [seconds, setSeconds] = useState(0);
  const [km, setKm] = useState(0);
  const [liveSpeed, setLiveSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [gpsReady, setGpsReady] = useState(false);
  const [coords, setCoords] = useState(null);
  const [recordKm, setRecordKm] = useState(0.02);
  const [recordSpeed, setRecordSpeed] = useState(0);
  const [recordKcal, setRecordKcal] = useState(1);
  const timerRef = useRef(null);
  const watchRef = useRef(null);
  const lastCoordRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setCoords(loc.coords);
        }
      } catch (e) {}
    })();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchRef.current) watchRef.current.remove();
    };
  }, []);

  const start = async () => {
    setErrorMsg(null);
    setGpsReady(false);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission GPS refusée. Autorise la localisation pour suivre ta course.');
      return;
    }
    lastCoordRef.current = null;
    timerRef.current = setInterval(() => setSeconds((x) => x + 1), 1000);
    try {
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 1 },
        (loc) => {
          setGpsReady(true);
          const { latitude, longitude, speed } = loc.coords;
          setCoords(loc.coords);
          if (lastCoordRef.current) {
            const d = haversineKm(lastCoordRef.current.latitude, lastCoordRef.current.longitude, latitude, longitude);
            if (d < 0.2) setKm((prev) => prev + d); // ignore les sauts GPS aberrants
          }
          lastCoordRef.current = { latitude, longitude };
          const kmh = speed && speed > 0 ? speed * 3.6 : 0;
          setLiveSpeed(kmh);
          setMaxSpeed((prev) => Math.max(prev, kmh));
        }
      );
    } catch (e) {
      setErrorMsg('Impossible de démarrer le suivi GPS sur cet appareil.');
      clearInterval(timerRef.current);
      return;
    }
    setRunning(true);
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setRunning(false);
  };

  const toggle = () => (running ? stop() : start());

  const reset = () => {
    stop();
    setSeconds(0);
    setKm(0);
    setLiveSpeed(0);
    setMaxSpeed(0);
    setErrorMsg(null);
  };

  const mm = Math.floor(seconds / 60);
  const ss = (seconds % 60).toString().padStart(2, '0');
  const avgSpeed = seconds > 0 ? (km / (seconds / 3600)).toFixed(1) : '0.0';
  const calorieFactor = mode === 'course' ? 60 : mode === 'marche' ? 40 : 50;
  const calories = Math.round(km * calorieFactor);

  useEffect(() => {
    if (km > recordKm) setRecordKm(km);
    if (maxSpeed > recordSpeed) setRecordSpeed(maxSpeed);
    if (calories > recordKcal) setRecordKcal(calories);
    // eslint-disable-next-line
  }, [km, maxSpeed, calories]);

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
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' }} />
          </View>
        </View>

        <View style={s.trackInfo}>
          <Ionicons name="information-circle" size={18} color={C.primary} />
          <Text style={s.trackInfoText}>
            Sur le navigateur, le GPS dépend de votre permission. Testez sur un appareil mobile pour le suivi en arrière-plan.
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
            <Text style={s.trackInfoText}>Recherche du signal GPS…</Text>
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
            <Text style={s.trackStatLabel}>VITESSE MOY</Text>
            <Text style={s.trackStatValue}>~{avgSpeed}</Text>
            <Text style={s.trackStatUnit}>KM/H (EST.)</Text>
          </View>
          <View style={s.trackStatCell}>
            <Text style={s.trackStatLabel}>CALORIES</Text>
            <Text style={s.trackStatValue}>{calories}</Text>
            <Text style={s.trackStatUnit}>KCAL</Text>
          </View>
        </View>

        <TouchableOpacity onPress={toggle} style={{ marginHorizontal: 24, marginTop: 32 }}>
          <Grad colors={running ? ['#EF4444', '#F97316'] : C.gradOrangePink} style={s.startBtn}>
            <Text style={s.startText}>{running ? '⏸ PAUSE' : '▶ DÉMARRER'}</Text>
          </Grad>
        </TouchableOpacity>

        {seconds > 0 && !running ? (
          <TouchableOpacity onPress={reset} style={{ marginHorizontal: 24, marginTop: 12, marginBottom: 24 }}>
            <View style={s.resetBtn}>
              <Text style={s.resetText}>RÉINITIALISER</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={{ height: 24 }} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Seuils de détection du cycle descente/remontée (à ajuster selon le placement du téléphone).
// Le téléphone doit être posé au sol, écran visible, sous le buste pendant la série.
const PUSHUP_DOWN_THRESHOLD = -0.55;
const PUSHUP_UP_THRESHOLD = 0.55;
const PUSHUP_MIN_REP_INTERVAL_MS = 500; // anti-rebond : évite de compter 2x un même mouvement

function PushupScreen({ goBack }) {
  const [count, setCount] = useState(0);
  const [tracking, setTracking] = useState(false);
  const [best, setBest] = useState(0);
  const [sensorOk, setSensorOk] = useState(true);
  const cycleStateRef = useRef('up'); // machine à état : 'up' | 'down'
  const lastRepTimeRef = useRef(0);
  const subRef = useRef(null);

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

  const start = async () => {
    const available = await Accelerometer.isAvailableAsync();
    if (!available) {
      setSensorOk(false);
      return;
    }
    setSensorOk(true);
    setCount(0);
    cycleStateRef.current = 'up';
    lastRepTimeRef.current = 0;
    Accelerometer.setUpdateInterval(100);
    subRef.current = Accelerometer.addListener(({ y }) => {
      const now = Date.now();
      if (cycleStateRef.current === 'up' && y < PUSHUP_DOWN_THRESHOLD) {
        cycleStateRef.current = 'down';
      } else if (cycleStateRef.current === 'down' && y > PUSHUP_UP_THRESHOLD) {
        cycleStateRef.current = 'up';
        if (now - lastRepTimeRef.current > PUSHUP_MIN_REP_INTERVAL_MS) {
          lastRepTimeRef.current = now;
          setCount((c) => c + 1);
        }
      }
    });
    setTracking(true);
  };

  const stop = async () => {
    if (subRef.current) {
      subRef.current.remove();
      subRef.current = null;
    }
    setTracking(false);
    if (count > best) {
      setBest(count);
      try {
        await AsyncStorage.setItem('pushup_best_score', String(count));
      } catch (e) {}
    }
  };

  const share = async () => {
    try {
      await Share.share({ message: `💪 Je viens de faire ${count} pompes sur Sport Finder ! Record perso : ${best}.` });
    } catch (e) {}
  };

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
            Pose le téléphone au sol, écran visible, sous ton buste. L’accéléromètre détecte chaque cycle descente + remontée. Seuil anti-faux-positifs : 0,5s minimum entre deux répétitions.
          </Text>
        </View>

        {!sensorOk ? (
          <View style={s.trackError}>
            <Ionicons name="warning-outline" size={18} color="#FCA5A5" />
            <Text style={s.trackErrorText}>Accéléromètre indisponible sur cet appareil/navigateur. Teste sur un téléphone physique via Expo Go.</Text>
          </View>
        ) : null}

        <View style={{ alignItems: 'center', marginTop: 32 }}>
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
          <TouchableOpacity onPress={share} style={{ marginHorizontal: 24, marginTop: 12, marginBottom: 24 }}>
            <View style={s.resetBtn}>
              <Text style={s.resetText}>📤 PARTAGER MON SCORE</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={{ height: 24 }} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactsScreen({ go, goBack }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header title="Contacts" onBack={goBack} />
      <EmptyState icon="people-outline" title="Aucun contact" subtitle="Acceptez une proposition de run ou ajoutez un runner depuis son profil." cta="DÉCOUVRIR DES RUNNERS" onCta={() => go('match')} />
    </SafeAreaView>
  );
}

function ChatsScreen({ go, goBack }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={s.brandRow}>
        <Text style={s.brand}>
          SPORT <Text style={{ color: C.primary }}>• FINDER</Text>
        </Text>
      </View>
      <Text style={{ fontSize: 32, fontWeight: '900', paddingHorizontal: 16, marginBottom: 16 }}>CHATS</Text>
      <View style={{ paddingHorizontal: 16 }}>
        <TouchableOpacity style={s.chatCard}>
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

function ProfileScreen({ go, goBack }) {
  const links = [
    { key: 'contacts', label: 'Contacts', icon: 'people-outline' },
    { key: 'venues', label: 'Terrains', icon: 'business-outline' },
    { key: 'chats', label: 'Chats', icon: 'chatbubbles-outline' },
    { key: 'teams', label: 'Équipes', icon: 'shield-outline' },
    { key: 'partners', label: 'Partenaires', icon: 'gift-outline' },
    { key: 'leaderboard', label: 'Classement', icon: 'trophy-outline' },
    { key: 'challenges', label: 'Défis', icon: 'flash-outline' },
  ];
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView>
        <Grad colors={C.gradPurple} style={s.profileHero}>
          <View style={s.profileAvatar}>
            <Ionicons name="person" size={36} color="#fff" />
          </View>
          <Text style={{ color: '#fff', fontWeight: '700' }}>ton.email@exemple.com</Text>
        </Grad>
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
  const [step, setStep] = useState('idle'); // idle | analyzing | result | manual | error
  const [photoUri, setPhotoUri] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [manual, setManual] = useState({ dish: '', portion_g: '200', kcal: '', protein_g: '', carbs_g: '', fat_g: '' });

  useEffect(() => {
    (async () => {
      try {
        const g = await AsyncStorage.getItem('nutrition_goal');
        if (g) setGoal(JSON.parse(g));
        const k = await AsyncStorage.getItem('anthropic_api_key');
        if (k) setApiKey(k);
        const l = await AsyncStorage.getItem(todayKey());
        if (l) setLog(JSON.parse(l));
      } catch (e) {}
    })();
  }, []);

  const reloadGoal = async () => {
    try {
      const g = await AsyncStorage.getItem('nutrition_goal');
      if (g) setGoal(JSON.parse(g));
    } catch (e) {}
  };

  const saveApiKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) return;
    setApiKey(trimmed);
    setApiKeyInput('');
    setShowKeyField(false);
    try {
      await AsyncStorage.setItem('anthropic_api_key', trimmed);
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
      setErrorMsg("Aucune clé API Anthropic enregistrée. Ajoute-la ci-dessus, ou saisis les valeurs manuellement.");
      setStep('error');
      return;
    }
    setStep('analyzing');
    try {
      const parsed = await analyzeFoodPhoto(base64, apiKey);
      setResult(parsed);
      setStep('result');
    } catch (e) {
      setErrorMsg(e.message || "L'analyse a échoué.");
      setStep('error');
    }
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
    setManual({ dish: '', portion_g: '200', kcal: '', protein_g: '', carbs_g: '', fat_g: '' });
  };

  const removeFromLog = async (id) => {
    const newLog = log.filter((m) => m.id !== id);
    setLog(newLog);
    try {
      await AsyncStorage.setItem(todayKey(), JSON.stringify(newLog));
    } catch (e) {}
  };

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
            <Text style={s.apiKeyTitle}>🔑 Clé API Anthropic requise pour l’analyse IA</Text>
            {showKeyField ? (
              <>
                <TextInput
                  style={s.input}
                  placeholder="sk-ant-..."
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
                <Text style={{ color: C.primary, fontWeight: '800', fontSize: 12 }}>+ Ajouter ma clé (console.anthropic.com)</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {step === 'idle' ? (
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
            <TouchableOpacity onPress={() => { setStep('idle'); setResult(null); setPhotoUri(null); }} style={{ alignItems: 'center', marginTop: 10 }}>
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
              onPress={() =>
                addToLog({
                  dish: manual.dish || 'Plat manuel',
                  portion_g: parseInt(manual.portion_g, 10) || 0,
                  kcal: parseInt(manual.kcal, 10) || 0,
                  protein_g: parseInt(manual.protein_g, 10) || 0,
                  carbs_g: parseInt(manual.carbs_g, 10) || 0,
                  fat_g: parseInt(manual.fat_g, 10) || 0,
                })
              }
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
function TabBar({ active, onTabPress }) {
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
};

export default function App() {
  // La navigation est une vraie pile : "go" empile un écran, "goBack" le dépile.
  // Ça permet un vrai bouton Retour (flèche en haut ET bouton physique Android).
  const [stack, setStack] = useState(['home']);
  const screen = stack[stack.length - 1];

  const go = (key) => setStack((prev) => [...prev, key]);
  const goBack = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const onTabPress = (key) => setStack([key]); // taper un onglet réinitialise la pile sur cet onglet

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

  const isTab = Object.keys(TAB_SCREENS).includes(screen);
  const Screen = TAB_SCREENS[screen] || STACK_SCREENS[screen] || HomeScreen;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1 }}>
        <Screen go={go} goBack={goBack} />
      </View>
      {isTab ? <TabBar active={screen} onTabPress={onTabPress} /> : null}
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
});

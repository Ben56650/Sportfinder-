import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

// ---------- THEME (repris de App.js pour rester cohérent visuellement) ----------
const C = {
  primary: '#5B4FE9',
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

// Traduit les codes d'erreur Firebase (en anglais) en messages compréhensibles en français.
function translateAuthError(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Un compte existe déjà avec cet e-mail.';
    case 'auth/invalid-email':
      return 'Adresse e-mail invalide.';
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou mot de passe incorrect.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Réessaie dans quelques minutes.';
    case 'auth/network-request-failed':
      return 'Problème de connexion internet. Vérifie ta connexion.';
    default:
      return 'Une erreur est survenue. Réessaie.';
  }
}

/**
 * Écran d'authentification (connexion + inscription).
 * onAuthSuccess(user) est appelé une fois l'utilisateur connecté, avec son profil complet
 * (uid + les champs stockés dans Firestore sous users/{uid}).
 *
 * Authentification réelle via Firebase Auth (email/mot de passe) + profil stocké dans
 * Firestore. Remplace l'ancienne authentification "mock" locale (AsyncStorage uniquement).
 */
export default function AuthScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [gender, setGender] = useState(null); // 'male' | 'female'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.trim() || !password.trim()) {
      setError('Merci de remplir tous les champs.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Adresse e-mail invalide.');
      return false;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return false;
    }
    if (mode === 'signup' && !pseudo.trim()) {
      setError('Merci de choisir un pseudo.');
      return false;
    }
    if (mode === 'signup' && !gender) {
      setError('Merci de sélectionner ton genre.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === 'signup') {
        const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
        const uid = credential.user.uid;
        const profile = {
          email: email.trim().toLowerCase(),
          pseudo: pseudo.trim(),
          gender,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', uid), profile);
        onAuthSuccess && onAuthSuccess({ uid, ...profile });
      } else {
        const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
        const uid = credential.user.uid;
        const snap = await getDoc(doc(db, 'users', uid));
        const profile = snap.exists() ? snap.data() : { email: email.trim().toLowerCase() };
        onAuthSuccess && onAuthSuccess({ uid, ...profile });
      }
    } catch (e) {
      setError(translateAuthError(e.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.logoBox}>
            <View style={styles.logoCircle}>
              <Ionicons name="flash" size={30} color={C.white} />
            </View>
            <Text style={styles.appName}>NutriSport</Text>
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, mode === 'login' && styles.tabBtnOn]}
              onPress={() => {
                setMode('login');
                setError('');
              }}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextOn]}>
                Connexion
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, mode === 'signup' && styles.tabBtnOn]}
              onPress={() => {
                setMode('signup');
                setError('');
              }}
            >
              <Text style={[styles.tabText, mode === 'signup' && styles.tabTextOn]}>
                Inscription
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'signup' && (
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color={C.gray} />
              <TextInput
                style={styles.input}
                placeholder="Pseudo"
                placeholderTextColor={C.light}
                value={pseudo}
                onChangeText={setPseudo}
                autoCapitalize="none"
              />
            </View>
          )}

          {mode === 'signup' && (
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'male' && styles.genderBtnOn]}
                onPress={() => setGender('male')}
              >
                <Ionicons
                  name="male"
                  size={18}
                  color={gender === 'male' ? C.white : C.gray}
                />
                <Text style={[styles.genderText, gender === 'male' && styles.genderTextOn]}>
                  Homme
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'female' && styles.genderBtnOn]}
                onPress={() => setGender('female')}
              >
                <Ionicons
                  name="female"
                  size={18}
                  color={gender === 'female' ? C.white : C.gray}
                />
                <Text style={[styles.genderText, gender === 'female' && styles.genderTextOn]}>
                  Femme
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color={C.gray} />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor={C.light}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color={C.gray} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor={C.light}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={C.gray}
              />
            </TouchableOpacity>
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === 'login' ? 'Se connecter' : "S'inscrire"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  logoBox: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: { fontSize: 20, fontWeight: '800', color: C.dark },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
  },
  tabBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  tabBtnOn: { backgroundColor: C.primary },
  tabText: { fontWeight: '700', fontSize: 13, color: C.gray },
  tabTextOn: { color: C.white },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  input: { flex: 1, fontSize: 14, color: C.dark },
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingVertical: 12,
  },
  genderBtnOn: { backgroundColor: C.primary, borderColor: C.primary },
  genderText: { fontWeight: '700', fontSize: 13, color: C.gray },
  genderTextOn: { color: C.white },
  errorText: { color: C.danger, fontSize: 12, marginBottom: 8, lineHeight: 17 },
  submitBtn: {
    backgroundColor: C.primary,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: { color: C.white, fontWeight: '800', fontSize: 14 },
});

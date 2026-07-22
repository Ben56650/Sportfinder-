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
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const USERS_KEY = 'app_users';
const SESSION_KEY = 'currentUser';

// Compte de test pré-créé au premier lancement, pour pouvoir se connecter
// immédiatement sans passer par l'inscription.
const TEST_ACCOUNT = {
  email: 'test@test.com',
  password: 'test1234',
  pseudo: 'TestUser',
};

async function ensureTestAccount() {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  const users = raw ? JSON.parse(raw) : [];
  const exists = users.some((u) => u.email === TEST_ACCOUNT.email);
  if (!exists) {
    users.push(TEST_ACCOUNT);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
}

/**
 * Écran d'authentification (connexion + inscription).
 * onAuthSuccess(user) est appelé une fois l'utilisateur connecté.
 *
 * NB: ceci est une authentification "mock" stockée localement via
 * AsyncStorage — pas de vrai backend. À remplacer par de vrais appels
 * API (Firebase Auth, Supabase, etc.) avant mise en production.
 */
export default function AuthScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    ensureTestAccount();
  }, []);

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
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(USERS_KEY);
      const users = raw ? JSON.parse(raw) : [];

      if (mode === 'signup') {
        const already = users.some((u) => u.email === email.trim().toLowerCase());
        if (already) {
          setError('Un compte existe déjà avec cet e-mail.');
          setLoading(false);
          return;
        }
        const newUser = {
          email: email.trim().toLowerCase(),
          password,
          pseudo: pseudo.trim(),
        };
        users.push(newUser);
        await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
        onAuthSuccess && onAuthSuccess(newUser);
      } else {
        const found = users.find(
          (u) => u.email === email.trim().toLowerCase() && u.password === password
        );
        if (!found) {
          setError('E-mail ou mot de passe incorrect.');
          setLoading(false);
          return;
        }
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(found));
        onAuthSuccess && onAuthSuccess(found);
      }
    } catch (e) {
      setError("Une erreur est survenue. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  const fillTestAccount = () => {
    setMode('login');
    setEmail(TEST_ACCOUNT.email);
    setPassword(TEST_ACCOUNT.password);
    setError('');
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
            <Text style={styles.appName}>MonApp Sport</Text>
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

          <TouchableOpacity style={styles.testBtn} onPress={fillTestAccount}>
            <Ionicons name="flask-outline" size={16} color={C.primary} />
            <Text style={styles.testBtnText}>Utiliser le compte de test</Text>
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
  errorText: { color: C.danger, fontSize: 12, marginBottom: 8, lineHeight: 17 },
  submitBtn: {
    backgroundColor: C.primary,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: { color: C.white, fontWeight: '800', fontSize: 14 },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
  },
  testBtnText: { color: C.primary, fontWeight: '700', fontSize: 12 },
});

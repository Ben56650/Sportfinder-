// Configuration Firebase — remplace les valeurs ci-dessous par celles de TA console Firebase
// (Console Firebase → Paramètres du projet → tes applications → configuration SDK).
//
// ⚠️ Ce fichier contient des clés publiques (normal pour Firebase côté client — la vraie
// sécurité se fait via les règles Firestore, pas en cachant ces valeurs). Il ne faut en
// revanche jamais committer de clé "Admin SDK" (privée, côté serveur) dans le code client.

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCAV-NKw55MqKIyheLe3SjJuxh2E_haR5g',
  authDomain: 'nutrisport-c5378.firebaseapp.com',
  projectId: 'nutrisport-c5378',
  storageBucket: 'nutrisport-c5378.firebasestorage.app',
  messagingSenderId: '896762714467',
  appId: '1:896762714467:web:b84d3f6566dccef6cc9b56',
};

const app = initializeApp(firebaseConfig);

// getReactNativePersistence garde l'utilisateur connecté entre deux ouvertures de l'app
// (équivalent Firebase de ce que faisait AsyncStorage('currentUser') avant).
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);

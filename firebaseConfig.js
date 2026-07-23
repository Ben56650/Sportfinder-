// Configuration Firebase (SDK "compat") — remplace les valeurs ci-dessous par celles de
// TA console Firebase (Console Firebase → Paramètres du projet → tes applications).
//
// ⚠️ Version "compat" utilisée ici au lieu du SDK modulaire (v9+) car ce dernier bloque
// sur le bundler d'Expo Snack. Le SDK compat est plus ancien dans sa syntaxe mais tout
// aussi fonctionnel, et bundle beaucoup plus fiablement dans Snack.

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCAV-NKw55MqKIyheLe3SjJuxh2E_haR5g',
  authDomain: 'nutrisport-c5378.firebaseapp.com',
  projectId: 'nutrisport-c5378',
  storageBucket: 'nutrisport-c5378.firebasestorage.app',
  messagingSenderId: '896762714467',
  appId: '1:896762714467:web:b84d3f6566dccef6cc9b56',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Note : la persistance de session automatique entre deux ouvertures de l'app (via
// AsyncStorage) fonctionne un peu différemment en mode compat — Firebase gère lui-même
// un stockage interne par défaut sur React Native, pas besoin de configuration séparée
// comme avec initializeAuth() côté SDK modulaire.
export const auth = firebase.auth();
export const db = firebase.firestore();

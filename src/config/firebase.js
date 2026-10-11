import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const getEnv = (metaVal, procVal) => metaVal || procVal || '';

const firebaseConfig = {
  apiKey: getEnv(import.meta.env?.VITE_FIREBASE_API_KEY, typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_API_KEY : ''),
  authDomain: getEnv(import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN, typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_AUTH_DOMAIN : ''),
  databaseURL: getEnv(import.meta.env?.VITE_FIREBASE_DATABASE_URL, typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_DATABASE_URL : ''),
  projectId: getEnv(import.meta.env?.VITE_FIREBASE_PROJECT_ID, typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_PROJECT_ID : ''),
  storageBucket: getEnv(import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET, typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_STORAGE_BUCKET : ''),
  messagingSenderId: getEnv(import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID, typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_MESSAGING_SENDER_ID : ''),
  appId: getEnv(import.meta.env?.VITE_FIREBASE_APP_ID, typeof process !== 'undefined' ? process.env?.VITE_FIREBASE_APP_ID : ''),
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.databaseURL &&
  firebaseConfig.projectId
);

let app = null;
let database = null;

if (typeof window !== 'undefined' && isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    database = getDatabase(app);
  } catch (error) {
    console.warn('HOP: Erro ao inicializar o Firebase Realtime Database:', error);
    database = null;
  }
} else if (typeof window !== 'undefined') {
  console.info('HOP: Firebase não configurado. Operando em modo local resiliente.');
}

export { app, database };

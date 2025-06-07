// Importar e inicializar Firebase via CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Sua configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyApLpbTUhEynY9hFj4vUBC5bj4W3Lffl54",
  authDomain: "localhost",
  projectId: "veiculos-app-ceb54",
  storageBucket: "veiculos-app-ceb54.firebasestorage.app",
  messagingSenderId: "321119436393",
  appId: "1:321119436393:web:b7d28af5cc11c6d940ecf8",
  measurementId: "G-Y1RH2SY4EK"
};

// Inicializar Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

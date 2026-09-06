import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Конфигурация Firebase берётся из переменных окружения (см. .env.example).
// Так ключи не попадают в репозиторий, а на Vercel их можно задать в
// Project Settings -> Environment Variables.
//
// Если переменные не заданы — сайт автоматически работает в локальном
// режиме (localStorage) на этом устройстве, чтобы всё можно было
// протестировать без Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyB73yzRaStp9QOgqT-qh5B8F2BkIdpta0s",
  authDomain: "choco-flora-4a92e.firebaseapp.com",
  projectId: "choco-flora-4a92e",
  storageBucket: "choco-flora-4a92e.firebasestorage.app",
  messagingSenderId: "321335065697",
  appId: "1:321335065697:web:afedc326a64530e8d23e20"
};

export const isFirebaseConfigured = firebaseConfig.apiKey !== 'YOUR_API_KEY'

let app = null
let db = null
let auth = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  // Аутентификация админа теперь идёт через Firebase Authentication
  // (см. AdminLoginModal.jsx): войти сможет только тот, кто явно добавлен
  // как пользователь в Firebase Console -> Authentication -> Users.
  auth = getAuth(app)
}

export { app, db, auth }

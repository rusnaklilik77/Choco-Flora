import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Конфигурация Firebase берётся из переменных окружения (см. .env.example).
// Так ключи не попадают в репозиторий, а на Vercel их можно задать в
// Project Settings -> Environment Variables.
//
// Если переменные не заданы — сайт автоматически работает в локальном
// режиме (localStorage) на этом устройстве, чтобы всё можно было
// протестировать без Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyCS7RT9hselEZdOB15fwjLfa7Y7MpEnu84",
  authDomain: "choco-flora.firebaseapp.com",
  projectId: "choco-flora",
  storageBucket: "choco-flora.firebasestorage.app",
  messagingSenderId: "181249556285",
  appId: "1:181249556285:web:d71313c8c1fb4e18d44f54"
};

export const isFirebaseConfigured = firebaseConfig.apiKey !== 'YOUR_API_KEY'

let app = null
let db = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
}

export { app, db }

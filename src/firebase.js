import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Don't initialize Firebase if credentials are missing (e.g. local dev without .env)
const hasCredentials = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

let app = null, db = null, auth = null
if (hasCredentials) {
  try {
    app = initializeApp(firebaseConfig)
    db = getFirestore(app)
    auth = getAuth(app)
  } catch (e) {
    console.warn('Firebase initialization failed:', e.message)
  }
}
export { db, auth }

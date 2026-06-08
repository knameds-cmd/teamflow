import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// .env에 Firebase 값이 채워져 있으면 true → Firestore(클라우드 실시간 공유) 사용.
// 비어 있으면 false → 로컬 저장(localStorage) 모드로 동작.
export const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

// 실제로 필요할 때만 초기화한다(설정이 없으면 절대 호출되지 않음).
export function getDb(): Firestore {
  if (!hasFirebaseConfig) {
    throw new Error('Firebase 설정이 없습니다. .env를 확인하세요.');
  }
  if (!db) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return db;
}

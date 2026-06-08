import { hasFirebaseConfig } from '../firebase';
import { firebaseBackend } from './firebase';
import { localBackend } from './local';
import { ProjectBackend } from './types';

// .env에 Firebase 값이 있으면 클라우드(Firestore), 없으면 로컬(localStorage).
export const backend: ProjectBackend = hasFirebaseConfig ? firebaseBackend : localBackend;
export const storageMode = backend.mode;

export type { ProjectBackend } from './types';

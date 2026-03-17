import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb } from './firebase';
import type { User } from '../types/user';

export interface AuthState {
  firebaseUser: FirebaseUser | null;
  userProfile: User | null;
}

export async function loginWithEmailPassword(email: string, password: string): Promise<AuthState> {
  const auth = getFirebaseAuth();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = credential.user;

  const userProfile = await loadUserProfile(firebaseUser.uid);

  return { firebaseUser, userProfile };
}

export async function registerWithEmailPassword(email: string, password: string): Promise<AuthState> {
  const auth = getFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = credential.user;
  const userProfile = await loadUserProfile(firebaseUser.uid);
  return { firebaseUser, userProfile };
}

export async function logout(): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

export function subscribeToAuthState(
  onChange: (state: AuthState) => void,
): () => void {
  const auth = getFirebaseAuth();
  const db = getFirestoreDb();

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      onChange({ firebaseUser: null, userProfile: null });
      return;
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const snapshot = await getDoc(userDocRef);
    const data = snapshot.data();
    // #region agent log
    fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d83a2'},body:JSON.stringify({sessionId:'7d83a2',location:'auth.ts:subscribeToAuthState',message:'Firestore raw data',data:{uid:firebaseUser.uid,exists:snapshot.exists(),rawData:data?JSON.stringify(data):null,role:data?.role,roleType:typeof data?.role},hypothesisId:'A',timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    const userProfile: User | null = data
      ? {
          id: snapshot.id,
          email: data.email ?? '',
          login: data.login ?? '',
          role: (data.role ?? 'picker') as User['role'],
          store_id: data.store_id,
          created_at: data.created_at?.toDate?.() ?? data.created_at,
        }
      : null;

    onChange({ firebaseUser, userProfile });
  });
}

export async function loadUserProfile(uid: string): Promise<User | null> {
  const db = getFirestoreDb();
  const userDocRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userDocRef);
  const data = snapshot.exists() ? snapshot.data() : null;
  // #region agent log
  fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d83a2'},body:JSON.stringify({sessionId:'7d83a2',location:'auth.ts:loadUserProfile',message:'Load result',data:{uid,exists:snapshot.exists(),rawRole:data?.role,rawData:data?JSON.stringify(data):null},hypothesisId:'B',timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    email: data.email ?? '',
    login: data.login ?? '',
    role: data.role ?? 'picker',
    store_id: data.store_id,
    created_at: data.created_at?.toDate?.() ?? data.created_at,
  };
}


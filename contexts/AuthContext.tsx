'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { loadUserProfile, subscribeToAuthState } from '../lib/auth';
import type { AuthState } from '../lib/auth';
import type { User } from '../types/user';

type AuthContextValue = AuthState & {
  isLoading: boolean;
  refreshUserProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  userProfile: null,
  isLoading: true,
  refreshUserProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState & { isLoading: boolean }>({
    firebaseUser: null,
    userProfile: null,
    isLoading: true,
  });

  const refreshUserProfile = useCallback(async () => {
    const firebaseUser = state.firebaseUser;
    if (!firebaseUser) return;
    const userProfile: User | null = await loadUserProfile(firebaseUser.uid);
    setState((prev) => ({ ...prev, userProfile: userProfile ?? null }));
  }, [state.firebaseUser]);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((authState) => {
      setState({
        ...authState,
        userProfile: authState.userProfile ?? null,
        isLoading: false,
      });
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

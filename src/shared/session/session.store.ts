import { jwtDecode } from 'jwt-decode';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { isRole, type Role } from './roles';

const STORAGE_KEY = 'ticket-session';
const MS_PER_SECOND = 1000;

interface TokenClaims {
  sub?: unknown;
  role?: unknown;
  exp?: unknown;
}

interface DecodedSession {
  userId: string;
  role: Role;
  expiresAt: number;
}

interface SessionState {
  token: string | null;
  email: string | null;
  userId: string | null;
  role: Role | null;
  expiresAt: number | null;
  // true cuando la sesión venció o la API respondió 401; lo consume el layout
  expired: boolean;
  signIn: (token: string, email: string) => void;
  signOut: () => void;
  expire: () => void;
  acknowledgeExpiry: () => void;
}

type PersistedSession = Pick<SessionState, 'token' | 'email'>;

const EMPTY_SESSION = { token: null, email: null, userId: null, role: null, expiresAt: null };

/** Devuelve los datos de la sesión o null si el token es ilegible o ya venció. */
export function decodeSession(token: string): DecodedSession | null {
  let claims: TokenClaims;
  try {
    claims = jwtDecode<TokenClaims>(token);
  } catch {
    return null;
  }
  if (typeof claims.sub !== 'string' || !isRole(claims.role) || typeof claims.exp !== 'number') {
    return null;
  }
  const expiresAt = claims.exp * MS_PER_SECOND;
  if (expiresAt <= Date.now()) return null;
  return { userId: claims.sub, role: claims.role, expiresAt };
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      ...EMPTY_SESSION,
      expired: false,
      signIn: (token, email) => {
        const session = decodeSession(token);
        if (!session) throw new Error('Received an invalid access token');
        set({ token, email, ...session, expired: false });
      },
      signOut: () => set({ ...EMPTY_SESSION, expired: false }),
      expire: () => set({ ...EMPTY_SESSION, expired: true }),
      acknowledgeExpiry: () => set({ expired: false }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Solo se guardan el token y el email; el rol siempre se vuelve a sacar del token
      partialize: (state): PersistedSession => ({ token: state.token, email: state.email }),
      merge: (persisted, current) => {
        const { token, email } = (persisted ?? {}) as Partial<PersistedSession>;
        const session = token ? decodeSession(token) : null;
        if (!token || !session) return current;
        return { ...current, token, email: email ?? null, ...session };
      },
    },
  ),
);

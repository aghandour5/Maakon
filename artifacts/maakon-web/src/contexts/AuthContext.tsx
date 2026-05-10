import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchCurrentUser, logout as apiLogout, supabaseLogin } from "@/lib/auth-api";
import { supabase } from "@/lib/supabase";

// Aligned with what the backend /api/auth/me returns
// interface is a way to define the shape of an object. It is like a blueprint for an object.
export interface AuthUser {
  id: number;
  email: string | null;
  displayName: string | null;
  accountType: "individual" | "ngo";
  role: "user" | "admin" | "moderator";
  avatarUrl: string | null;
  onboardingComplete: boolean;
  emailVerified: boolean;
  ngoVerificationStatus: string | null;
  mfaEnabled: boolean;
  mfaVerified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  mfaStatus: "mfa_setup_required" | "mfa_challenge" | null;
  setMfaStatus: (status: "mfa_setup_required" | "mfa_challenge" | null) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
  refreshUser: () => Promise<void>;
}

// AuthContext is a context that is used to store the authentication state of the user.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Broadcast channel for sync
const authChannel = typeof window !== "undefined" ? new BroadcastChannel("maakon_auth") : null; // authChannel is a broadcast channel that is used to sync the authentication state of the user across different tabs.
const PENDING_DRAFT_TOKEN_KEY = "pendingDraftToken";

type MfaStatus = "mfa_setup_required" | "mfa_challenge";

type SupabaseLoginResult = {
  status?: "success" | MfaStatus;
  user?: AuthUser;
};

function isValidAccountType(value: string | null): value is "individual" | "ngo" {
  return value === "individual" || value === "ngo";
}

function getStoredAccountType(): "individual" | "ngo" | undefined {
  if (typeof window === "undefined") return undefined;

  const accountType = window.localStorage.getItem("accountTypeForSignIn");
  return isValidAccountType(accountType) ? accountType : undefined;
}

function getPendingDraftToken(urlParams?: URLSearchParams): string | undefined {
  if (typeof window === "undefined") return undefined;

  const draftTokenFromUrl = urlParams?.get("draftToken") || undefined;
  if (draftTokenFromUrl) {
    window.sessionStorage.setItem(PENDING_DRAFT_TOKEN_KEY, draftTokenFromUrl);
    return draftTokenFromUrl;
  }

  return window.sessionStorage.getItem(PENDING_DRAFT_TOKEN_KEY) || undefined;
}

function cleanupAuthStorage(): void {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem("accountTypeForSignIn");
  window.sessionStorage.removeItem(PENDING_DRAFT_TOKEN_KEY);
}

function cleanupAuthUrlParams(): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  const originalSearch = url.search;
  url.searchParams.delete("draftToken");
  url.searchParams.delete("bypassEmail");
  url.searchParams.delete("idToken");

  if (url.search !== originalSearch) {
    window.history.replaceState(
      {},
      document.title,
      `${url.pathname}${url.search}${url.hash}`,
    );
  }
}

function isLikelyJwt(token: string): boolean {
  const parts = token.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 500,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      await new Promise((resolve) => window.setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }

  throw lastError;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null); // user is the current user. It is null if the user is not logged in.
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<MfaStatus | null>(null);

  // Helper to update user and broadcast
  const syncUser = useCallback((newUser: AuthUser | null, broadcast = true) => { // syncUser is a helper function that is used to update the user and broadcast the change to other tabs.
    setUser(newUser); // setUser is a function that is used to update the user.
    if (broadcast && authChannel) { // if broadcast is true and authChannel is not null
      authChannel.postMessage({ type: "AUTH_CHANGE", user: newUser }); // postMessage is a function that is used to send a message to other tabs.
    }
  }, []);

  const handleAuthenticatedUser = useCallback((newUser: AuthUser) => {
    if (newUser.role === "admin" && !newUser.mfaVerified) {
      setMfaStatus(newUser.mfaEnabled ? "mfa_challenge" : "mfa_setup_required");
      setIsAuthModalOpen(true);
    }

    if (!newUser.onboardingComplete) {
      setIsAuthModalOpen(true);
    }
  }, []);

  const applyLoginResult = useCallback((result: SupabaseLoginResult) => {
    if (result.status === "mfa_setup_required" || result.status === "mfa_challenge") {
      setMfaStatus(result.status);
      setIsAuthModalOpen(true);
    }

    if (result.user) {
      syncUser(result.user);
      handleAuthenticatedUser(result.user);
      return true;
    }

    return false;
  }, [handleAuthenticatedUser, syncUser]);

  useEffect(() => {
    if (!authChannel) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "AUTH_CHANGE") {
        // Update local state without broadcasting back
        setUser(event.data.user);
        setIsLoading(false);
      }
    };
    authChannel.addEventListener("message", handleMessage);
    return () => authChannel.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setMfaStatus(null);
        syncUser(null);
        return;
      }

      if (event === "TOKEN_REFRESHED" && session?.access_token) {
        if (!isLikelyJwt(session.access_token)) {
          return;
        }

        try {
          const result = await supabaseLogin({ idToken: session.access_token });
          applyLoginResult(result);
        } catch (error) {
          console.error("Failed to sync refreshed Supabase token:", error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [applyLoginResult, syncUser]);

  useEffect(() => {
    async function initAuth() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const draftToken = getPendingDraftToken(urlParams);

        // 1. Kick off both checks early and in parallel
        const sessionPromise = supabase.auth.getSession();
        const currentUserPromise = fetchWithRetry(() => fetchCurrentUser()).catch(() => null);

        cleanupAuthUrlParams();

        // Wait for basic session and current user checks
        const [{ data: { session } }, currentUser] = await Promise.all([
          sessionPromise,
          currentUserPromise
        ]);

        if (currentUser) {
          // Fast path: identified by backend cookie
          setUser(currentUser);
          handleAuthenticatedUser(currentUser);
        } else if (session) {
          // Slow path: identified by Supabase but needs backend sync
          try {
            if (!isLikelyJwt(session.access_token)) {
              throw new Error("Invalid Supabase session token");
            }

            const accountType = getStoredAccountType();
            const result = await supabaseLogin({ idToken: session.access_token, accountType, draftToken });

            applyLoginResult(result);
            cleanupAuthStorage();
          } catch (authError) {
            console.error("Supabase login to backend failed:", authError);
            await supabase.auth.signOut();
            syncUser(null);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, [applyLoginResult, handleAuthenticatedUser, syncUser]);

  const login = useCallback((newUser: AuthUser) => {
    syncUser(newUser);
    handleAuthenticatedUser(newUser);
  }, [handleAuthenticatedUser, syncUser]);

  const logout = useCallback(async () => {
    try {
      await Promise.all([apiLogout(), supabase.auth.signOut()]);
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      setMfaStatus(null);
      syncUser(null);
    }
  }, [syncUser]);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => {
      const updated = prev ? { ...prev, ...updates } : null;
      if (authChannel) {
        authChannel.postMessage({ type: "AUTH_CHANGE", user: updated });
      }
      return updated;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await fetchWithRetry(() => fetchCurrentUser());
      if (currentUser) {
        syncUser(currentUser);
        handleAuthenticatedUser(currentUser);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }, [handleAuthenticatedUser, syncUser]);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const contextValue = useMemo<AuthContextType>(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    isAuthModalOpen,
    mfaStatus,
    setMfaStatus,
    openAuthModal,
    closeAuthModal,
    login,
    logout,
    updateUser,
    refreshUser,
  }), [
    closeAuthModal,
    isAuthModalOpen,
    isLoading,
    login,
    logout,
    mfaStatus,
    openAuthModal,
    refreshUser,
    updateUser,
    user,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

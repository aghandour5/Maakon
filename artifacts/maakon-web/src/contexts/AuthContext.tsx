import React, { createContext, useContext, useEffect, useState } from "react";
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
}

// AuthContext is a context that is used to store the authentication state of the user.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Broadcast channel for sync
const authChannel = typeof window !== "undefined" ? new BroadcastChannel("maakon_auth") : null; // authChannel is a broadcast channel that is used to sync the authentication state of the user across different tabs.

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null); // user is the current user. It is null if the user is not logged in.
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<"mfa_setup_required" | "mfa_challenge" | null>(null);

  // Helper to update user and broadcast
  const syncUser = (newUser: AuthUser | null, broadcast = true) => { // syncUser is a helper function that is used to update the user and broadcast the change to other tabs.
    setUser(newUser); // setUser is a function that is used to update the user.
    if (broadcast && authChannel) { // if broadcast is true and authChannel is not null
      authChannel.postMessage({ type: "AUTH_CHANGE", user: newUser }); // postMessage is a function that is used to send a message to other tabs.
    }
  };

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
    async function initAuth() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const bypassEmail = urlParams.get("bypassEmail");

        // 1. Kick off both checks early and in parallel
        const sessionPromise = supabase.auth.getSession();
        const currentUserPromise = fetchCurrentUser().catch(() => null);

        if (bypassEmail) {
          try {
            const draftToken = urlParams.get("draftToken") || undefined;
            const accountType = (window.localStorage.getItem("accountTypeForSignIn") as "individual" | "ngo") || undefined;

            const result = await supabaseLogin({ idToken: bypassEmail, accountType, draftToken });
            
            syncUser(result.user);
            if (!result.user.onboardingComplete) {
              setIsAuthModalOpen(true);
            }
            window.localStorage.removeItem("accountTypeForSignIn");
            window.history.replaceState({}, document.title, window.location.pathname);

            // In bypass mode, we already have the user, so we can stop here
            setIsLoading(false);
            return;
          } catch (err) {
            console.warn("Bypass login failed:", err);
          }
        }

        // Wait for basic session and current user checks
        const [{ data: { session } }, currentUser] = await Promise.all([
          sessionPromise,
          currentUserPromise
        ]);

        if (currentUser) {
          // Fast path: identified by backend cookie
          setUser(currentUser);
          if (!currentUser.onboardingComplete) {
            setIsAuthModalOpen(true);
          }
        } else if (session) {
          // Slow path: identified by Supabase but needs backend sync
          try {
            const draftToken = urlParams.get("draftToken") || undefined;
            const accountType = (window.localStorage.getItem("accountTypeForSignIn") as "individual" | "ngo") || undefined;

            const result = await supabaseLogin({ idToken: session.access_token, accountType, draftToken });
            
            syncUser(result.user);
            if (!result.user.onboardingComplete) {
              setIsAuthModalOpen(true);
            }
            window.localStorage.removeItem("accountTypeForSignIn");
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (authError) {
            console.error("Supabase login to backend failed:", authError);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = (newUser: AuthUser) => {
    syncUser(newUser);
  };

  const logout = async () => {
    try {
      await apiLogout();
      // Also sign out of Supabase
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      syncUser(null);
    }
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser((prev) => {
      const updated = prev ? { ...prev, ...updates } : null;
      if (authChannel) {
        authChannel.postMessage({ type: "AUTH_CHANGE", user: updated });
      }
      return updated;
    });
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
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

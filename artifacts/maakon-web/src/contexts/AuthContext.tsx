import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchCurrentUser, logout as apiLogout, supabaseLogin } from "@/lib/auth-api";
import { supabase } from "@/lib/supabase";
// Aligned with what the backend /api/auth/me returns
export interface AuthUser {
  id: number;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  accountType: "individual" | "ngo";
  role: "user" | "admin" | "moderator";
  avatarUrl: string | null;
  onboardingComplete: boolean;
  emailVerified: boolean;
  whatsappVerified: boolean;
  ngoVerificationStatus: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    async function initAuth() {
      try {
        // 1. Check if Supabase session establishes (Magic Link callback) or Bypass
        const urlParams = new URLSearchParams(window.location.search);
        const bypassEmail = urlParams.get("bypassEmail");

        if (bypassEmail) {
          try {
            const draftToken = urlParams.get("draftToken") || undefined;
            const accountType = (window.localStorage.getItem("accountTypeForSignIn") as "individual" | "ngo") || undefined;

            const result = await supabaseLogin({ idToken: bypassEmail, accountType, draftToken });
            setUser(result.user);
            if (!result.user.onboardingComplete) {
              setIsAuthModalOpen(true);
            }
            window.localStorage.removeItem("accountTypeForSignIn");
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (err) {
            console.warn("Bypass login failed:", err);
          }
        } else {
          // Check for a Supabase session (e.g., after clicking an OTP magic link)
          // The supabase client automatically handles the #access_token fragment in the URL
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (session) {
            try {
              const draftToken = urlParams.get("draftToken") || undefined;
              const accountType = (window.localStorage.getItem("accountTypeForSignIn") as "individual" | "ngo") || undefined;
              
              // We pass the Supabase JWT to our custom backend to establish the HTTP-only secure cookie session
              const result = await supabaseLogin({ idToken: session.access_token, accountType, draftToken });
              setUser(result.user);
              if (!result.user.onboardingComplete) {
                setIsAuthModalOpen(true);
              }
              window.localStorage.removeItem("accountTypeForSignIn");
              window.history.replaceState({}, document.title, window.location.pathname);
            } catch (authError) {
              console.error("Supabase login to backend failed:", authError);
            }
          }
        }

        // 2. Check existing server session
        const currentUser = await fetchCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          if (!currentUser.onboardingComplete) {
            setIsAuthModalOpen(true);
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
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await apiLogout();
      // Also sign out of Supabase
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      setUser(null);
    }
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
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

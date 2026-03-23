import { useAuth } from "@/contexts/AuthContext";

export function useAuthGate() {
  const { isAuthenticated, openAuthModal } = useAuth();

  const requireAuth = <T extends unknown[]>(callback: (...args: T) => void) => {
    return (...args: T) => {
      if (!isAuthenticated) {
        openAuthModal();
        return;
      }
      callback(...args);
    };
  };

  return { isAuthenticated, requireAuth, openAuthModal };
}

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AuthCallback() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    // Once the AuthContext has handled the callback and user is set,
    // or if the process finished and user is still null (fail), redirect.
    if (!isLoading) {
      if (user) {
        // Redirect to home or where they were
        setLocation("/");
      } else {
        // If they are not logged in after the callback, go home too
        setLocation("/");
      }
    }
  }, [user, isLoading, setLocation]);

  return (
    <div className="h-dvh flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center animate-pulse">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
      <h2 className="text-xl font-bold text-slate-800">
        {t("signing_you_in", "Signing you in...")}
      </h2>
      <p className="text-sm text-slate-500">
        {t("auth_callback_desc", "Please wait while we verify your sign-in link.")}
      </p>
    </div>
  );
}

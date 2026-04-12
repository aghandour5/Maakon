import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AuthCallback() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation(); // we use setLocation to redirect the user after the callback is handled. We don't care about the current location, so we ignore it with a comma.
  const { t } = useTranslation(); // we use the t function to translate the text. The first argument is the key of the translation, and the second argument is the default text in case the translation is missing. We use this function to make sure that the text is translated even on this callback page, which might be shown before the main app is fully loaded.

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

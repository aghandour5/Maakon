/**
 * EmailStep — collects user email and sends Firebase email-link sign-in.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Mail, ArrowRight, Loader2 } from "lucide-react";

interface EmailStepProps {
  email: string;
  setEmail: (email: string) => void;
  onNext: (isNew: boolean) => void;
}

export default function EmailStep({ email, setEmail, onNext }: EmailStepProps) {
  const { t } = useTranslation();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (e: string) => /^.+@.+\..+$/.test(e);

  const handleSendLink = async () => {
    if (!validateEmail(email)) {
      setError(t("invalid_email", "Please enter a valid email address"));
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Build the callback URL — Supabase will redirect to this URL after sign-in
      const callbackUrl = `${window.location.origin}/auth/callback`;

      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl,
        },
      });

      if (authError) throw authError;

      // Save email for the callback handler
      window.localStorage.setItem("emailForSignIn", email);

      // Always go to new user flow — account type step → check email
      // The backend will merge with existing accounts if email already exists
      onNext(true);
    } catch (err: any) {
      console.error("Email link send error:", err);
      setError(err.message || t("email_link_error", "Failed to send sign-in link"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3"
          style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)" }}>
          <Mail className="w-7 h-7 text-blue-600" />
        </div>
        <p className="text-sm text-gray-500">
          {t("email_sign_in_desc")}
        </p>
      </div>

      <div>
        <input
          type="email"
          className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-blue-400 outline-none text-sm font-medium placeholder:text-gray-400"
          placeholder={t("email_placeholder", "you@example.com")}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
          dir="ltr"
          autoComplete="email"
          disabled={isLoading}
          onKeyDown={(e) => e.key === "Enter" && handleSendLink()}
        />
        {error && (
          <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>

      <button
        onClick={handleSendLink}
        disabled={isLoading || !email}
        className="w-full h-12 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
        style={{
          background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
          boxShadow: "0 4px 16px rgba(220,38,38,0.4)",
        }}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            {t("send_sign_in_link", "Send Sign-In Link")}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}

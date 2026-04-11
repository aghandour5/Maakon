import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import AccountTypeStep from "./AccountTypeStep";
import IndividualProfileStep from "./IndividualProfileStep";
import NgoProfileStep from "./NgoProfileStep";
import EmailStep from "./EmailStep";

import { useTranslation } from "react-i18next";
import { setupMfa, verifyMfa, challengeMfa, fetchCurrentUser } from "@/lib/auth-api";

export type AuthStep = "email" | "accountType" | "checkEmail" | "individualProfile" | "ngoProfile" | "mfaSetup" | "mfaChallenge";
export type AccountType = "individual" | "ngo";

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, user, mfaStatus, setMfaStatus, login } = useAuth();
  const { t } = useTranslation();

  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);

  // If the user is logged in but onboarding is not complete, force the modal open
  // and set the correct step — regardless of isAuthModalOpen.
  const needsOnboarding = !!user && !user.onboardingComplete;
  const isOpen = isAuthModalOpen || needsOnboarding;

  useEffect(() => {
    if (needsOnboarding) {
      const targetStep = user!.accountType === "ngo" ? "ngoProfile" : "individualProfile";
      if (step !== targetStep) {
        setStep(targetStep);
      }
    }
  }, [needsOnboarding, user]);

  // When the auth context signals an MFA requirement, transition to the correct step
  useEffect(() => {
    if (mfaStatus === "mfa_setup_required") {
      setMfaLoading(true);
      setupMfa()
        .then((data) => {
          setMfaQrCode(data.qrCodeDataUrl);
          setStep("mfaSetup");
        })
        .catch(() => setMfaError("Failed to load QR code. Please try again."))
        .finally(() => setMfaLoading(false));
    } else if (mfaStatus === "mfa_challenge") {
      setStep("mfaChallenge");
    }
  }, [mfaStatus]);

  const handleMfaSubmit = async () => {
    if (mfaCode.length !== 6) return;
    setMfaLoading(true);
    setMfaError("");
    try {
      if (mfaStatus === "mfa_setup_required") {
        await verifyMfa(mfaCode);
      } else {
        await challengeMfa(mfaCode);
      }
      // MFA passed — fetch real user and complete login
      const userData = await fetchCurrentUser();
      if (userData) login(userData);
      setMfaStatus(null);
      closeAuthModal();
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : "Invalid code. Try again.");
    } finally {
      setMfaLoading(false);
      setMfaCode("");
    }
  };

  // Reset state when closing
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeAuthModal();
      setTimeout(() => {
        setStep("email");
        setEmail("");
        setAccountType("individual");
      }, 300);
    }
  };

  const currentTitle = () => {
    switch (step) {
      case "email": return t("sign_in");
      case "accountType": return t("auth_title_account");
      case "checkEmail": return t("auth_title_check_email", "Check Your Email");
      case "individualProfile": return t("auth_title_profile");
      case "ngoProfile": return t("auth_title_ngo");
      case "mfaSetup": return "Set Up Two-Factor Authentication";
      case "mfaChallenge": return "Two-Factor Authentication";
      default: return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Don't allow closing while onboarding is required
      if (!open && !needsOnboarding) {
        handleOpenChange(open);
      }
    }}>
      <DialogContent className="!translate-y-0 !top-[10%] sm:!translate-y-[-50%] sm:!top-[50%] sm:max-w-[425px] max-h-[85vh] overflow-y-auto overflow-x-hidden" onInteractOutside={(e) => {
        // Prevent closing by clicking outside during onboarding
        if (needsOnboarding) e.preventDefault();
      }}>
        <DialogHeader>
          <DialogTitle className="text-xl text-center">{currentTitle()}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {step === "email" && (
            <EmailStep
              email={email}
              setEmail={setEmail}
              onNext={(isNew: boolean) => setStep(isNew ? "accountType" : "checkEmail")}
            />
          )}

          {step === "accountType" && (
            <AccountTypeStep
              accountType={accountType}
              setAccountType={setAccountType}
              onNext={() => setStep("checkEmail")}
            />
          )}

          {step === "checkEmail" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                <span className="text-3xl">📧</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {t("check_email_title", "Check your inbox")}
              </h3>
              <p className="text-sm text-gray-500 max-w-xs">
                {t("check_email_desc", "We sent a sign-in link to {{email}}. Click the link to continue.", { email })}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {t("check_email_hint", "Don't see it? Check your spam folder.")}
              </p>
              <button
                onClick={() => setStep("email")}
                className="text-sm text-blue-600 hover:underline mt-2"
              >
                {t("use_different_email", "Use a different email")}
              </button>
            </div>
          )}

          {step === "individualProfile" && (
            <IndividualProfileStep
              onComplete={closeAuthModal}
            />
          )}

          {step === "ngoProfile" && (
            <NgoProfileStep
              onComplete={closeAuthModal}
            />
          )}


          {/* MFA Setup — Admin scans QR code then enters first code to activate */}
          {step === "mfaSetup" && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-1">Scan this QR code with</p>
                <p className="text-sm font-semibold text-slate-700">Google Authenticator or Authy</p>
              </div>
              {mfaLoading && !mfaQrCode && (
                <div className="w-48 h-48 bg-slate-100 rounded-xl animate-pulse" />
              )}
              {mfaQrCode && (
                <img src={mfaQrCode} alt="MFA QR Code" className="w-48 h-48 rounded-xl border border-slate-200 shadow-sm" />
              )}
              <p className="text-xs text-slate-400 text-center max-w-xs">
                After scanning, enter the 6-digit code from the app to activate 2FA on your account.
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full text-center text-2xl font-mono tracking-[0.5em] border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {mfaError && <p className="text-sm text-red-500">{mfaError}</p>}
              <button
                onClick={handleMfaSubmit}
                disabled={mfaCode.length !== 6 || mfaLoading}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {mfaLoading ? "Verifying..." : "Activate 2FA"}
              </button>
            </div>
          )}

          {/* MFA Challenge — Admin types code from their authenticator app */}
          {step === "mfaChallenge" && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <span className="text-3xl">🔐</span>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500">Open your authenticator app and enter the</p>
                <p className="text-sm font-semibold text-slate-700">6-digit code for Maakon Admin</p>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && handleMfaSubmit()}
                className="w-full text-center text-2xl font-mono tracking-[0.5em] border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              {mfaError && <p className="text-sm text-red-500">{mfaError}</p>}
              <button
                onClick={handleMfaSubmit}
                disabled={mfaCode.length !== 6 || mfaLoading}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {mfaLoading ? "Verifying..." : "Continue"}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

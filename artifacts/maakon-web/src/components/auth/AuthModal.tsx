import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import AccountTypeStep from "./AccountTypeStep";
import IndividualProfileStep from "./IndividualProfileStep";
import NgoProfileStep from "./NgoProfileStep";
import EmailStep from "./EmailStep";
import WhatsAppOtpStep from "./WhatsAppOtpStep";
import { useTranslation } from "react-i18next";

export type AuthStep = "email" | "accountType" | "checkEmail" | "individualProfile" | "ngoProfile" | "whatsappOtp";
export type AccountType = "individual" | "ngo";

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, user } = useAuth();
  const { t } = useTranslation();

  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("individual");

  // If the user is logged in but onboarding is not complete, force the modal open
  // and set the correct step — regardless of isAuthModalOpen.
  const needsOnboarding = !!user && !user.onboardingComplete;
  const isOpen = isAuthModalOpen || needsOnboarding;

  useEffect(() => {
    if (needsOnboarding) {
      const targetStep = user!.accountType === "ngo" ? "ngoProfile" : "individualProfile";
      // Only switch if we are not already on the right step or finishing whatsapp
      if (step !== targetStep && step !== "whatsappOtp") {
        setStep(targetStep);
      }
    }
  }, [needsOnboarding, user]);

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
      case "email": return t("auth_title_email", "Sign In");
      case "accountType": return t("auth_title_account");
      case "checkEmail": return t("auth_title_check_email", "Check Your Email");
      case "individualProfile": return t("auth_title_profile");
      case "ngoProfile": return t("auth_title_ngo");
      case "whatsappOtp": return t("auth_title_whatsapp", "Verify WhatsApp");
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
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {
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
              onComplete={() => setStep("whatsappOtp")}
            />
          )}

          {step === "whatsappOtp" && (
            <WhatsAppOtpStep
              onComplete={closeAuthModal}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

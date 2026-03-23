/**
 * WhatsAppOtpStep — NGO WhatsApp phone verification via Twilio Verify.
 *
 * Only shown for NGO accounts after profile completion.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { sendWhatsAppOtp, verifyWhatsAppOtp } from "@/lib/auth-api";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, CheckCircle2, Loader2, MessageCircle } from "lucide-react";

interface WhatsAppOtpStepProps {
  onComplete: () => void;
}

type Phase = "enterPhone" | "enterCode" | "verified";

export default function WhatsAppOtpStep({ onComplete }: WhatsAppOtpStepProps) {
  const { t } = useTranslation();
  const { updateUser } = useAuth();

  const [phase, setPhase] = useState<Phase>("enterPhone");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+961");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fullPhone = `${countryCode}${phone.replace(/\s/g, "")}`;

  const handleSendOtp = async () => {
    if (!phone.replace(/\s/g, "")) {
      setError(t("required", "Required"));
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      await sendWhatsAppOtp({ phone: fullPhone });
      setPhase("enterCode");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!code || code.length < 4) {
      setError(t("invalid_code", "Please enter the verification code"));
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      await verifyWhatsAppOtp({ phone: fullPhone, code });
      updateUser({ whatsappVerified: true, phone: fullPhone });
      setPhase("verified");
      setTimeout(onComplete, 1500);
    } catch (err: any) {
      setError(err.message || "Invalid code");
    } finally {
      setIsLoading(false);
    }
  };

  if (phase === "verified") {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #dcfce7, #bbf7d0)" }}>
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">
          {t("whatsapp_verified", "WhatsApp Verified!")}
        </h3>
        <p className="text-sm text-gray-500">
          {t("whatsapp_verified_desc", "Your organization phone number has been verified.")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3"
          style={{ background: "linear-gradient(135deg, #dcfce7, #bbf7d0)" }}>
          <MessageCircle className="w-7 h-7 text-green-600" />
        </div>
        <p className="text-sm text-gray-500">
          {phase === "enterPhone"
            ? t("whatsapp_otp_desc", "Enter your organization's WhatsApp-enabled phone number to verify it.")
            : t("whatsapp_code_desc", "Enter the verification code sent to your WhatsApp.")}
        </p>
      </div>

      {phase === "enterPhone" && (
        <>
          <div className="flex gap-2">
            <select
              className="px-2 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-green-400 outline-none text-sm font-bold text-gray-700 w-[100px] shrink-0"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              dir="ltr"
            >
              <option value="+961">🇱🇧 +961</option>
              <option value="+963">🇸🇾 +963</option>
              <option value="+962">🇯🇴 +962</option>
              <option value="+970">🇵🇸 +970</option>
              <option value="+20">🇪🇬 +20</option>
              <option value="+33">🇫🇷 +33</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+44">🇬🇧 +44</option>
            </select>
            <input
              type="tel"
              className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-green-400 outline-none text-sm font-medium placeholder:text-gray-400"
              placeholder="e.g. 70 123 456"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </p>
          )}

          <button
            onClick={handleSendOtp}
            disabled={isLoading || !phone}
            className="w-full h-12 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              boxShadow: "0 4px 16px rgba(34,197,94,0.4)",
            }}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("send_whatsapp_otp", "Send WhatsApp Code")}
          </button>
        </>
      )}

      {phase === "enterCode" && (
        <>
          <input
            type="text"
            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-green-400 outline-none text-sm font-medium text-center tracking-[0.3em] placeholder:text-gray-400"
            placeholder="● ● ● ● ● ●"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
            disabled={isLoading}
            autoFocus
          />

          {error && (
            <p className="text-red-500 text-xs flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </p>
          )}

          <button
            onClick={handleVerifyOtp}
            disabled={isLoading || code.length < 4}
            className="w-full h-12 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              boxShadow: "0 4px 16px rgba(34,197,94,0.4)",
            }}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("verify_code", "Verify Code")}
          </button>

          <button
            onClick={() => { setPhase("enterPhone"); setCode(""); setError(""); }}
            className="text-sm text-gray-500 hover:underline text-center"
          >
            {t("change_number", "Change number")}
          </button>
        </>
      )}

      <button
        onClick={onComplete}
        className="text-sm text-gray-400 hover:underline text-center"
      >
        {t("skip_for_now", "Skip for now")}
      </button>
    </div>
  );
}

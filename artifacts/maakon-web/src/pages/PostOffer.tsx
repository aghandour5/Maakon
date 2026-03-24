import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TopNav } from "@/components/layout/TopNav";
import { useCreatePost, useGetMetadata, getListPostsQueryKey } from "@workspace/api-client-react";
import type { CreatePostInput } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  XCircle,
  Check,
  ArrowRight,
  ArrowLeft,
  Mail,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createDraftPost } from "@/lib/auth-api";
import { supabase } from "@/lib/supabase";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

// ── Constants ──────────────────────────────────────────────────────────────

const EXPIRY_PRESETS = [
  { key: "expiry_1d", days: 1 },
  { key: "expiry_3d", days: 3 },
  { key: "expiry_1w", days: 7 },
  { key: "expiry_1m", days: 30 },
] as const;

const PROVIDERS = ["individual", "ngo"] as const;

const PROVIDER_CONFIG = {
  individual: { emoji: "🙋" },
  ngo:        { emoji: "🏛️" },
  business:   { emoji: "🏢" },
  government: { emoji: "🏛️" },
};

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍞",
  shelter: "🏠",
  clothing: "👕",
  medical: "💊",
  water: "💧",
  transportation: "🚗",
  psychological: "🧠",
  legal: "⚖️",
  education: "📚",
  volunteers: "🤝",
  other: "📦",
};

const fadeVariants = {
  enter: { opacity: 0, y: 14 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const mapPinIcon = L.divIcon({
  className: "custom-marker bg-transparent border-0",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  html: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="drop-shadow-md text-emerald-600">
    <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>`
});

function LocationPicker({ position, setPosition }: { position: [number, number] | null; setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} icon={mapPinIcon} /> : null;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function FieldLabel({ children, isRtl }: { children: React.ReactNode; isRtl?: boolean }) {
  return (
    <label
      className="block text-start text-xs font-bold text-foreground/60 uppercase tracking-wider mb-2"
    >
      {children}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {msg}
    </p>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function PostOffer() {
  type OfferPostInput = CreatePostInput & {
    providedLat?: number | null;
    providedLng?: number | null;
  };

  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: metadata } = useGetMetadata();
  const createPost = useCreatePost();
  const { toast } = useToast();
  const { isAuthenticated, openAuthModal } = useAuth();

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<OfferPostInput>>({
    postType: "offer",
    contactMethod: "phone",
  });
  const [countryCode, setCountryCode] = useState("+961");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [draftEmail, setDraftEmail] = useState("");
  const [draftError, setDraftError] = useState("");
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [draftToken, setDraftToken] = useState<string | null>(null);

  const patch = (data: Partial<OfferPostInput>) =>
    setFormData((p) => ({ ...p, ...data }));

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1 && !formData.category) e.category = t("required");
    if (s === 2) {
      if (!formData.title || formData.title.length < 3) e.title = t("min_length", { min: 3 });
      if (!formData.description || formData.description.length < 10)
        e.description = t("min_length", { min: 10 });
    }
    if (s === 3) {
      if (!formData.governorate) e.governorate = t("required");
      if (!expiresInDays) e.expiresInDays = t("required");

      const isPhoneContact = ["phone", "whatsapp", "signal"].includes(formData.contactMethod || "");
      if (isPhoneContact) {
        const rawNum = phoneNumber.replace(/\s/g, "");
        if (!rawNum) {
          e.contactInfo = t("required");
        } else if (countryCode === "+961" && !/^(03|3|70|71|76|78|79|81|0[1-9])[0-9]{6}$/.test(rawNum)) {
          e.contactInfo = t("invalid_lb_phone");
        } else if (rawNum.length < 5 || rawNum.length > 15) {
          e.contactInfo = t("invalid_phone_len");
        }
      } else {
        if (!formData.contactInfo) {
          e.contactInfo = t("required");
        } else if (formData.contactMethod === "email" && !/^.+@.+\..+$/.test(formData.contactInfo)) {
          e.contactInfo = t("invalid_email");
        }
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const go = (next: number) => {
    if (next > step && !validate(step)) return;
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const handleSubmit = async () => {
    if (!validate(4)) return;

    const isPhoneContact = ["phone", "whatsapp", "signal"].includes(formData.contactMethod || "");
    const parsedContactInfo = isPhoneContact ? `${countryCode} ${phoneNumber.trim()}` : formData.contactInfo!;
    const finalData = {
      ...(formData as OfferPostInput),
      contactInfo: parsedContactInfo, 
      expiresInDays: expiresInDays! 
    };

    if (isAuthenticated) {
      createPost.mutate(
        { data: finalData },
        {
          onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
            setIsSuccess(true);
          },
          onError: (error) => {
            toast({
              variant: "destructive",
              title: t("submit_error") || "Failed to submit post",
              description: error instanceof Error ? error.message : t("toast_server_error"),
            });
          }
        }
      );
    } else {
      setIsDraftLoading(true);
      try {
        const draft = await createDraftPost({
          postType: finalData.postType as "need" | "offer",
          title: finalData.title,
          category: finalData.category,
          description: finalData.description,
          urgency: finalData.urgency as any ?? undefined,
          governorate: finalData.governorate,
          district: finalData.district ?? undefined,
          exactAddressPrivate: finalData.exactAddressPrivate ?? undefined,
          providerType: finalData.providerType ?? undefined,
          contactMethod: finalData.contactMethod ?? undefined,
          contactInfo: finalData.contactInfo ?? undefined,
          expiresInDays: finalData.expiresInDays ?? undefined,
          providedLat: finalData.providedLat ?? undefined,
          providedLng: finalData.providedLng ?? undefined,
        });
        setDraftToken(draft.draftToken);
        setDir(1);
        setStep(5);
      } catch (error) {
        toast({
          variant: "destructive",
          title: t("submit_error") || "Failed to save draft",
          description: error instanceof Error ? error.message : t("toast_try_again"),
        });
      } finally {
        setIsDraftLoading(false);
      }
    }
  };

  const handleSendEmailLink = async () => {
    if (!/^.+@.+\..+$/.test(draftEmail)) {
      setDraftError(t("invalid_email", "Please enter a valid email"));
      return;
    }
    setDraftError("");
    setIsDraftLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/auth/callback?draftToken=${draftToken}`;
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: draftEmail,
        options: { emailRedirectTo: callbackUrl },
      });
      if (authError) throw authError;

      window.localStorage.setItem("emailForSignIn", draftEmail);
      setDir(1);
      setStep(6);
    } catch (err: any) {
      setDraftError(err.message || "Failed to send sign-in link");
    } finally {
      setIsDraftLoading(false);
    }
  };

  // ── Success ──────────────────────────────────────────────────────────────

  if (isSuccess) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center p-6 text-center"
        style={{ background: "linear-gradient(140deg, #021c13 0%, #064e3b 45%, #022c22 100%)" }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="bg-white rounded-3xl p-8 max-w-sm w-full flex flex-col items-center shadow-2xl"
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
            style={{ background: "linear-gradient(135deg, #dcfce7, #bbf7d0)" }}>
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">{t("success_title")}</h2>
          <p className="text-gray-500 text-sm mb-7">{t("success_desc")}</p>
          <button
            onClick={() => setLocation("/map")}
            className="w-full h-12 rounded-2xl font-bold text-white text-base transition-transform active:scale-95"
            style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
          >
            {t("view_map")}
          </button>
        </motion.div>
      </div>
    );
  }

  // Auth gate removed — individuals can fill form first, then sign in on submit

  // ── Form ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-slate-50" dir={isRtl ? "rtl" : "ltr"}>
      <TopNav title={t("post_offer_title")} showBack />
      {/* Spacer to push content below the fixed navbar */}
      <div className="h-16 sm:h-20 shrink-0" />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Accent header strip ─────────────────────────────────────────── */}
        <div
          className="shrink-0 px-5 pt-4 pb-5"
          style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}
        >
          <div className="flex items-center">
            {[1, 2, 3, 4].map((num, i) => (
              <div key={num} className={`flex items-center ${i < 3 ? "flex-1" : ""}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all duration-300 ${
                    step > num
                      ? "bg-white text-emerald-600"
                      : step === num
                      ? "bg-white text-emerald-600 ring-4 ring-white/30"
                      : "bg-white/20 text-white border-2 border-white/40"
                  }`}
                >
                  {step > num ? <Check className="w-4 h-4" /> : num}
                </div>
                {i < 3 && (
                  <div className="flex-1 h-0.5 mx-1.5 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-500"
                      style={{ width: step > num + 1 ? "100%" : step > num ? "60%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Scrollable content ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={fadeVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-3xl overflow-hidden"
              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.05)" }}
            >
              <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #059669, #34d399)" }} />
              <div className="p-5 flex flex-col gap-5">

                {/* ── Step 1 ──────────────────────────────────────────────── */}
                {step === 1 && (
                  <>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 mb-0.5">{t("step_1_offer")}</h2>
                      <p className="text-sm text-gray-400">{t("category")}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {metadata?.categories.map((cat) => {
                        const selected = formData.category === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => patch({ category: cat })}
                            className="py-3.5 px-3 rounded-2xl font-semibold text-sm flex items-center gap-2.5 transition-all duration-150 active:scale-95 border-2"
                            style={
                              selected
                                ? {
                                    background: "linear-gradient(135deg, #059669, #10b981)",
                                    borderColor: "transparent",
                                    color: "white",
                                    boxShadow: "0 4px 12px rgba(5,150,105,0.4)",
                                  }
                                : {
                                    background: "#f8fafc",
                                    borderColor: "#e2e8f0",
                                    color: "#374151",
                                  }
                            }
                          >
                            <span className="text-lg leading-none">{CATEGORY_ICONS[cat] ?? "📦"}</span>
                            <span className="truncate">{t(cat)}</span>
                          </button>
                        );
                      })}
                    </div>
                    <FieldError msg={errors.category} />

                    {/* Provider type */}
                    <div>
                      <h2 className="text-xl font-black text-gray-900 mb-0.5">{t("who_offering_help")}</h2>
                      <p className="text-sm text-gray-400 mb-4">{t("who_offering_help_desc")}</p>
                      <div className="grid grid-cols-1 gap-3">
                        {PROVIDERS.map((prov) => {
                          const selected = formData.providerType === prov;
                          return (
                            <button
                              key={prov}
                              type="button"
                              onClick={() => patch({ providerType: prov })}
                              className="p-4 rounded-2xl flex text-start items-center gap-4 transition-all duration-150 active:scale-95 border-2"
                              style={{
                                ...(selected
                                  ? { background: "linear-gradient(135deg, #059669, #10b981)", borderColor: "transparent", color: "white", boxShadow: "0 4px 12px rgba(5,150,105,0.35)" }
                                  : { background: "#f0fdf4", borderColor: "#bbf7d0", color: "#065f46" }),
                              }}
                            >
                              <span className="text-3xl leading-none">{PROVIDER_CONFIG[prov].emoji}</span>
                              <div className="flex flex-col">
                                <span className="font-bold text-lg">{t(`account_${prov}`)}</span>
                                <span className={`text-xs font-medium ${selected ? "text-emerald-100" : "text-slate-400"}`}>
                                  {t(prov === "individual" ? "indiv_offer_desc" : "ngo_offer_desc")}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* ── Step 2 ──────────────────────────────────────────────── */}
                {step === 2 && (
                  <>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 mb-0.5">{t("step_2_desc")}</h2>
                      <p className="text-sm text-gray-400">{t("title_label")}</p>
                    </div>

                    <div>
                      <input
                        type="text"
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 transition-all outline-none text-sm font-medium placeholder:text-gray-400"
                        placeholder={t("title_placeholder_offer")}
                        value={formData.title ?? ""}
                        onChange={(e) => patch({ title: e.target.value })}
                      />
                      <FieldError msg={errors.title} />
                    </div>

                    <div>
                      <FieldLabel>{t("desc_label")}</FieldLabel>
                      <textarea
                        rows={6}
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 transition-all outline-none resize-none text-sm font-medium placeholder:text-gray-400"
                        placeholder={t("desc_placeholder_offer")}
                        value={formData.description ?? ""}
                        onChange={(e) => patch({ description: e.target.value })}
                      />
                      <FieldError msg={errors.description} />
                    </div>
                  </>
                )}

                {/* ── Step 3 ──────────────────────────────────────────────── */}
                {step === 3 && (
                  <>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 mb-0.5">{t("step_3_loc")}</h2>
                      <p className="text-sm text-gray-400">{t("governorate")}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <select
                          className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-400 outline-none text-sm font-medium text-gray-700"
                          value={formData.governorate ?? ""}
                          onChange={(e) => patch({ governorate: e.target.value, district: "" })}
                        >
                          <option value="" disabled>{t("select_placeholder")}</option>
                          {metadata?.governorates.map((g) => <option key={g} value={g}>{t(g)}</option>)}
                        </select>
                        <FieldError msg={errors.governorate} />
                      </div>
                      {formData.governorate && metadata?.districts[formData.governorate]?.length ? (
                        <div>
                          <select
                            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-400 outline-none text-sm font-medium text-gray-700"
                            value={formData.district ?? ""}
                            onChange={(e) => patch({ district: e.target.value })}
                          >
                            <option value="" disabled>{t("select_placeholder")}</option>
                            {metadata.districts[formData.governorate].map((d) => (
                              <option key={d} value={d}>{t(d)}</option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <FieldLabel>{t("expiry_label")}</FieldLabel>
                      <div className="grid grid-cols-4 gap-2">
                        {EXPIRY_PRESETS.map(({ key, days }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setExpiresInDays(days)}
                            className="py-2.5 rounded-xl text-xs font-bold transition-all duration-150 border-2 active:scale-95"
                            style={
                              expiresInDays === days
                                ? {
                                    background: "linear-gradient(135deg, #059669, #10b981)",
                                    borderColor: "transparent",
                                    color: "white",
                                    boxShadow: "0 3px 10px rgba(5,150,105,0.35)",
                                  }
                                : { background: "#f8fafc", borderColor: "#e2e8f0", color: "#6b7280" }
                            }
                          >
                            {t(key)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel>{t("contact_method")}</FieldLabel>
                        <select
                          className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-400 outline-none text-sm font-medium text-gray-700"
                          value={formData.contactMethod ?? ""}
                          onChange={(e) => patch({ contactMethod: e.target.value })}
                        >
                          <option value="" disabled>{t("select_placeholder")}</option>
                          {metadata?.contactMethods.map((c) => <option key={c} value={c}>{t(c)}</option>)}
                        </select>
                      </div>
                      <div>
                        <FieldLabel>{t("contact_info")}</FieldLabel>
                        {["phone", "whatsapp", "signal"].includes(formData.contactMethod || "") ? (
                          <div className="flex gap-2">
                            <select
                              className="px-2 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-400 outline-none text-sm font-bold text-gray-700 w-[100px] sm:w-[110px] shrink-0"
                              value={countryCode}
                              onChange={e => setCountryCode(e.target.value)}
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
                              <option value="other">Other</option>
                            </select>
                            <input
                              type="tel"
                              className="flex-1 w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-400 outline-none text-sm font-medium placeholder:text-gray-400"
                              placeholder="e.g. 70 123 456"
                              dir="ltr"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s]/g, ""))}
                            />
                          </div>
                        ) : (
                          <input
                            type={formData.contactMethod === "email" ? "email" : "text"}
                            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-400 outline-none text-sm font-medium placeholder:text-gray-400"
                            placeholder={formData.contactMethod === "email" ? "you@example.com" : t("contact_info")}
                            dir="ltr"
                            value={formData.contactInfo ?? ""}
                            onChange={(e) => patch({ contactInfo: e.target.value })}
                          />
                        )}
                        <FieldError msg={errors.contactInfo} />
                      </div>
                    </div>
                  </>
                )}

                {/* ── Step 4 ──────────────────────────────────────────────── */}
                {step === 4 && (() => {
                  // Governorate centers for distance check
                  const GOV_CENTERS: Record<string, { lat: number; lng: number }> = {
                    "Beirut": { lat: 33.8938, lng: 35.5018 },
                    "Mount Lebanon": { lat: 33.8100, lng: 35.6000 },
                    "North Lebanon": { lat: 34.4333, lng: 35.8333 },
                    "South Lebanon": { lat: 33.2717, lng: 35.2033 },
                    "Nabatieh": { lat: 33.3772, lng: 35.4840 },
                    "Bekaa": { lat: 33.8500, lng: 35.9017 },
                    "Akkar": { lat: 34.5581, lng: 36.0808 },
                    "Baalbek-Hermel": { lat: 34.0049, lng: 36.2098 },
                  };
                  const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
                    const R = 6371;
                    const dLat = (lat2 - lat1) * Math.PI / 180;
                    const dLng = (lng2 - lng1) * Math.PI / 180;
                    const a = Math.sin(dLat / 2) ** 2 +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLng / 2) ** 2;
                    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                  };
                  const govCenter = formData.governorate ? GOV_CENTERS[formData.governorate] : null;
                  const pinLat = formData.providedLat;
                  const pinLng = formData.providedLng;
                  const distKm = govCenter && pinLat && pinLng
                    ? haversineKm(pinLat, pinLng, govCenter.lat, govCenter.lng)
                    : null;
                  const isFarFromGov = distKm !== null && distKm > 50;

                  return (
                  <div className="flex flex-col h-full">
                    <div className="mb-4">
                      <h2 className="text-xl font-black text-gray-900 mb-0.5">{t("exact_location_title")}</h2>
                      <p className="text-sm text-gray-400">{t("exact_location_desc")}</p>
                    </div>
                    <div className="h-[300px] w-full border-2 border-slate-200 rounded-2xl overflow-hidden relative z-0">
                      <MapContainer center={[33.8547, 35.8623]} zoom={8} style={{ height: "100%", width: "100%" }}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        <LocationPicker 
                          position={formData.providedLat && formData.providedLng ? [formData.providedLat, formData.providedLng] : null} 
                          setPosition={([lat, lng]) => patch({ providedLat: lat, providedLng: lng })} 
                        />
                      </MapContainer>
                    </div>
                    {isFarFromGov && (
                      <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-orange-50 border border-orange-200">
                        <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-orange-700 font-medium">
                          {t("pin_distance_warning", { dist: Math.round(distKm), gov: formData.governorate })}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-center text-slate-500 mt-3 font-medium">
                      {t("tap_map_hint")}
                    </p>
                  </div>
                  );
                })()}
              </div>
            </motion.div>

            {/* Steps 5 & 6 rendered outside the card for the email flow */}
            {step === 5 && (
              <motion.div
                key="emailStep"
                variants={fadeVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-white rounded-3xl overflow-hidden"
                style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.05)" }}
              >
                <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #059669, #34d399)" }} />
                <div className="p-5 flex flex-col gap-5">
                  <div className="text-center">
                    <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3"
                      style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5)" }}>
                      <Mail className="w-7 h-7 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 mb-1">{t("almost_done")}</h2>
                    <p className="text-sm text-gray-500">
                      {t("draft_saved_offer_desc")}
                    </p>
                  </div>
                  <div>
                    <input
                      type="email"
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-400 outline-none text-sm font-medium placeholder:text-gray-400"
                      placeholder={t("email_placeholder")}
                      value={draftEmail}
                      onChange={(e) => { setDraftEmail(e.target.value); setDraftError(""); }}
                      dir="ltr"
                      autoComplete="email"
                      disabled={isDraftLoading}
                      onKeyDown={(e) => e.key === "Enter" && handleSendEmailLink()}
                    />
                    {draftError && (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {draftError}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div
                key="checkEmail"
                variants={fadeVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-white rounded-3xl overflow-hidden"
                style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.05)" }}
              >
                <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #059669, #34d399)" }} />
                <div className="p-5 flex flex-col items-center gap-4 py-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                    <span className="text-3xl">📧</span>
                  </div>
                  <h2 className="text-xl font-black text-gray-900">{t("check_email_title")}</h2>
                  <p className="text-sm text-gray-500 max-w-xs">
                    {t("check_email_draft_desc", { email: draftEmail })}
                  </p>
                  <p className="text-xs text-gray-400">{t("check_email_hint")}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Bottom nav ──────────────────────────────────────────────────── */}
        <div className="shrink-0 px-4 pt-3 pb-4 bg-white border-t border-slate-100 flex flex-col gap-2.5">
          {createPost.isError && step === 4 && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-2xl px-3.5 py-2.5 font-medium">
              <XCircle className="w-4 h-4 shrink-0" />
              {t("submit_error")}
            </div>
          )}
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => go(step - 1)}
                className="w-12 h-12 rounded-2xl border-2 border-slate-200 bg-white flex items-center justify-center text-gray-500 hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95 shrink-0"
              >
                {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            )}
            <button
              className="flex-1 h-12 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                boxShadow: "0 4px 16px rgba(5,150,105,0.40)",
              }}
              onClick={step === 5 ? handleSendEmailLink : step === 4 ? handleSubmit : () => go(step + 1)}
              disabled={createPost.isPending || isDraftLoading || step === 6}
            >
              {(createPost.isPending || isDraftLoading) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {step === 5 ? t("sending", "Sending...") : t("submit")}
                </>
              ) : step === 6 ? (
                t("done")
              ) : step === 5 ? (
                <>
                  {t("send_sign_in_link")}
                  <Mail className="w-4 h-4" />
                </>
              ) : step === 4 ? (
                t("submit")
              ) : (
                <>
                  {t("next")}
                  {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

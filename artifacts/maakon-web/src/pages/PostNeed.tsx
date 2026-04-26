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
  Info,
  XCircle,
  Check,
  ArrowRight,
  ArrowLeft,
  Mail,
  Loader2,
  Utensils,
  Home,
  Shirt,
  HeartPulse,
  Droplets,
  Car,
  Brain,
  Scale,
  GraduationCap,
  HeartHandshake,
  Coins,
  Truck,
  Package,
  User,
  Building2,
  AlertTriangle,
  Clock,
  ClipboardList
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createDraftPost } from "@/lib/auth-api";
import { supabase } from "@/lib/supabase";

// ── Constants ──────────────────────────────────────────────────────────────

const EXPIRY_PRESETS = [
  { key: "expiry_1d", days: 1 },
  { key: "expiry_3d", days: 3 },
  { key: "expiry_1w", days: 7 },
  { key: "expiry_1m", days: 30 },
] as const;

const PROVIDERS = ["individual", "ngo"] as const;

const PROVIDER_CONFIG: Record<string, { icon: any; label: string; desc: string }> = {
  individual: { icon: User, label: "Individual", desc: "I am a person needing help" },
  ngo:        { icon: Building2, label: "NGO / Organization", desc: "We are an org needing volunteers" },
};

const URGENCIES = ["critical", "high", "medium", "low"] as const;

const URGENCY_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  critical: { color: "#ef4444", bg: "#fef2f2", border: "#fca5a5", icon: AlertTriangle },
  high:     { color: "#f97316", bg: "#fff7ed", border: "#fdba74", icon: AlertCircle },
  medium:   { color: "#3b82f6", bg: "#eff6ff", border: "#93c5fd", icon: ClipboardList },
  low:      { color: "#6b7280", bg: "#f9fafb", border: "#d1d5db", icon: Clock },
};

const CATEGORY_ICONS: Record<string, any> = {
  food: Utensils,
  shelter: Home,
  clothing: Shirt,
  medical: HeartPulse,
  water: Droplets,
  transportation: Car,
  psychological: Brain,
  psychosocial: Brain,
  legal: Scale,
  financial: Coins,
  education: GraduationCap,
  volunteers: HeartHandshake,
  logistics: Truck,
  other: Package,
};

const fadeVariants = {
  enter: { opacity: 0, y: 14 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

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

export default function PostNeed() {
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
  const [formData, setFormData] = useState<Partial<CreatePostInput>>({
    postType: "need",
    contactMethod: "phone",
  });
  const [countryCode, setCountryCode] = useState("+961");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [ngoData, setNgoData] = useState({
    ngoName: "",
    contactPerson: "",
    volunteersNeeded: "",
    shortDescription: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [draftEmail, setDraftEmail] = useState("");
  const [draftError, setDraftError] = useState("");
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [draftToken, setDraftToken] = useState<string | null>(null);

  const patch = (data: Partial<CreatePostInput>) => setFormData((p) => ({ ...p, ...data }));
  const patchNgo = (data: Partial<typeof ngoData>) => setNgoData((p) => ({ ...p, ...data }));

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    const isNgo = formData.providerType === "ngo";

    if (s === 1) {
      if (!formData.providerType) e.providerType = t("required");
    }
    if (s === 2) {
      if (isNgo) {
        if (!ngoData.ngoName || ngoData.ngoName.length < 2) e.ngoName = t("required");
        if (!ngoData.volunteersNeeded) e.volunteersNeeded = t("required");
        if (!ngoData.shortDescription || ngoData.shortDescription.length < 10) e.shortDescription = t("min_length", { min: 10 });
      } else {
        if (!formData.category) e.category = t("required");
        if (!formData.urgency) e.urgency = t("required");
        if (!formData.title || formData.title.length < 3) e.title = t("min_length", { min: 3 });
        if (!formData.description || formData.description.length < 10) e.description = t("min_length", { min: 10 });
      }
    }
    if (s === 3) {
      if (!formData.governorate) e.governorate = t("required");
      if (!expiresInDays) e.expiresInDays = t("required");
      if (isNgo && !ngoData.contactPerson) e.contactPerson = t("required");
      
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

  const buildFinalData = () => {
    const isPhoneContact = ["phone", "whatsapp", "signal"].includes(formData.contactMethod || "");
    const parsedContactInfo = isPhoneContact ? `${countryCode} ${phoneNumber.trim()}` : formData.contactInfo!;

    if (formData.providerType === "ngo") {
      return {
        ...formData,
        category: "volunteers",
        title: ngoData.ngoName,
        description: `Volunteers Needed: ${ngoData.volunteersNeeded}\n\nDescription: ${ngoData.shortDescription}\n\nNotes: ${ngoData.notes}`,
        contactInfo: `${ngoData.contactPerson} - ${parsedContactInfo}`,
        expiresInDays: expiresInDays!
      } as CreatePostInput;
    }
    return {
      ...(formData as CreatePostInput),
      contactInfo: parsedContactInfo,
      expiresInDays: expiresInDays!
    } as CreatePostInput;
  };

  const handleSubmit = async () => {
    if (!validate(3)) return;
    const finalData = buildFinalData();

    if (isAuthenticated) {
      // Authenticated user — create post directly
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
      // Unauthenticated user — create draft and move to email step
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
        });
        setDraftToken(draft.draftToken);
        setDir(1);
        setStep(4); // Go to email sign-in step
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
      setStep(5); // Show "check your email" confirmation
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
            style={{ background: "linear-gradient(135deg, #ed1c24, #ff4d4d)" }}
          >
            {t("view_map")}
          </button>
        </motion.div>
      </div>
    );
  }

  // Auth gate removed — individuals can fill form first, then sign in on submit

  // ── Form ─────────────────────────────────────────────────────────────────

  const isNgo = formData.providerType === "ngo";

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-slate-50" dir={isRtl ? "rtl" : "ltr"}>
      <TopNav title={t("post_need_title")} showBack />
      {/* Spacer to push content below the fixed navbar */}
      <div className="h-16 sm:h-20 shrink-0" />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Accent header strip ─────────────────────────────────────────── */}
        <div
          className="shrink-0 px-5 pt-4 pb-5"
          style={{ background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)" }}
        >
          {/* Stepper */}
          <div className="flex items-center">
            {[1, 2, 3].map((num, i) => (
              <div key={num} className={`flex items-center ${i < 2 ? "flex-1" : ""}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all duration-300 ${
                    step > num
                      ? "bg-white text-red-600"
                      : step === num
                      ? "bg-white text-red-600 ring-4 ring-white/30"
                      : "bg-white/20 text-white border-2 border-white/40"
                  }`}
                >
                  {step > num ? <Check className="w-4 h-4" /> : num}
                </div>
                {i < 2 && (
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
              className="bg-white rounded-3xl shadow-lg overflow-hidden"
              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.05)" }}
            >
              <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #dc2626, #f87171)" }} />

              <div className="p-5 flex flex-col gap-5">

                {/* ── Step 1: Provider Selection ───────────────────────────── */}
                {step === 1 && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 mb-0.5">{t("who_requesting_help")}</h2>
                      <p className="text-sm text-gray-400">{t("who_requesting_help_desc")}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {PROVIDERS.map((prov) => {
                        const selected = formData.providerType === prov;
                        return (
                          <button
                            key={prov}
                            type="button"
                            onClick={() => patch({ providerType: prov, category: undefined })}
                            className="p-4 rounded-2xl text-start flex items-center gap-4 transition-all duration-150 active:scale-95 border-2"
                            style={
                              selected
                                ? {
                                    background: "linear-gradient(135deg, #dc2626, #ef4444)",
                                    borderColor: "transparent",
                                    color: "white",
                                    boxShadow: "0 4px 12px rgba(220,38,38,0.35)",
                                  }
                                : {
                                    background: "#f8fafc",
                                    borderColor: "#e2e8f0",
                                    color: "#374151",
                                  }
                            }
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${selected ? 'bg-white/20' : 'bg-red-50'}`}>
                              {(() => {
                                const Icon = PROVIDER_CONFIG[prov as keyof typeof PROVIDER_CONFIG].icon;
                                return <Icon className={selected ? "text-white" : "text-red-600"} />;
                              })()}
                            </div>
                            <div className="flex flex-col text-start">
                              <span className="font-bold text-lg">
                                {t(prov === "individual" ? "account_individual" : "account_ngo")}
                              </span>
                              <span className={`text-xs font-medium ${selected ? "text-red-100" : "text-slate-400"}`}>
                                {t(prov === "individual" ? "indiv_need_desc" : "ngo_need_desc")}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <FieldError msg={errors.providerType} />
                  </div>
                )}

                {/* ── Step 2: Individual ─────────────────────────────────── */}
                {step === 2 && !isNgo && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 mb-0.5">{t("step_2_desc")}</h2>
                      <p className="text-sm text-gray-400">{t("what_do_you_need_help_with")}</p>
                    </div>

                    <div>
                       <FieldLabel>{t("category")}</FieldLabel>
                       <div className="grid grid-cols-2 gap-2.5">
                        {metadata?.categories.filter(c => c !== 'volunteers').map((cat) => {
                          const selected = formData.category === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => patch({ category: cat })}
                              className="py-3 px-3 rounded-2xl font-semibold text-sm flex items-center gap-3 transition-all duration-150 active:scale-95 border-2"
                              style={
                                selected
                                  ? {
                                      background: "linear-gradient(135deg, #dc2626, #ef4444)",
                                      borderColor: "transparent",
                                      color: "white",
                                      boxShadow: "0 4px 12px rgba(220,38,38,0.35)",
                                    }
                                  : {
                                      background: "#f8fafc",
                                      borderColor: "#e2e8f0",
                                      color: "#374151",
                                    }
                              }
                            >
                              <div className={`p-1.5 rounded-lg ${selected ? 'bg-white/20' : 'bg-red-50 text-red-600'}`}>
                                {(() => {
                                  const Icon = CATEGORY_ICONS[cat] || Package;
                                  return <Icon className="w-4 h-4" />;
                                })()}
                              </div>
                              <span className="truncate">{t(cat)}</span>
                            </button>
                          );
                        })}
                      </div>
                      <FieldError msg={errors.category} />
                    </div>

                    <div>
                      <FieldLabel>{t("urgency")}</FieldLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {URGENCIES.map((urg) => {
                          const cfg = URGENCY_CONFIG[urg];
                          const selected = formData.urgency === urg;
                          return (
                            <button
                              key={urg}
                              type="button"
                              onClick={() => patch({ urgency: urg })}
                              className="py-3 px-3 rounded-2xl font-semibold text-sm flex flex-col items-center gap-2 transition-all duration-150 active:scale-95 border-2"
                              style={
                                selected
                                  ? {
                                      background: cfg.color,
                                      borderColor: "transparent",
                                      color: "white",
                                      boxShadow: `0 4px 12px ${cfg.color}40`,
                                    }
                                  : { background: cfg.bg, borderColor: cfg.border, color: cfg.color }
                              }
                            >
                              <div className={`p-1.5 rounded-lg ${selected ? 'bg-white/20' : 'bg-white/40'}`}>
                                {(() => {
                                  const Icon = cfg.icon;
                                  return <Icon className="w-4 h-4" />;
                                })()}
                              </div>
                              <span className="text-xs font-bold uppercase tracking-wider">{t(urg)}</span>
                            </button>
                          );
                        })}
                      </div>
                      <FieldError msg={errors.urgency} />
                    </div>

                    <div>
                      <FieldLabel>{t("title_label")}</FieldLabel>
                      <input
                        type="text"
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 outline-none text-sm font-medium placeholder:text-gray-400"
                        placeholder={t("title_placeholder_need")}
                        value={formData.title ?? ""}
                        onChange={(e) => patch({ title: e.target.value })}
                      />
                      <FieldError msg={errors.title} />
                    </div>

                    <div>
                      <FieldLabel>{t("desc_label")}</FieldLabel>
                      <textarea
                        rows={3}
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 outline-none resize-none text-sm font-medium placeholder:text-gray-400"
                        placeholder={t("desc_placeholder_need")}
                        value={formData.description ?? ""}
                        onChange={(e) => patch({ description: e.target.value })}
                      />
                      <FieldError msg={errors.description} />
                    </div>
                  </div>
                )}

                {/* ── Step 2: NGO ────────────────────────────────────────── */}
                {step === 2 && isNgo && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 mb-0.5">{t("ngo_details_title")}</h2>
                      <p className="text-sm text-gray-400">{t("ngo_details_desc")}</p>
                    </div>

                    <div>
                      <FieldLabel>{t("ngo_initiative_name")}</FieldLabel>
                      <input
                        type="text"
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 outline-none text-sm font-medium placeholder:text-gray-400"
                        placeholder={t("ngo_initiative_ph")}
                        value={ngoData.ngoName}
                        onChange={(e) => patchNgo({ ngoName: e.target.value })}
                      />
                      <FieldError msg={errors.ngoName} />
                    </div>

                    <div>
                      <FieldLabel>{t("volunteers_needed")}</FieldLabel>
                      <input
                        type="text"
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 outline-none text-sm font-medium placeholder:text-gray-400"
                        placeholder={t("volunteers_ph")}
                        value={ngoData.volunteersNeeded}
                        onChange={(e) => patchNgo({ volunteersNeeded: e.target.value })}
                      />
                      <FieldError msg={errors.volunteersNeeded} />
                    </div>

                    <div>
                      <FieldLabel>{t("short_description_activity")}</FieldLabel>
                      <textarea
                        rows={3}
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 outline-none resize-none text-sm font-medium placeholder:text-gray-400"
                        placeholder={t("activity_desc_ph")}
                        value={ngoData.shortDescription}
                        onChange={(e) => patchNgo({ shortDescription: e.target.value })}
                      />
                      <FieldError msg={errors.shortDescription} />
                    </div>

                    <div>
                      <FieldLabel>{t("optional_notes")}</FieldLabel>
                      <textarea
                        rows={2}
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 outline-none resize-none text-sm font-medium placeholder:text-gray-400"
                        placeholder={t("optional_notes_ph")}
                        value={ngoData.notes}
                        onChange={(e) => patchNgo({ notes: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* ── Step 3: Location, Contact & Expiry ──────────────────── */}
                {step === 3 && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 mb-0.5">{t("step_3_loc")}</h2>
                      <p className="text-sm text-gray-400">{t("where_located_contact")}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                       <div>
                         <FieldLabel>{t("governorate")}</FieldLabel>
                         <select
                           className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 outline-none text-sm font-medium text-gray-700"
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
                           <FieldLabel>{t("district")}</FieldLabel>
                           <select
                             className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 outline-none text-sm font-medium text-gray-700"
                             value={formData.district ?? ""}
                             onChange={(e) => patch({ district: e.target.value })}
                           >
                             <option value="" disabled>{t("select_placeholder")}</option>
                             {metadata.districts[formData.governorate].map((d) => <option key={d} value={d}>{t(d)}</option>)}
                           </select>
                         </div>
                       ) : null}
                     </div>
                     
                     <div className="rounded-2xl p-4" style={{ background: "#fef2f2", border: "1.5px solid #fecaca" }}>
                       <div className="flex gap-2.5">
                         <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                         <div className="flex-1">
                           <p className="text-xs font-bold text-red-800 mb-0.5">
                             {isNgo ? t("exact_org_address") : t("exact_address")}
                           </p>
                           <p className="text-xs text-red-600/80 mb-2.5">
                             {isNgo ? t("ngo_exact_map_desc") : t("exact_address_private")}
                           </p>
                           <input
                             type="text"
                             className="w-full px-3 py-2.5 rounded-xl bg-white border border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-400/15 outline-none text-sm"
                             placeholder={t("address_placeholder")}
                             value={formData.exactAddressPrivate ?? ""}
                             onChange={(e) => patch({ exactAddressPrivate: e.target.value })}
                           />
                         </div>
                       </div>
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
                                    background: "linear-gradient(135deg, #dc2626, #ef4444)",
                                    borderColor: "transparent",
                                    color: "white",
                                    boxShadow: "0 3px 10px rgba(220,38,38,0.35)",
                                  }
                                : { background: "#f8fafc", borderColor: "#e2e8f0", color: "#6b7280" }
                            }
                          >
                            {t(key)}
                          </button>
                        ))}
                      </div>
                      <FieldError msg={errors.expiresInDays} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {isNgo && (
                        <div className="sm:col-span-2">
                          <FieldLabel>{t("contact_person_name")}</FieldLabel>
                          <input
                            type="text"
                            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 outline-none text-sm font-medium placeholder:text-gray-400"
                            placeholder={t("contact_person_ph")}
                            value={ngoData.contactPerson}
                            onChange={(e) => patchNgo({ contactPerson: e.target.value })}
                          />
                          <FieldError msg={errors.contactPerson} />
                        </div>
                      )}

                      <div>
                        <FieldLabel>{t("contact_method")}</FieldLabel>
                        <select
                          className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 outline-none text-sm font-medium text-gray-700"
                          value={formData.contactMethod ?? ""}
                          onChange={(e) => patch({ contactMethod: e.target.value })}
                        >
                          <option value="" disabled>{t("select_placeholder")}</option>
                          {metadata?.contactMethods.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div>
                        <FieldLabel>{t("contact_info")}</FieldLabel>
                        {["phone", "whatsapp", "signal"].includes(formData.contactMethod || "") ? (
                          <div className="flex gap-2">
                            <select
                              className="px-2 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 outline-none text-sm font-bold text-gray-700 w-[100px] sm:w-[110px] shrink-0"
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
                              <option value="other">{t("other")}</option>
                            </select>
                            <input
                              type="tel"
                              className="flex-1 w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 outline-none text-sm font-medium placeholder:text-gray-400"
                              placeholder="e.g. 70 123 456"
                              dir="ltr"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s]/g, ""))}
                            />
                          </div>
                        ) : (
                          <input
                            type={formData.contactMethod === "email" ? "email" : "text"}
                            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 outline-none text-sm font-medium placeholder:text-gray-400"
                            placeholder={formData.contactMethod === "email" ? "you@example.com" : t("contact_info")}
                            dir="ltr"
                            value={formData.contactInfo ?? ""}
                            onChange={(e) => patch({ contactInfo: e.target.value })}
                          />
                        )}
                        <FieldError msg={errors.contactInfo} />
                      </div>
                    </div>

                  </div>
                )}

                {/* ── Step 4: Email Sign-In (unauthenticated draft) ────────── */}
                {step === 4 && (
                  <div className="flex flex-col gap-5">
                    <div className="text-center">
                      <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3"
                        style={{ background: "linear-gradient(135deg, #fef2f2, #fee2e2)" }}>
                        <Mail className="w-7 h-7 text-red-600" />
                      </div>
                      <h2 className="text-xl font-black text-gray-900 mb-1">{t("almost_done")}</h2>
                      <p className="text-sm text-gray-500">
                        {t("draft_saved_desc")}
                      </p>
                    </div>

                    <div>
                      <input
                        type="email"
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 outline-none text-sm font-medium placeholder:text-gray-400"
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
                )}

                {/* ── Step 5: Check Email Confirmation ──────────────────────── */}
                {step === 5 && (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                      <span className="text-3xl">📧</span>
                    </div>
                    <h2 className="text-xl font-black text-gray-900">{t("check_email_title")}</h2>
                    <p className="text-sm text-gray-500 max-w-xs">
                      {t("check_email_draft_desc", { email: draftEmail })}
                    </p>
                    <p className="text-xs text-gray-400">{t("check_email_hint")}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Bottom nav ──────────────────────────────────────────────────── */}
        <div className="shrink-0 px-4 pt-3 pb-4 bg-white border-t border-slate-100 flex flex-col gap-2.5">
          {createPost.isError && step === 3 && (
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
                aria-label={t("back", "Back")}
              >
                {isRtl ? <ChevronRight className="w-5 h-5" aria-hidden="true" /> : <ChevronLeft className="w-5 h-5" aria-hidden="true" />}
              </button>
            )}
            <button
              className="flex-1 h-12 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
                boxShadow: "0 4px 16px rgba(220,38,38,0.4)",
              }}
              onClick={step === 4 ? handleSendEmailLink : step === 3 ? handleSubmit : () => go(step + 1)}
              disabled={createPost.isPending || isDraftLoading || step === 5}
            >
              {(createPost.isPending || isDraftLoading) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {step === 4 ? t("sending", "Sending...") : t("submit")}
                </>
              ) : step === 5 ? (
                t("done", "Done")
              ) : step === 4 ? (
                <>
                  {t("send_sign_in_link", "Send Sign-In Link")}
                  <Mail className="w-4 h-4" />
                </>
              ) : step === 3 ? (
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

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TopNav } from "@/components/layout/TopNav";
import { useCreatePost, useGetMetadata, getListPostsQueryKey } from "@workspace/api-client-react";
import type { CreatePostInput } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
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
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────

const EXPIRY_PRESETS = [
  { key: "expiry_1d", days: 1 },
  { key: "expiry_3d", days: 3 },
  { key: "expiry_1w", days: 7 },
  { key: "expiry_1m", days: 30 },
] as const;

const URGENCIES = ["critical", "high", "medium", "low"] as const;

const URGENCY_CONFIG = {
  critical: { color: "#ef4444", bg: "#fef2f2", border: "#fca5a5", label: "🚨" },
  high:     { color: "#f97316", bg: "#fff7ed", border: "#fdba74", label: "⚠️" },
  medium:   { color: "#3b82f6", bg: "#eff6ff", border: "#93c5fd", label: "📋" },
  low:      { color: "#6b7280", bg: "#f9fafb", border: "#d1d5db", label: "🕐" },
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
  other: "📦",
};

const fadeVariants = {
  enter: { opacity: 0, y: 14 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// ── Sub-components ─────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold text-foreground/60 uppercase tracking-wider mb-2">
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

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [formData, setFormData] = useState<Partial<CreatePostInput>>({
    postType: "need",
    urgency: "medium",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const patch = (data: Partial<CreatePostInput>) =>
    setFormData((p) => ({ ...p, ...data }));

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1 && !formData.category) e.category = t("required");
    if (s === 2) {
      if (!formData.title || formData.title.length < 3) e.title = t("min_length", { min: 3 });
      if (!formData.description || formData.description.length < 10)
        e.description = t("min_length", { min: 10 });
    }
    if (s === 3 && !formData.governorate) e.governorate = t("required");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const go = (next: number) => {
    if (validate(step)) { setDir(next > step ? 1 : -1); setStep(next); }
  };

  const handleSubmit = () => {
    if (!validate(3)) return;
    createPost.mutate(
      { data: { ...(formData as CreatePostInput), expiresInDays } },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
          setIsSuccess(true);
        },
      }
    );
  };

  // ── Success ──────────────────────────────────────────────────────────────

  if (isSuccess) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center p-6 text-center"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)" }}>
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
            style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}
          >
            {t("view_map")}
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-slate-50">
      <TopNav title={t("post_need_title")} showBack />

      <div className="flex-1 flex flex-col overflow-hidden pt-14">

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
              {/* Card header accent line */}
              <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #dc2626, #f87171)" }} />

              <div className="p-5 flex flex-col gap-5">

                {/* ── Step 1 ──────────────────────────────────────────────── */}
                {step === 1 && (
                  <>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 mb-0.5">{t("step_1_need")}</h2>
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
                            <span className="text-lg leading-none">{CATEGORY_ICONS[cat] ?? "📦"}</span>
                            <span className="truncate">{t(cat)}</span>
                          </button>
                        );
                      })}
                    </div>
                    <FieldError msg={errors.category} />

                    {/* Urgency */}
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
                              className="py-3 px-3 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all duration-150 active:scale-95 border-2"
                              style={
                                selected
                                  ? {
                                      background: cfg.color,
                                      borderColor: "transparent",
                                      color: "white",
                                      boxShadow: `0 4px 12px ${cfg.color}55`,
                                    }
                                  : {
                                      background: cfg.bg,
                                      borderColor: cfg.border,
                                      color: cfg.color,
                                    }
                              }
                            >
                              <span className="text-base leading-none">{cfg.label}</span>
                              <span>{t(urg)}</span>
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
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 focus:ring-4 focus:ring-red-400/10 transition-all outline-none text-sm font-medium placeholder:text-gray-400"
                        placeholder={t("title_placeholder_need")}
                        value={formData.title ?? ""}
                        onChange={(e) => patch({ title: e.target.value })}
                      />
                      <FieldError msg={errors.title} />
                    </div>

                    <div>
                      <FieldLabel>{t("desc_label")}</FieldLabel>
                      <textarea
                        rows={6}
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 focus:ring-4 focus:ring-red-400/10 transition-all outline-none resize-none text-sm font-medium placeholder:text-gray-400"
                        placeholder={t("desc_placeholder_need")}
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

                    {/* Location */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <select
                          className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 outline-none text-sm font-medium text-gray-700"
                          value={formData.governorate ?? ""}
                          onChange={(e) => patch({ governorate: e.target.value, district: "" })}
                        >
                          <option value="" disabled>{t("select_placeholder")}</option>
                          {metadata?.governorates.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                        <FieldError msg={errors.governorate} />
                      </div>
                      {formData.governorate && metadata?.districts[formData.governorate]?.length ? (
                        <div>
                          <select
                            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 outline-none text-sm font-medium text-gray-700"
                            value={formData.district ?? ""}
                            onChange={(e) => patch({ district: e.target.value })}
                          >
                            <option value="" disabled>{t("select_placeholder")}</option>
                            {metadata.districts[formData.governorate].map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                    </div>

                    {/* Private address */}
                    <div className="rounded-2xl p-4" style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe" }}>
                      <div className="flex gap-2.5">
                        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-blue-800 mb-0.5">{t("exact_address")}</p>
                          <p className="text-xs text-blue-600/80 mb-2.5">{t("exact_address_private")}</p>
                          <input
                            type="text"
                            className="w-full px-3 py-2.5 rounded-xl bg-white border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15 outline-none text-sm"
                            placeholder={t("address_placeholder")}
                            value={formData.exactAddressPrivate ?? ""}
                            onChange={(e) => patch({ exactAddressPrivate: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expiry */}
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
                    </div>

                    {/* Contact */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel>{t("contact_method")}</FieldLabel>
                        <select
                          className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 outline-none text-sm font-medium text-gray-700"
                          value={formData.contactMethod ?? ""}
                          onChange={(e) => patch({ contactMethod: e.target.value })}
                        >
                          <option value="" disabled>{t("select_placeholder")}</option>
                          {metadata?.contactMethods.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <FieldLabel>{t("contact_info")}</FieldLabel>
                        <input
                          type="text"
                          className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 outline-none text-sm font-medium"
                          placeholder={t("phone_placeholder")}
                          dir="ltr"
                          value={formData.contactInfo ?? ""}
                          onChange={(e) => patch({ contactInfo: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
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
              >
                {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            )}
            <button
              className="flex-1 h-12 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
                boxShadow: "0 4px 16px rgba(220,38,38,0.4)",
              }}
              onClick={step === 3 ? handleSubmit : () => go(step + 1)}
              disabled={createPost.isPending}
            >
              {createPost.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {t("submit")}
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

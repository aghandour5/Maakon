import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TopNav } from "@/components/layout/TopNav";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

const EXPIRY_PRESETS = [
  { key: "expiry_1d", days: 1 },
  { key: "expiry_3d", days: 3 },
  { key: "expiry_1w", days: 7 },
  { key: "expiry_1m", days: 30 },
] as const;

const URGENCIES = ["critical", "high", "medium", "low"] as const;

const fadeVariants = {
  enter: { opacity: 0, y: 10 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-foreground mb-2">
      {children}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-destructive text-xs mt-1.5 flex items-center gap-1">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {msg}
    </p>
  );
}

export default function PostNeed() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: metadata } = useGetMetadata();
  const createPost = useCreatePost();

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [formData, setFormData] = useState<Partial<CreatePostInput>>({
    postType: "need",
    urgency: "medium",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const patch = (data: Partial<CreatePostInput>) =>
    setFormData((prev) => ({ ...prev, ...data }));

  const validateStep = (s: number) => {
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
    if (validateStep(step)) {
      setDir(next > step ? 1 : -1);
      setStep(next);
    }
  };

  const handleSubmit = () => {
    if (!validateStep(3)) return;
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

  if (isSuccess) {
    return (
      <div className="h-dvh bg-background flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="bg-card p-8 rounded-3xl shadow-xl max-w-sm w-full flex flex-col items-center border border-border"
        >
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{t("success_title")}</h2>
          <p className="text-muted-foreground text-sm mb-8">{t("success_desc")}</p>
          <Button className="w-full h-12 text-base font-semibold bg-primary" onClick={() => setLocation("/map")}>
            {t("view_map")}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-secondary/30 flex flex-col overflow-hidden">
      <TopNav title={t("post_need_title")} showBack />

      <div className="flex-1 flex flex-col overflow-hidden pt-16">
        {/* ── Stepper ─────────────────────────────────────────────────── */}
        <div className="shrink-0 px-5 pt-4 pb-3">
          <div className="flex items-center gap-0">
            {[1, 2, 3].map((num, i) => (
              <div key={num} className={`flex items-center ${i < 2 ? "flex-1" : ""}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all duration-300 ${
                    step > num
                      ? "bg-primary text-primary-foreground"
                      : step === num
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-background border-2 border-border text-muted-foreground"
                  }`}
                >
                  {step > num ? <Check className="w-4 h-4" /> : num}
                </div>
                {i < 2 && (
                  <div className="flex-1 h-0.5 mx-1 rounded-full overflow-hidden bg-border">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: step > num + 1 ? "100%" : step > num ? "50%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Scrollable step content ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={fadeVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="bg-card rounded-2xl shadow-sm border border-border p-5 flex flex-col gap-5 mb-2"
            >
              {/* ── Step 1 ─────────────────────────────────────────────── */}
              {step === 1 && (
                <>
                  <h2 className="text-xl font-bold text-foreground">{t("step_1_need")}</h2>

                  <div>
                    <FieldLabel>{t("category")}</FieldLabel>
                    <div className="grid grid-cols-2 gap-2.5">
                      {metadata?.categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => patch({ category: cat })}
                          className={`py-3 px-3 rounded-xl text-sm font-medium transition-all duration-150 border-2 active:scale-95 ${
                            formData.category === cat
                              ? "border-primary bg-primary/8 text-primary shadow-sm"
                              : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-secondary/60"
                          }`}
                        >
                          {t(cat)}
                        </button>
                      ))}
                    </div>
                    <FieldError msg={errors.category} />
                  </div>

                  <div>
                    <FieldLabel>{t("urgency")}</FieldLabel>
                    <div className="grid grid-cols-4 gap-2">
                      {URGENCIES.map((urg) => (
                        <button
                          key={urg}
                          type="button"
                          onClick={() => patch({ urgency: urg })}
                          className={`py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 border-2 active:scale-95 ${
                            formData.urgency === urg
                              ? urg === "critical"
                                ? "border-destructive bg-destructive/10 text-destructive"
                                : "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          {t(urg)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── Step 2 ─────────────────────────────────────────────── */}
              {step === 2 && (
                <>
                  <h2 className="text-xl font-bold text-foreground">{t("step_2_desc")}</h2>

                  <div>
                    <FieldLabel>{t("title_label")}</FieldLabel>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm"
                      placeholder={t("title_placeholder_need")}
                      value={formData.title ?? ""}
                      onChange={(e) => patch({ title: e.target.value })}
                    />
                    <FieldError msg={errors.title} />
                  </div>

                  <div>
                    <FieldLabel>{t("desc_label")}</FieldLabel>
                    <textarea
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none text-sm"
                      placeholder={t("desc_placeholder_need")}
                      value={formData.description ?? ""}
                      onChange={(e) => patch({ description: e.target.value })}
                    />
                    <FieldError msg={errors.description} />
                  </div>
                </>
              )}

              {/* ── Step 3 ─────────────────────────────────────────────── */}
              {step === 3 && (
                <>
                  <h2 className="text-xl font-bold text-foreground">{t("step_3_loc")}</h2>

                  {/* Location */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <FieldLabel>{t("governorate")}</FieldLabel>
                      <select
                        className="w-full px-3 py-3 rounded-xl bg-background border-2 border-border focus:border-primary outline-none text-sm"
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
                        <FieldLabel>{t("district")}</FieldLabel>
                        <select
                          className="w-full px-3 py-3 rounded-xl bg-background border-2 border-border focus:border-primary outline-none text-sm"
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
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                    <div className="flex gap-2.5">
                      <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-blue-800 mb-0.5">{t("exact_address")}</p>
                        <p className="text-xs text-blue-700/80 mb-2">{t("exact_address_private")}</p>
                        <input
                          type="text"
                          className="w-full px-3 py-2.5 rounded-lg bg-white border border-blue-200 focus:border-blue-400 outline-none text-sm"
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
                          className={`py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 border-2 active:scale-95 ${
                            expiresInDays === days
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground hover:border-primary/30"
                          }`}
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
                        className="w-full px-3 py-3 rounded-xl bg-background border-2 border-border focus:border-primary outline-none text-sm"
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
                        className="w-full px-3 py-3 rounded-xl bg-background border-2 border-border focus:border-primary outline-none text-sm"
                        placeholder={t("phone_placeholder")}
                        dir="ltr"
                        value={formData.contactInfo ?? ""}
                        onChange={(e) => patch({ contactInfo: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Bottom nav ──────────────────────────────────────────────────── */}
        <div className="shrink-0 px-4 pt-3 pb-4 border-t border-border/40 bg-secondary/30 flex flex-col gap-2">
          {createPost.isError && step === 3 && (
            <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/8 border border-destructive/20 rounded-xl px-3 py-2">
              <XCircle className="w-4 h-4 shrink-0" />
              {t("submit_error")}
            </div>
          )}
          <div className="flex gap-3">
            {step > 1 && (
              <Button
                variant="outline"
                className="h-12 w-12 rounded-2xl border-2 shrink-0"
                onClick={() => go(step - 1)}
              >
                {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </Button>
            )}
            <Button
              className="h-12 flex-1 rounded-2xl text-base font-bold bg-primary hover:bg-primary/90 transition-colors"
              onClick={step === 3 ? handleSubmit : () => go(step + 1)}
              disabled={createPost.isPending}
            >
              {createPost.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {t("submit")}
                </span>
              ) : step === 3 ? (
                t("submit")
              ) : (
                t("next")
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

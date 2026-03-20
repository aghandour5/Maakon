import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TopNav } from "@/components/layout/TopNav";
import { Button } from "@/components/ui/button";
import { useCreatePost, useGetMetadata, getListPostsQueryKey } from "@workspace/api-client-react";
import type { CreatePostInput } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { CheckCircle2, ChevronLeft, ChevronRight, AlertCircle, XCircle } from "lucide-react";

// Expiry preset options: label key → days
const EXPIRY_PRESETS = [
  { key: 'expiry_1d', days: 1 },
  { key: 'expiry_3d', days: 3 },
  { key: 'expiry_1w', days: 7 },
  { key: 'expiry_1m', days: 30 },
] as const;

export default function PostOffer() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: metadata } = useGetMetadata();
  const createPost = useCreatePost();

  const [step, setStep] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [formData, setFormData] = useState<Partial<CreatePostInput>>({
    postType: 'offer',
    providerType: 'individual',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!formData.category) newErrors.category = t('required');
    }
    if (currentStep === 2) {
      if (!formData.title || formData.title.length < 3) newErrors.title = t('min_length', { min: 3 });
      if (!formData.description || formData.description.length < 10) newErrors.description = t('min_length', { min: 10 });
    }
    if (currentStep === 3) {
      if (!formData.governorate) newErrors.governorate = t('required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(prev => prev + 1);
  };

  const handleSubmit = () => {
    if (!validateStep(3)) return;
    createPost.mutate(
      { data: { ...(formData as CreatePostInput), expiresInDays } },
      {
        onSuccess: async () => {
          // Invalidate the map's posts cache so the new post appears immediately
          await queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
          setIsSuccess(true);
        },
      }
    );
  };

  // ── Success screen ──────────────────────────────────────────────────────────

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card p-8 rounded-3xl shadow-xl max-w-sm w-full flex flex-col items-center border border-border"
        >
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{t('success_title')}</h2>
          <p className="text-muted-foreground mb-8">{t('success_desc')}</p>
          <Button
            className="w-full h-12 text-lg hover-elevate bg-success hover:bg-success/90 text-success-foreground"
            onClick={() => setLocation('/map')}
          >
            {t('view_map')}
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Slide animation ─────────────────────────────────────────────────────────

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? (isRtl ? -100 : 100) : (isRtl ? 100 : -100),
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir < 0 ? (isRtl ? -100 : 100) : (isRtl ? 100 : -100),
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-success/5 flex flex-col">
      <TopNav title={t('post_offer_title')} showBack />

      <main className="flex-1 mt-16 w-full max-w-lg mx-auto p-4 sm:p-6 flex flex-col">

        {/* Progress Bar */}
        <div className="mb-8 px-2">
          <div className="flex justify-between items-center mb-2">
            {[1, 2, 3].map(num => (
              <div
                key={num}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                  step >= num
                    ? 'bg-success text-success-foreground shadow-md'
                    : 'bg-secondary border-2 border-border text-muted-foreground'
                }`}
              >
                {num}
              </div>
            ))}
          </div>
          <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="absolute top-0 bottom-0 bg-success transition-all duration-500 ease-out"
              style={{
                width: `${((step - 1) / 2) * 100}%`,
                left: isRtl ? 'auto' : 0,
                right: isRtl ? 0 : 'auto',
              }}
            />
          </div>
        </div>

        <div className="flex-1 relative">
          <AnimatePresence custom={1} mode="wait">

            {/* ── Step 1: Category & Provider type ─────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-card rounded-3xl p-6 shadow-sm border border-success/20 flex flex-col gap-6 absolute inset-0"
              >
                <h2 className="text-2xl font-bold text-foreground">{t('step_1_offer')}</h2>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">{t('category')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {metadata?.categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`p-4 rounded-xl text-center font-medium transition-all duration-200 border-2 hover-elevate ${
                          formData.category === cat
                            ? 'border-success bg-success/10 text-success shadow-sm'
                            : 'border-border bg-background hover:border-success/40'
                        }`}
                      >
                        {t(cat)}
                      </button>
                    ))}
                  </div>
                  {errors.category && (
                    <p className="text-destructive text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />{errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">{t('provider_type')}</label>
                  <div className="flex gap-2">
                    {(['individual', 'organization', 'business'] as const).map(pt => (
                      <button
                        key={pt}
                        onClick={() => setFormData({ ...formData, providerType: pt })}
                        className={`flex-1 py-3 px-2 rounded-lg text-sm font-medium transition-all border-2 ${
                          formData.providerType === pt
                            ? 'border-success bg-success/10 text-success'
                            : 'border-border bg-background text-muted-foreground hover:border-success/40'
                        }`}
                      >
                        {t(pt)}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Title & Description ───────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-card rounded-3xl p-6 shadow-sm border border-success/20 flex flex-col gap-6 absolute inset-0"
              >
                <h2 className="text-2xl font-bold text-foreground">{t('step_2_desc')}</h2>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">{t('title_label')}</label>
                  <input
                    type="text"
                    className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-success focus:ring-4 focus:ring-success/10 transition-all outline-none"
                    placeholder={t('title_placeholder_offer')}
                    value={formData.title || ''}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                  {errors.title && <p className="text-destructive text-sm mt-1">{errors.title}</p>}
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="block text-sm font-semibold text-foreground mb-2">{t('desc_label')}</label>
                  <textarea
                    className="w-full flex-1 min-h-[150px] p-4 rounded-xl bg-background border-2 border-border focus:border-success focus:ring-4 focus:ring-success/10 transition-all outline-none resize-none"
                    placeholder={t('desc_placeholder_offer')}
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                  {errors.description && <p className="text-destructive text-sm mt-1">{errors.description}</p>}
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Location, Expiry & Contact ───────────────────────── */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-card rounded-3xl p-6 shadow-sm border border-success/20 flex flex-col gap-5 absolute inset-0 overflow-y-auto"
              >
                <h2 className="text-2xl font-bold text-foreground">{t('step_3_loc')}</h2>

                {/* Governorate */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">{t('governorate')}</label>
                  <select
                    className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-success outline-none"
                    value={formData.governorate || ''}
                    onChange={e => setFormData({ ...formData, governorate: e.target.value, district: '' })}
                  >
                    <option value="" disabled>{t('select_placeholder')}</option>
                    {metadata?.governorates.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {errors.governorate && <p className="text-destructive text-sm mt-1">{errors.governorate}</p>}
                </div>

                {/* District (conditional) */}
                {formData.governorate && metadata?.districts[formData.governorate] && (
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">{t('district')}</label>
                    <select
                      className="w-full p-4 rounded-xl bg-background border-2 border-border focus:border-success outline-none"
                      value={formData.district || ''}
                      onChange={e => setFormData({ ...formData, district: e.target.value })}
                    >
                      <option value="" disabled>{t('select_placeholder')}</option>
                      {metadata.districts[formData.governorate].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Expiry presets */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">{t('expiry_label')}</label>
                  <div className="flex gap-2">
                    {EXPIRY_PRESETS.map(({ key, days }) => (
                      <button
                        key={key}
                        onClick={() => setExpiresInDays(days)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                          expiresInDays === days
                            ? 'border-success bg-success/10 text-success'
                            : 'border-border bg-background text-muted-foreground hover:border-success/40'
                        }`}
                      >
                        {t(key)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">{t('contact_method')}</label>
                    <select
                      className="w-full p-3 rounded-xl bg-background border-2 border-border focus:border-success outline-none"
                      value={formData.contactMethod || ''}
                      onChange={e => setFormData({ ...formData, contactMethod: e.target.value })}
                    >
                      <option value="" disabled>{t('select_placeholder')}</option>
                      {metadata?.contactMethods.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">{t('contact_info')}</label>
                    <input
                      type="text"
                      className="w-full p-3 rounded-xl bg-background border-2 border-border focus:border-success outline-none"
                      placeholder={t('phone_placeholder')}
                      dir="ltr"
                      value={formData.contactInfo || ''}
                      onChange={e => setFormData({ ...formData, contactInfo: e.target.value })}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error state */}
        {createPost.isError && step === 3 && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 mt-4">
            <XCircle className="w-4 h-4 shrink-0" />
            {t('submit_error')}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex gap-4 pt-4 border-t border-border/50">
          {step > 1 && (
            <Button
              variant="outline"
              className="h-14 w-14 rounded-2xl border-2 border-border shrink-0 hover-elevate"
              onClick={() => setStep(prev => prev - 1)}
            >
              {isRtl ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
            </Button>
          )}

          <Button
            className="h-14 flex-1 rounded-2xl text-lg font-bold bg-success hover:bg-success/90 text-success-foreground shadow-lg hover-elevate shadow-success/20 transition-all"
            onClick={step === 3 ? handleSubmit : handleNext}
            disabled={createPost.isPending}
          >
            {createPost.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                {t('submit')}
              </span>
            ) : step === 3 ? t('submit') : t('next')}
          </Button>
        </div>
      </main>
    </div>
  );
}

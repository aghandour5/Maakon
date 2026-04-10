"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@supabase/supabase-js";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Translations ────────────────────────────────────────────────────────────
const labels = {
  ar: {
    heading: "انضم إلى قائمة الانتظار",
    subheading: "كن أول من يعلم عند إطلاق منصة معكن.",
    fullName: "الاسم الكامل",
    fullNamePlaceholder: "أدخل اسمك الكامل",
    email: "البريد الإلكتروني",
    emailPlaceholder: "example@mail.com",
    role: "صفتك",
    rolePlaceholder: "اختر صفتك...",
    roleOptions: [
      { value: "أبحث عن مساعدة", label: "أبحث عن مساعدة" },
      { value: "أريد المساعدة", label: "أريد المساعدة" },
      { value: "جمعية / منظمة", label: "جمعية / منظمة" },
      { value: "متطوع", label: "متطوع" },
    ],
    language: "اللغة المفضلة للتواصل",
    langAr: "العربية",
    langEn: "English",
    submit: "سجل الآن",
    errorServer: "حدث خطأ أثناء الإرسال. الرجاء المحاولة لاحقاً.",
    errorDuplicate: "هذا البريد الإلكتروني مسجّل مسبقاً. شكراً!",
    successTitle: "تم تسجيلك بنجاح! 🎉",
    successBody: "شكراً لاهتمامك بمعكن. سنرسل لك بريداً إلكترونياً فور إطلاق المنصة.",
    registerAnother: "تسجيل شخص آخر",
    nameMin: "الاسم يجب أن يكون حرفين على الأقل",
    emailInvalid: "الرجاء إدخال بريد إلكتروني صحيح",
    roleRequired: "الرجاء اختيار صفتك",
    langRequired: "الرجاء اختيار اللغة",
  },
  en: {
    heading: "Join the Waitlist",
    subheading: "Be the first to know when Maakon launches.",
    fullName: "Full Name",
    fullNamePlaceholder: "Enter your full name",
    email: "Email Address",
    emailPlaceholder: "example@mail.com",
    role: "Your Role",
    rolePlaceholder: "Select your role...",
    roleOptions: [
      { value: "أبحث عن مساعدة", label: "Looking for help" },
      { value: "أريد المساعدة", label: "I want to help" },
      { value: "جمعية / منظمة", label: "NGO / Organization" },
      { value: "متطوع", label: "Volunteer" },
    ],
    language: "Preferred Language",
    langAr: "العربية",
    langEn: "English",
    submit: "Register Now",
    errorServer: "Something went wrong. Please try again later.",
    errorDuplicate: "This email is already registered. Thank you!",
    successTitle: "You're on the list! 🎉",
    successBody: "Thank you for your interest in Maakon. We'll email you as soon as we launch.",
    registerAnother: "Register another person",
    nameMin: "Name must be at least 2 characters",
    emailInvalid: "Please enter a valid email address",
    roleRequired: "Please select your role",
    langRequired: "Please select a language",
  },
};

// ─── Schema (built per-language for localised error messages) ────────────────
const makeSchema = (t: typeof labels.ar) =>
  z.object({
    full_name: z.string().min(2, { message: t.nameMin }),
    email: z.string().email({ message: t.emailInvalid }),
    role: z.string().min(1, { message: t.roleRequired }),
    preferred_language: z.string().min(1, { message: t.langRequired }),
    bot_field: z.string().max(0).optional(),
  });

type WaitlistFormValues = z.infer<ReturnType<typeof makeSchema>>;

// ─── Brand constants ─────────────────────────────────────────────────────────
const GREEN = "#00a651";
const RED = "#ed1c24";

// ─── Component ───────────────────────────────────────────────────────────────
interface WaitlistFormProps {
  lang?: "ar" | "en";
}

export default function WaitlistForm({ lang = "ar" }: WaitlistFormProps) {
  const t = labels[lang];
  const schema = makeSchema(t);

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WaitlistFormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: WaitlistFormValues) => {
    // Honeypot: silently drop bots
    if (data.bot_field && data.bot_field.length > 0) return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const { error } = await supabase.from("waitlist").insert([
        {
          full_name: data.full_name.trim(),
          email: data.email.trim().toLowerCase(),
          role: data.role,
          preferred_language: data.preferred_language,
        },
      ]);

      if (error) {
        // Unique constraint violation → already registered
        if (error.code === "23505") {
          setErrorMessage(t.errorDuplicate);
          setStatus("error");
          return;
        }
        throw error;
      }

      setStatus("success");
      reset();
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMessage(t.errorServer);
    }
  };

  // ── Shared input styles ──────────────────────────────────────────────────
  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a651] focus:border-transparent transition-colors text-slate-900 placeholder:text-slate-400";

  // ── Success state ────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div
        className="rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4"
        style={{
          backgroundColor: "rgba(0,166,81,0.06)",
          border: `1px solid rgba(0,166,81,0.2)`,
        }}
      >
        <CheckCircle2 className="w-16 h-16" style={{ color: GREEN }} />
        <h3 className="text-xl font-bold text-slate-800">{t.successTitle}</h3>
        <p className="text-slate-600 max-w-xs">{t.successBody}</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-2 font-semibold underline text-sm"
          style={{ color: GREEN }}
        >
          {t.registerAnother}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 w-full max-w-md mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{t.heading}</h2>
        <p className="text-slate-500 mt-2 text-sm">{t.subheading}</p>
      </div>

      {/* Server / duplicate error */}
      {status === "error" && (
        <div
          className="mb-6 p-4 rounded-xl flex items-start gap-3"
          style={{ backgroundColor: "rgba(237,28,36,0.08)", color: RED }}
        >
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Honeypot — hidden from real users */}
        <div className="hidden" aria-hidden="true">
          <input type="text" {...register("bot_field")} tabIndex={-1} autoComplete="off" />
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">{t.fullName}</label>
          <input
            type="text"
            className={inputCls}
            placeholder={t.fullNamePlaceholder}
            {...register("full_name")}
          />
          {errors.full_name && (
            <p className="text-xs font-medium" style={{ color: RED }}>
              {errors.full_name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">{t.email}</label>
          <input
            type="email"
            dir="ltr"
            className={`${inputCls} text-left`}
            placeholder={t.emailPlaceholder}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs font-medium" style={{ color: RED }}>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Role */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">{t.role}</label>
          <select
            className={inputCls}
            defaultValue=""
            {...register("role")}
          >
            <option value="" disabled>
              {t.rolePlaceholder}
            </option>
            {t.roleOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="text-xs font-medium" style={{ color: RED }}>
              {errors.role.message}
            </p>
          )}
        </div>

        {/* Preferred Language */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">{t.language}</label>
          <select
            className={inputCls}
            defaultValue="العربية"
            {...register("preferred_language")}
          >
            <option value="العربية">{t.langAr}</option>
            <option value="English">{t.langEn}</option>
          </select>
          {errors.preferred_language && (
            <p className="text-xs font-medium" style={{ color: RED }}>
              {errors.preferred_language.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full py-4 mt-2 px-6 rounded-xl text-white font-bold text-lg transition-all disabled:opacity-70 flex justify-center items-center h-[56px] bg-[#00a651] hover:bg-[#008a44]"
          style={{ boxShadow: "0 4px 16px rgba(0,166,81,0.25)" }}
        >
          {status === "submitting" ? <Loader2 className="w-5 h-5 animate-spin" /> : t.submit}
        </button>
      </form>
    </div>
  );
}

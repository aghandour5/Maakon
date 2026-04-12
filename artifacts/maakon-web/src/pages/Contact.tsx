import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { TopNav } from "@/components/layout/TopNav";
import { motion } from "framer-motion";
import { Send, CheckCircle2, MessageSquare, Mail, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/layout/Footer";

const FEEDBACK_TYPES = ["general", "bug", "feature", "complaint", "other"] as const;
type FeedbackType = (typeof FEEDBACK_TYPES)[number];

const LABELS: Record<FeedbackType, { en: string; ar: string; emoji: string }> = {
  general:   { en: "General",          ar: "عام",            emoji: "💬" },
  bug:       { en: "Bug Report",       ar: "بلاغ خطأ",       emoji: "🐛" },
  feature:   { en: "Feature Request",  ar: "طلب ميزة",       emoji: "✨" },
  complaint: { en: "Complaint",        ar: "شكوى",           emoji: "⚠️" },
  other:     { en: "Other",            ar: "أخرى",           emoji: "📝" },
};

export default function Contact() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("general");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 10) {
      toast({
        variant: "destructive",
        title: t("msg_too_short"),
        description: t("msg_too_short_desc"),
      });
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: feedbackType, name, email, message }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("feedback_error"),
      });
    } finally {
      setSending(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-dvh flex flex-col bg-slate-50">
        <TopNav title={t("contact_us_title")} showBack />
        <div className="flex-1 flex items-center justify-center px-5 pt-16">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center"
            style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
              style={{ background: "linear-gradient(135deg, #dcfce7, #bbf7d0)" }}
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">
              {t("thank_you")}
            </h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              {t("feedback_success")}
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setName("");
                setEmail("");
                setMessage("");
                setFeedbackType("general");
              }}
              className="w-full h-12 rounded-2xl font-bold text-white text-base transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg, #ed1c24, #ff4d4d)" }}
            >
              {t("send_another")}
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      <TopNav title={t("contact_us_title")} showBack />

      <main className="flex-1">
        {/* Header */}
        <section
          className="px-5 pt-24 pb-12 text-center"
          style={{ background: "linear-gradient(140deg, #021c13 0%, #064e3b 45%, #022c22 100%)" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <MessageSquare className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
            <h1 className="text-2xl md:text-3xl font-black text-white mb-2">
              {t("contact_us_title")}
            </h1>
            <p className="text-white/50 text-sm max-w-md mx-auto">
              {t("contact_us_desc")}
            </p>
          </motion.div>
        </section>

        {/* Form card */}
        <div className="px-4 -mt-6 pb-10">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl max-w-lg mx-auto overflow-hidden"
            style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}
          >
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #ed1c24, #ff4d4d)" }} />

            <div className="p-6 flex flex-col gap-5">
              {/* Feedback type */}
              <div>
                <label className="block text-start text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                  {t("feedback_type")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {FEEDBACK_TYPES.map((type) => {
                    const selected = feedbackType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFeedbackType(type)}
                        aria-pressed={selected}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-150 active:scale-95 border-2"
                        style={
                          selected
                            ? {
                                background: "linear-gradient(135deg, #ed1c24, #ff4d4d)",
                                borderColor: "transparent",
                                color: "white",
                                boxShadow: "0 4px 12px rgba(237,28,36,0.35)",
                              }
                            : {
                                background: "#f8fafc",
                                borderColor: "#e2e8f0",
                                color: "#475569",
                              }
                        }
                      >
                        <span className="text-base leading-none" aria-hidden="true">{LABELS[type].emoji}</span>
                        {t(`feedback_${type}`)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="flex items-center text-start text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  <User className="w-3.5 h-3.5 inline-block me-1 -mt-0.5" aria-hidden="true" />
                  {t("name_optional")}
                </label>
                <input
                  id="name"
                  type="text"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-red-400 focus:ring-4 focus:ring-red-400/10 transition-all outline-none text-sm font-medium placeholder:text-gray-400 text-start"
                  placeholder={t("your_name")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="flex items-center text-start text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  <Mail className="w-3.5 h-3.5 inline-block me-1 -mt-0.5" aria-hidden="true" />
                  {t("email_optional")}
                </label>
                <input
                  id="email"
                  type="email"
                  dir="ltr"
                  className="w-full text-start px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all outline-none text-sm font-medium placeholder:text-gray-400"
                  placeholder={t("email_placeholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="flex items-center text-start text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  <MessageSquare className="w-3.5 h-3.5 inline-block me-1 -mt-0.5" aria-hidden="true" />
                  {t("your_message")}
                </label>
                <textarea
                  id="message"
                  rows={5}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all outline-none resize-none text-sm font-medium placeholder:text-gray-400 text-start"
                  placeholder={t("write_feedback_here")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={sending}
                className="w-full h-13 py-3.5 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #ed1c24 0%, #ff4d4d 100%)",
                  boxShadow: "0 6px 20px rgba(237,28,36,0.35)",
                }}
              >
                {sending ? (
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="w-4 h-4" aria-hidden="true" />
                )}
                <span aria-live="polite">{sending ? t("sending_feedback", "Sending...") : t("submit_feedback")}</span>
              </button>
            </div>
          </motion.form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

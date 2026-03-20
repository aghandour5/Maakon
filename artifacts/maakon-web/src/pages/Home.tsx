import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { MapPin, HeartHandshake, AlertTriangle, ArrowLeft, Globe } from "lucide-react";
import { motion } from "framer-motion";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language.startsWith("ar") ? "en" : "ar");
  };

  return (
    <div
      className="h-dvh flex flex-col overflow-hidden relative"
      style={{
        background: "linear-gradient(150deg, #0A1930 0%, #0D2556 45%, #0A1C42 70%, #091530 100%)",
      }}
    >
      {/* Decorative glows */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-15%", right: "-20%", width: "55%", paddingTop: "55%",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(30,100,255,0.18) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "5%", left: "-15%", width: "45%", paddingTop: "45%",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(160,30,30,0.15) 0%, transparent 70%)",
        }}
      />
      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── Top nav ─────────────────────────────────────────────────────────── */}
      <header className="relative z-10 shrink-0 px-5">
        <div className="h-14 flex items-center justify-between">
          {/* Logo — transparent version on dark background */}
          <img
            src="/logo.png"
            alt="Maakon"
            className="h-9 w-auto object-contain rounded-lg"
          />
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3.5 h-8 rounded-full text-white/80 hover:text-white text-xs font-medium border border-white/15 hover:border-white/30 hover:bg-white/8 transition-all duration-150"
          >
            <Globe className="w-3.5 h-3.5" />
            {i18n.language.startsWith("ar") ? "English" : "عربي"}
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <motion.main
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 pb-6 gap-5 overflow-y-auto"
      >
        {/* Logo hero */}
        <motion.div variants={fadeUp} className="flex flex-col items-center">
          <img
            src="/logo.png"
            alt="Maakon معكن"
            className="w-64 max-w-[75vw] object-contain rounded-2xl shadow-2xl"
          />
        </motion.div>

        {/* I Need Help */}
        <motion.div variants={fadeUp} className="w-full max-w-sm">
          <Link href="/need/new" className="block group">
            <div
              className="relative overflow-hidden rounded-3xl p-5 flex items-center gap-4 transition-transform duration-200 group-hover:-translate-y-1 group-active:translate-y-0 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #b91c1c 100%)",
                boxShadow: "0 8px 32px rgba(220, 38, 38, 0.45), 0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)" }}
              />
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.20)" }}
              >
                <AlertTriangle className="w-7 h-7 text-white drop-shadow" />
              </div>
              <div className={`flex-1 min-w-0 relative ${isRtl ? "text-right" : "text-left"}`}>
                <div className="text-2xl font-black text-white leading-tight">{t("i_need_help")}</div>
                <div className="text-white/75 text-sm mt-0.5">
                  {isRtl ? "طلب طعام، مأوى، دواء..." : "Request food, shelter, meds..."}
                </div>
              </div>
              <div className={`shrink-0 opacity-60 ${isRtl ? "rotate-180" : ""}`}>
                <ArrowLeft className="w-5 h-5 text-white" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* I Want to Help */}
        <motion.div variants={fadeUp} className="w-full max-w-sm">
          <Link href="/offer/new" className="block group">
            <div
              className="relative overflow-hidden rounded-3xl p-5 flex items-center gap-4 transition-transform duration-200 group-hover:-translate-y-1 group-active:translate-y-0 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #047857 100%)",
                boxShadow: "0 8px 32px rgba(5, 150, 105, 0.45), 0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)" }}
              />
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.20)" }}
              >
                <HeartHandshake className="w-7 h-7 text-white drop-shadow" />
              </div>
              <div className={`flex-1 min-w-0 relative ${isRtl ? "text-right" : "text-left"}`}>
                <div className="text-2xl font-black text-white leading-tight">{t("i_want_to_help")}</div>
                <div className="text-white/75 text-sm mt-0.5">
                  {isRtl ? "تقديم موارد أو خدمات مجانية" : "Offer resources or free services"}
                </div>
              </div>
              <div className={`shrink-0 opacity-60 ${isRtl ? "rotate-180" : ""}`}>
                <ArrowLeft className="w-5 h-5 text-white" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Divider */}
        <motion.div variants={fadeUp} className="flex items-center gap-3 w-full max-w-sm">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/35 font-medium">{isRtl ? "أو" : "OR"}</span>
          <div className="flex-1 h-px bg-white/10" />
        </motion.div>

        {/* View Map */}
        <motion.div variants={fadeUp} className="w-full max-w-sm">
          <Link href="/map" className="block group">
            <div
              className="w-full rounded-2xl px-5 py-4 flex items-center justify-center gap-2.5 font-semibold text-white/80 group-hover:text-white transition-all duration-150 group-hover:bg-white/10"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <MapPin className="w-5 h-5 text-blue-300" />
              <span className="text-base">{t("view_map")}</span>
            </div>
          </Link>
        </motion.div>
      </motion.main>

      <div className="relative z-10 shrink-0 h-2" />
    </div>
  );
}

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { ShieldAlert, HeartHandshake, ArrowRight } from "lucide-react";
import { useAuthGate } from "@/hooks/useAuthGate";

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function ActionButtons() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const [, setLocation] = useLocation();
  const { requireAuth } = useAuthGate();

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ delay: 0.15 }}
      className="w-full max-w-2xl flex flex-col gap-3 sm:gap-4"
    >
      {/* I Need Help Button - Maakon Red */}
      <button
        onClick={requireAuth(() => setLocation('/need/new'))}
        className="w-full rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200 group"
        style={{
          background: "#ed1c24",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 12px 32px rgba(237, 28, 36, 0.5)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(237, 28, 36, 0.3)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
        aria-label={t("i_need_help")}
      >
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center shrink-0 bg-white/20" aria-hidden="true">
          <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        </div>

        <div className={`flex-1 min-w-0 ${isRtl ? "text-right" : "text-left"}`}>
          <div className="text-lg sm:text-xl font-bold text-white leading-tight">{t("i_need_help")}</div>
          <div className="text-red-100 font-medium text-xs sm:text-sm mt-0.5 opacity-85">
            {isRtl ? "طلب طعام، مأوى، دواء..." : "Request food, shelter, meds..."}
          </div>
        </div>

        <div
          className={`shrink-0 text-white opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 ${
            isRtl ? "rotate-180 group-hover:-translate-x-1" : ""
          }`}
          aria-hidden="true"
        >
          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </button>

      {/* I Want to Help Button - Maakon Green */}
      <button
        onClick={requireAuth(() => setLocation('/offer/new'))}
        className="w-full rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-white/30"
        style={{
          background: "#00a651",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 12px 32px rgba(0, 166, 81, 0.5)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 166, 81, 0.3)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
        aria-label={t("i_want_to_help")}
      >
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center shrink-0 bg-white/20" aria-hidden="true">
          <HeartHandshake className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        </div>

        <div className={`flex-1 min-w-0 ${isRtl ? "text-right" : "text-left"}`}>
          <div className="text-lg sm:text-xl font-bold text-white leading-tight">{t("i_want_to_help")}</div>
          <div className="text-emerald-100 font-medium text-xs sm:text-sm mt-0.5 opacity-85">
            {isRtl ? "تقديم موارد أو خدمات مجانية" : "Offer resources or free services"}
          </div>
        </div>

        <div
          className={`shrink-0 text-white opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 ${
            isRtl ? "rotate-180 group-hover:-translate-x-1" : ""
          }`}
          aria-hidden="true"
        >
          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </button>
    </motion.div>
  );
}

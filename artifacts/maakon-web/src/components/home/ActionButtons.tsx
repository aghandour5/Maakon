import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { ShieldAlert, HeartHandshake, ArrowRight } from "lucide-react";
import { useAuthGate } from "@/hooks/useAuthGate";

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
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
      transition={{ delay: 0.1 }}
      className="w-full max-w-sm flex flex-col gap-4"
    >
      {/* I Need Help Button */}
      <button
        onClick={requireAuth(() => setLocation('/need/new'))}
        className="w-full relative overflow-hidden rounded-3xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 bg-red-600 hover:bg-red-700 transition-all shadow-lg group animate-pulse-subtle focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-black/50"
        aria-label={t("i_need_help")}
      >
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 bg-white/20 shadow-inner" aria-hidden="true">
          <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        </div>

        <div className={`flex-1 min-w-0 ${isRtl ? "text-right" : "text-left"}`}>
          <div className="text-xl sm:text-2xl font-black text-white leading-tight">{t("i_need_help")}</div>
          <div className="text-red-100 font-medium text-xs sm:text-sm mt-0.5 opacity-90">
            {isRtl ? "طلب طعام، مأوى، دواء..." : "Request food, shelter, meds..."}
          </div>
        </div>

        <div
          className={`shrink-0 text-white opacity-80 group-hover:opacity-100 group-hover:-translate-x-1 transition-all ${
            isRtl ? "rotate-180 group-hover:translate-x-1" : ""
          }`}
          aria-hidden="true"
        >
          <ArrowRight className="w-6 h-6" />
        </div>
      </button>

      {/* I Want to Help Button */}
      <button
        onClick={requireAuth(() => setLocation('/offer/new'))}
        className="w-full relative overflow-hidden rounded-3xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 bg-white hover:bg-emerald-50 transition-all shadow-lg group hover:shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-black/50"
        aria-label={t("i_want_to_help")}
      >
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-50 shadow-inner" aria-hidden="true">
          <HeartHandshake className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
        </div>

        <div className={`flex-1 min-w-0 ${isRtl ? "text-right" : "text-left"}`}>
          <div className="text-xl sm:text-2xl font-black text-emerald-950 leading-tight">{t("i_want_to_help")}</div>
          <div className="text-emerald-700/80 font-medium text-xs sm:text-sm mt-0.5">
            {isRtl ? "تقديم موارد أو خدمات مجانية" : "Offer resources or free services"}
          </div>
        </div>

        <div
          className={`shrink-0 text-emerald-950 opacity-40 group-hover:opacity-100 group-hover:-translate-x-1 transition-all ${
            isRtl ? "rotate-180 group-hover:translate-x-1" : ""
          }`}
          aria-hidden="true"
        >
          <ArrowRight className="w-6 h-6" />
        </div>
      </button>
    </motion.div>
  );
}

import { motion } from "framer-motion";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function ViewMapButton() {
  const { t } = useTranslation();

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ delay: 0.2 }}
      className="w-full max-w-2xl"
    >
      <Link href="/map" className="block focus:outline-none focus:ring-2 focus:ring-white/30 rounded-lg">
        <div className="w-full rounded-lg px-5 sm:px-6 py-3 sm:py-4 flex items-center justify-center gap-3 font-semibold text-base sm:text-lg text-white border border-white/30 transition-all duration-200 hover:bg-white/5"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#00a651";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 166, 81, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <MapPin className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "#00a651" }} />
          <span>{t("view_map")}</span>
        </div>
      </Link>
    </motion.div>
  );
}

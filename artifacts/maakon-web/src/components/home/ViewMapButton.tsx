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
      <Link
        href="/map"
        className="w-full min-h-12 rounded-lg px-5 sm:px-6 py-3 sm:py-4 flex items-center justify-center gap-3 font-semibold text-base sm:text-lg text-white no-underline border border-white/30 transition-[background-color,border-color,box-shadow] duration-200 hover:bg-white/5 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(0,166,81,0.2)] focus-ring-on-dark"
      >
        <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0" aria-hidden="true" />
        <span>{t("view_map")}</span>
      </Link>
    </motion.div>
  );
}

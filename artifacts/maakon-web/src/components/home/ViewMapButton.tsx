import { motion } from "framer-motion";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ViewMapButton() {
  const { t } = useTranslation();

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ delay: 0.2 }}
      className="w-full max-w-sm"
    >
      <Link href="/map" className="block focus:outline-none focus:ring-2 focus:ring-white/50 rounded-2xl">
        <div className="w-full rounded-2xl px-5 py-4 flex items-center justify-center gap-3 font-bold text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-colors shadow-sm">
          <MapPin className="w-5 h-5" />
          <span className="text-base tracking-wide">{t("view_map")}</span>
        </div>
      </Link>
    </motion.div>
  );
}

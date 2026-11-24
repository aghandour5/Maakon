import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="text-center px-4 flex flex-col items-center w-full max-w-2xl"
    >
      {/* Decorative: the header already names the brand. Kept small on phones so the actions stay above the fold. */}
      <img
        src="/logo.svg"
        alt=""
        draggable={false}
        className="h-16 sm:h-20 lg:h-24 w-auto object-contain mb-4 md:mb-6"
      />
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
        {t("home_heading")}
      </h1>
    </motion.div>
  );
}

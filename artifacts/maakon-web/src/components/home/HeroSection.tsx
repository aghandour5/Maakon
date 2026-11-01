import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function HeroSection() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="text-center px-4 flex flex-col items-center w-full max-w-2xl"
    >
      <img
        src="/logo.svg"
        alt="Maakon Logo"
        draggable={false}
        className="h-24 sm:h-32 md:h-40 lg:h-48 w-auto object-contain mb-6 sm:mb-8"
      />
      <h1
        className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold text-white leading-relaxed tracking-wide [&>strong]:font-bold [&>strong]:text-[#00A651]"
        dangerouslySetInnerHTML={{ __html: t("home_tagline") }}
      />
    </motion.div>
  );
}

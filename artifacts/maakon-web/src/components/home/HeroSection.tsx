import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function HeroSection() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="text-center px-2 flex flex-col items-center"
    >
      <img
        src="/logo.svg"
        alt="Maakon Logo"
        draggable={false}
        className="h-28 sm:h-40 md:h-56 w-auto object-contain mb-4 sm:mb-6 drop-shadow-[0_35px_60px_rgba(0,0,0,0.2)]"
      />
      <h1
        className="text-2xl sm:text-3xl lg:text-4xl font-normal text-emerald-50/90 leading-none tracking-tight max-w-lg mx-auto drop-shadow-sm [&>strong]:font-bold [&>strong]:font-arabic [&>strong]:text-[#00A651] [&>strong]:[text-shadow:0_1px_4px_rgba(0,0,0,0.15)]"
        dangerouslySetInnerHTML={{ __html: t("home_tagline") }}
      />
    </motion.div>
  );
}

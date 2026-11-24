import { motion } from "framer-motion";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { MapPin, Book, Mail, Shield, LifeBuoy, HandHeart } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.35,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 },
};

export default function QuickLinks() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const links = [
    {
      icon: <MapPin className="w-6 h-6 sm:w-7 sm:h-7" />,
      label: isRtl ? "الخريطة" : "Map",
      href: "/map",
      color: "#00a651",
    },
    {
      icon: <Book className="w-6 h-6 sm:w-7 sm:h-7" />,
      label: isRtl ? "حول" : "About",
      href: "/about",
      color: "#ed1c24",
    },
    {
      icon: <Mail className="w-6 h-6 sm:w-7 sm:h-7" />,
      label: isRtl ? "تواصل" : "Contact",
      href: "/contact",
      color: "#00a651",
    },
    {
      icon: <LifeBuoy className="w-6 h-6 sm:w-7 sm:h-7" />,
      label: isRtl ? "الدعم" : "Support",
      href: "/support",
      color: "#ed1c24",
    },
    {
      icon: <Shield className="w-6 h-6 sm:w-7 sm:h-7" />,
      label: isRtl ? "الخصوصية" : "Privacy",
      href: "/privacy",
      color: "#00a651",
    },
    {
      icon: <HandHeart className="w-6 h-6 sm:w-7 sm:h-7" />,
      label: isRtl ? "ادعمنا" : "Support Us",
      href: "/support",
      color: "#ed1c24",
    },
  ];

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      className="w-full max-w-5xl px-4 py-12 sm:py-16 lg:py-20"
    >
      <motion.h2 
        variants={itemVariants} 
        className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-12 sm:mb-14 lg:mb-16"
      >
        {isRtl ? "روابط سريعة" : "Quick Links"}
      </motion.h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 lg:gap-5">
        {links.map((link, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Link href={link.href} className="block focus:outline-none focus:ring-2 focus:ring-white/50 rounded-xl h-full">
              <div
                className="h-full flex flex-col items-center justify-center gap-3 p-5 sm:p-6 lg:p-7 rounded-xl text-white font-semibold text-xs sm:text-sm lg:text-base hover:shadow-xl transition-all hover:scale-105 transform"
                style={{
                  background: `linear-gradient(135deg, ${link.color}99 0%, ${link.color}66 100%)`,
                  border: `2px solid ${link.color}40`,
                  boxShadow: `0 8px 24px ${link.color}30`
                }}
              >
                <div style={{ opacity: 0.95, color: link.color }}>{link.icon}</div>
                <span className="text-center font-bold">{link.label}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

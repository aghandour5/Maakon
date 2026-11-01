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
      icon: <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: isRtl ? "الخريطة" : "Map",
      href: "/map",
      color: "from-blue-600 to-blue-500",
    },
    {
      icon: <Book className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: isRtl ? "حول" : "About",
      href: "/about",
      color: "from-purple-600 to-purple-500",
    },
    {
      icon: <Mail className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: isRtl ? "تواصل" : "Contact",
      href: "/contact",
      color: "from-pink-600 to-pink-500",
    },
    {
      icon: <LifeBuoy className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: isRtl ? "الدعم" : "Support",
      href: "/support",
      color: "from-orange-600 to-orange-500",
    },
    {
      icon: <Shield className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: isRtl ? "الخصوصية" : "Privacy",
      href: "/privacy",
      color: "from-green-600 to-green-500",
    },
    {
      icon: <HandHeart className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: isRtl ? "ادعمنا" : "Support Us",
      href: "/support",
      color: "from-red-600 to-red-500",
    },
  ];

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      className="w-full max-w-2xl px-4 py-8 sm:py-12"
    >
      <motion.h2 variants={itemVariants} className="text-center text-xl sm:text-2xl font-bold text-white mb-8 sm:mb-10">
        {isRtl ? "روابط سريعة" : "Quick Links"}
      </motion.h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {links.map((link, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Link href={link.href} className="block focus:outline-none focus:ring-2 focus:ring-white/50 rounded-xl">
              <div
                className={`h-full flex flex-col items-center justify-center gap-2 sm:gap-3 p-4 sm:p-6 rounded-xl bg-gradient-to-br ${link.color} text-white font-semibold text-sm sm:text-base hover:shadow-lg transition-shadow hover:scale-105 transform`}
              >
                <div className="opacity-90">{link.icon}</div>
                <span className="text-center text-xs sm:text-sm font-bold">{link.label}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

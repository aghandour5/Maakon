import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Heart, Globe } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function ValueProposition() {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const values = [
    {
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
      title: isRtl ? "تحقق ومأمون" : "Verified & Safe",
      description: isRtl ? "كل الطلبات والعروض التي تم التحقق منها بواسطة فريقنا" : "Every request and offer is verified by our team",
    },
    {
      icon: <Heart className="w-6 h-6 text-red-400" />,
      title: isRtl ? "مجاني تماماً" : "Completely Free",
      description: isRtl ? "لا توجد رسوم أو تكاليف، فقط مساعدة حقيقية" : "No fees or charges, just real help",
    },
    {
      icon: <Globe className="w-6 h-6 text-blue-400" />,
      title: isRtl ? "متاح للجميع" : "For Everyone",
      description: isRtl ? "متعدد اللغات وسهل الاستخدام على جميع الأجهزة" : "Multi-language and accessible on all devices",
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
      <motion.h2
        variants={itemVariants}
        className="text-center text-xl sm:text-2xl font-bold text-white mb-8 sm:mb-10"
      >
        {isRtl ? "لماذا اختار معاون؟" : "Why Choose Maakon?"}
      </motion.h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {values.map((value, index) => (
          <motion.div key={index} variants={itemVariants} className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-white/10">{value.icon}</div>
              <h3 className={`text-base sm:text-lg font-bold text-white ${isRtl ? "text-right" : "text-left"}`}>{value.title}</h3>
            </div>
            <p className={`text-sm sm:text-base text-emerald-100/80 ${isRtl ? "text-right" : "text-left"}`}>{value.description}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

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
      icon: <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9" />,
      title: isRtl ? "تحقق ومأمون" : "Verified & Safe",
      description: isRtl ? "كل الطلبات والعروض التي تم التحقق منها بواسطة فريقنا" : "Every request and offer is verified by our team",
      color: "#00a651"
    },
    {
      icon: <Heart className="w-8 h-8 sm:w-9 sm:h-9" />,
      title: isRtl ? "مجاني تماماً" : "Completely Free",
      description: isRtl ? "لا توجد رسوم أو تكاليف، فقط مساعدة حقيقية" : "No fees or charges, just real help",
      color: "#ed1c24"
    },
    {
      icon: <Globe className="w-8 h-8 sm:w-9 sm:h-9" />,
      title: isRtl ? "متاح للجميع" : "For Everyone",
      description: isRtl ? "متعدد اللغات وسهل الاستخدام على جميع الأجهزة" : "Multi-language and accessible on all devices",
      color: "#00a651"
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
        {isRtl ? "لماذا اختار معاون؟" : "Why Choose Maakon?"}
      </motion.h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
        {values.map((value, index) => (
          <motion.div 
            key={index} 
            variants={itemVariants} 
            className="p-6 sm:p-8 lg:p-10 rounded-2xl bg-white/5 border backdrop-blur-sm hover:bg-white/10 transition-all"
            style={{ borderColor: `${value.color}40` }}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-lg shrink-0" style={{ background: `${value.color}20` }}>
                <div style={{ color: value.color }}>{value.icon}</div>
              </div>
              <h3 className={`text-lg sm:text-xl lg:text-2xl font-bold text-white flex-1 ${isRtl ? "text-right" : "text-left"}`}>
                {value.title}
              </h3>
            </div>
            <p className={`text-base sm:text-lg text-emerald-100/80 ${isRtl ? "text-right" : "text-left"}`}>
              {value.description}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { TopNav } from "@/components/layout/TopNav";
import { motion } from "framer-motion";
import { Heart, Shield, MapPin, Users, Globe, ArrowRight } from "lucide-react";
import Footer from "@/components/layout/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const PILLARS = [
  {
    icon: Heart,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    titleEn: "Humanitarian First",
    titleAr: "الإنسانية أولاً",
    descEn: "Every feature is designed with the dignity and safety of affected communities in mind.",
    descAr: "كل ميزة مصممة مع مراعاة كرامة وسلامة المجتمعات المتضررة.",
  },
  {
    icon: Shield,
    color: "#ed1c24",
    bg: "rgba(237,28,36,0.12)",
    titleEn: "Privacy & Safety",
    titleAr: "الخصوصية والأمان",
    descEn: "Exact locations of people in need are never exposed. Coordinates are fuzzed to district level.",
    descAr: "لا يتم الكشف عن المواقع الدقيقة للمحتاجين. يتم تعتيم الإحداثيات على مستوى المنطقة.",
  },
  {
    icon: MapPin,
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    titleEn: "Real-Time Map",
    titleAr: "خريطة فورية",
    descEn: "A live, filterable map connects those who need help with those who can provide it.",
    descAr: "خريطة حية وقابلة للتصفية تربط من يحتاج المساعدة بمن يستطيع تقديمها.",
  },
  {
    icon: Users,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    titleEn: "Community Driven",
    titleAr: "مدفوع من المجتمع",
    descEn: "Anyone can post a need or offer help. Verified NGOs get a trust badge for visibility.",
    descAr: "يمكن لأي شخص نشر حاجة أو تقديم مساعدة. المنظمات الموثقة تحصل على شارة ثقة.",
  },
];

export default function About() {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      <TopNav title={isRtl ? "حول معكن" : "About Maakon"} showBack />

      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative overflow-hidden px-5 pt-28 pb-16 text-center"
          style={{ background: "linear-gradient(140deg, #021c13 0%, #064e3b 45%, #022c22 100%)" }}
        >
          <div
            className="absolute pointer-events-none"
            style={{
              top: "-20%", right: "-25%", width: "55%", paddingTop: "55%",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(237,28,36,0.15) 0%, transparent 70%)",
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-300/80 text-sm font-semibold uppercase tracking-widest">
                {isRtl ? "منصة إنسانية" : "Humanitarian Platform"}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
              {isRtl
                ? "معكن — ربط المحتاجين بالمساعدة في لبنان"
                : "Maakon — Connecting People in Need with Help in Lebanon"}
            </h1>
            <p className="text-white/60 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              {isRtl
                ? "معكن هي منصة مفتوحة للاستجابة للأزمات تُمكّن المجتمعات اللبنانية من نشر الاحتياجات العاجلة، وتقديم الموارد، والتنسيق للإغاثة — كل ذلك على خريطة تفاعلية واحدة."
                : "Maakon is an open crisis-response platform that empowers Lebanese communities to post urgent needs, offer resources, and coordinate relief — all on a single interactive map."}
            </p>
          </motion.div>
        </section>

        {/* Pillars */}
        <section className="px-5 py-12 max-w-4xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
          >
            {PILLARS.map((p) => (
              <motion.div
                key={p.titleEn}
                variants={fadeUp}
                className="rounded-2xl p-6 bg-white border border-slate-100"
                style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: p.bg }}
                >
                  <p.icon className="w-5 h-5" style={{ color: p.color }} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1.5">
                  {isRtl ? p.titleAr : p.titleEn}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {isRtl ? p.descAr : p.descEn}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* How It Works */}
        <section className="px-5 py-12 bg-white border-t border-slate-100">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-2xl font-black text-gray-900 mb-2">
              {isRtl ? "كيف يعمل؟" : "How It Works"}
            </h2>
            <p className="text-gray-400 text-sm">
              {isRtl ? "ثلاث خطوات بسيطة" : "Three simple steps"}
            </p>
          </div>
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                titleEn: "Post a Need or Offer",
                titleAr: "انشر حاجة أو عرض",
                descEn: "Describe what you need or can provide — food, shelter, medical, and more.",
                descAr: "صف ما تحتاجه أو تستطيع تقديمه — طعام، مأوى، رعاية طبية، والمزيد.",
              },
              {
                step: "02",
                titleEn: "Appear on the Map",
                titleAr: "تظهر على الخريطة",
                descEn: "Your post goes live on the interactive map with privacy-safe coordinates.",
                descAr: "ينشر طلبك على الخريطة التفاعلية بإحداثيات آمنة.",
              },
              {
                step: "03",
                titleEn: "Connect & Help",
                titleAr: "تواصل وساعد",
                descEn: "People nearby can see your post and reach out through your chosen contact method.",
                descAr: "يمكن للأشخاص القريبين رؤية منشورك والتواصل معك عبر طريقة الاتصال التي اخترتها.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div
                  className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center text-lg font-black text-white"
                  style={{ background: "linear-gradient(135deg, #ed1c24, #ff4d4d)" }}
                >
                  {item.step}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {isRtl ? item.titleAr : item.titleEn}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {isRtl ? item.descAr : item.descEn}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 py-14 text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-6">
            {isRtl ? "كن جزءاً من الحل" : "Be Part of the Solution"}
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/need/new"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-white font-bold text-sm transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg, #ed1c24, #ff4d4d)", boxShadow: "0 6px 20px rgba(237,28,36,0.35)" }}
            >
              {isRtl ? "أحتاج مساعدة" : "I Need Help"}
              <ArrowRight className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
            </Link>
            <Link
              href="/offer/new"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-white font-bold text-sm transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg, #00a651, #10b981)", boxShadow: "0 6px 20px rgba(0,166,81,0.35)" }}
            >
              {isRtl ? "أريد المساعدة" : "I Want to Help"}
              <ArrowRight className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

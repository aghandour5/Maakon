import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { TopNav } from "@/components/layout/TopNav";
import { motion } from "framer-motion";
import { Heart, Clock } from "lucide-react";
import Footer from "@/components/layout/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const METHODS = [
  {
    name: "Whish Money",
    accent: "#E61C38", // Whish Money Red
    descEn: "A licensed Lebanese mobile payment app. The fastest and easiest option for residents in Lebanon.",
    descAr: "تطبيق دفع لبناني مرخّص. الأسرع والأسهل للمقيمين في لبنان.",
    isReady: true,
    details: {
      name: "Ali Ghandour",
      phone: "+961 79 30 79 04"
    }
  },
  {
    name: "Taptap Send",
    accent: "#07614A", // Taptap Send Dark Green
    descEn: "International money transfer with low fees. Ideal for supporters outside Lebanon.",
    descAr: "خدمة تحويل أموال دولية بدون رسوم مرتفعة. مثالية للمقيمين خارج لبنان.",
    detailEn: "Details coming soon.",
    detailAr: "سيتم إضافة التفاصيل قريباً.",
    noteEn: "A direct transfer link will be published here.",
    noteAr: "رابط التحويل المباشر سيُنشر هنا.",
  },
  {
    name: "Patreon",
    accent: "#FF424D", // Patreon Coral/Red
    descEn: "Monthly recurring support via Patreon. Subscribe at any amount to sustain the platform long-term.",
    descAr: "دعم شهري منتظم عبر Patreon. يتيح لك الاشتراك بمبلغ رمزي شهري لدعم استمرار المنصة.",
    detailEn: "Details coming soon.",
    detailAr: "سيتم إضافة التفاصيل قريباً.",
    noteEn: "Our Patreon page link will be published here.",
    noteAr: "رابط صفحة Patreon سيُنشر هنا.",
  },
];

export default function Support() {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      <TopNav title={isRtl ? "ادعمنا" : "Support Us"} showBack />

      <main className="flex-1 flex flex-col pt-20 md:pt-28">
        {/* Hero Section */}
        <section className="px-5 pb-12 md:pb-16 text-center max-w-3xl mx-auto w-full">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-6 md:mb-8"
              style={{
                backgroundColor: "rgba(0,166,81,0.08)",
                border: "1px solid rgba(0,166,81,0.2)",
                color: "#00a651",
              }}
            >
              <Heart className="w-4 h-4" />
              {isRtl ? "ادعم المنصة" : "Support the platform"}
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-5 leading-tight">
              {isRtl ? "ادعمنا" : "Support Us"}
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto mb-8">
              {isRtl
                ? "معكن منصة غير ربحية مبنية بجهود متطوعة. دعمك يساعدنا على الاستمرار وتطوير الخدمة لمن يحتاجها."
                : "Maakon is a nonprofit platform built by volunteers. Your support helps us keep the service running and free for everyone who needs it."}
            </p>
          </motion.div>
        </section>

        {/* Why Support Matters */}
        <section className="px-5 pb-12 max-w-4xl mx-auto w-full">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="rounded-2xl p-6 md:p-8 text-center md:text-start"
            style={{
              backgroundColor: "rgba(0,166,81,0.04)",
              border: "1px solid rgba(0,166,81,0.1)",
            }}
          >
            <h2 className="text-xl font-bold text-slate-900 mb-3 block">
              {isRtl ? "لماذا نحتاج دعمك؟" : "Why your support matters"}
            </h2>
            <p className="text-slate-600 leading-relaxed">
              {isRtl
                ? "بناء منصة موثوقة وآمنة يتطلب بنية تحتية، فريق عمل، وصيانة مستمرة. كل مساهمة — مهما كان حجمها — تساعدنا على إبقاء المنصة مجانية وفي متناول الجميع."
                : "Building a safe and reliable platform requires infrastructure, maintenance, and a dedicated team. Every contribution — no matter the size — helps us keep Maakon free and accessible to all."}
            </p>
          </motion.div>
        </section>

        {/* Payment Methods */}
        <section className="px-5 pb-16 md:pb-20 max-w-4xl mx-auto w-full flex-1">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {METHODS.map((method) => (
              <motion.div
                key={method.name}
                variants={fadeUp}
                className="bg-white border border-slate-100 rounded-2xl overflow-hidden flex flex-col shadow-sm"
              >
                {/* Accent Top Bar */}
                <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: method.accent }} />

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h3
                      className="text-xl font-extrabold tracking-tight"
                      style={{ color: method.accent }}
                    >
                      {method.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-1">
                    {isRtl ? method.descAr : method.descEn}
                  </p>

                  {/* Payment Details Box */}
                  {method.isReady ? (
                    <div
                      className="rounded-xl p-4 border flex flex-col gap-3 mt-auto"
                      style={{
                        backgroundColor: `${method.accent}0A`,
                        borderColor: `${method.accent}30`,
                      }}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[12px] text-slate-500 font-medium">{isRtl ? "الاسم" : "Name"}</span>
                        <span className="text-[13px] font-bold text-slate-800" dir="ltr">{method.details?.name}</span>
                      </div>
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[12px] text-slate-500 font-medium">{isRtl ? "الهاتف" : "Phone"}</span>
                        <span className="text-[13px] font-bold text-slate-800 font-mono tracking-tight" dir="ltr">{method.details?.phone}</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="rounded-xl p-4 border border-dashed flex flex-col items-center justify-center gap-2 mt-auto"
                      style={{
                        backgroundColor: "#f8fafc",
                        borderColor: "#cbd5e1",
                      }}
                    >
                      <div className="flex flex-col items-center gap-1.5 justify-center">
                        <Clock className="w-5 h-5 text-slate-400" />
                        <span className="text-[13px] font-bold text-slate-500">
                          {isRtl ? method.detailAr : method.detailEn}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 text-center font-medium mt-1">
                        {isRtl ? method.noteAr : method.noteEn}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Reassurance */}
        <section className="px-5 pb-16 max-w-3xl mx-auto w-full text-center">
          <p className="text-slate-500 text-sm leading-relaxed">
            {isRtl
              ? "نسعى لإضافة طرق دفع إضافية قريباً. إذا كنت ترغب بالدعم بطريقة أخرى، تواصل معنا."
              : "More payment options are on the way. If you'd like to support in another way, feel free to reach out."}{" "}
            <Link
              href="/contact"
              className="font-bold underline underline-offset-4 hover:opacity-80 transition-opacity"
              style={{ color: "#00a651" }}
            >
              {isRtl ? "تواصل معنا" : "Contact Us"}
            </Link>
          </p>
        </section>
      </main>

      {/* Reusable Footer */}
      <Footer />
    </div>
  );
}

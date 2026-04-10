"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import WaitlistForm from "@/components/WaitlistForm";
import { HandHeart, ShieldCheck, Smartphone, Users, HelpCircle, HeartHandshake, Shield } from "lucide-react";

const content = {
  ar: {
    dir: "rtl",
    lang: "ar",
    nav: { join: "انضم الآن", langToggle: "English" },
    badge: "المنصة قيد التطوير",
    hero: {
      title1: "قريباً —",
      title2: "اطلاق منصة معكن",
      subtitle: "منصة لبنانية تربط من يحتاج المساعدة بمن يريد تقديمها. سجّل الآن لتكون أول من يعلم عند الإطلاق.",
      cta: "انضم إلى قائمة الانتظار",
      learn: "اكتشف المزيد",
    },
    features: {
      title: "ميزة المنصة",
      sub: "نسعى لبناء جسر آمن وفعال بين المحتاجين والمتبرعين.",
      cards: [
        { title: "لمن يحتاج المساعدة", desc: "طريقة سهلة وآمنة لطلب ما تحتاجه في أي وقت بخصوصية تامة ودون تعقيدات." },
        { title: "لمن يريد المساعدة", desc: "توجيه الجهد والموارد للمكان الصحيح مع التأكد من وصولها للمحتاج الفعلي." },
        { title: "للجمعيات والمنظّمات", desc: "أدوات مخصصة لتنظيم عمليات التوزيع وإدارة المتطوعين على الأرض بكفاءة." },
      ],
    },
    trust: {
      title1: "سلامتك وخصوصية بياناتك",
      title2: "على رأس أولوياتنا",
      sub: "لقد صممنا منصة معكن لتكون آمنة، بسيطة الاستخدام، وتحترم خصوصيتك في أصعب الظروف.",
      points: [
        "بياناتك مشفرة ومحفوظة بسرية تامة.",
        "تواصل آمن بدون وسائط غير موثوقة.",
        "تجربة مصممة لتكون سريعة جداً على الهواتف.",
      ],
    },
    faq: {
      title: "الأسئلة الشائعة",
      items: [
        { q: "ما هي منصة معكن؟", a: "معكن هي مبادرة تقنية تهدف إلى الربط ما بين المحتاجين والجهات المانحة أو الأفراد الراغبين بالمساعدة بشكل منظم يراعي الخصوصية." },
        { q: "متى سيتم إطلاق المنصة؟", a: "نحن نعمل على إنهاء الاختبارات النهائية لضمان أمان المنصة للمستخدمين، وسيتم الإعلان عن الإطلاق للمنضمين إلى قائمة الانتظار قريباً." },
        { q: "كيف سيتم استخدام معلوماتي؟", a: "لن يتم مشاركة أرقام الهواتف أو معلوماتك مع أي جهات خارجية. سيتم استخدامها فقط لإعلامك فور جهوزية المنصة." },
      ],
    },
  },
  en: {
    dir: "ltr",
    lang: "en",
    nav: { join: "Join Now", langToggle: "عربي" },
    badge: "Platform in development",
    hero: {
      title1: "Coming Soon —",
      title2: "Maakon is launching",
      subtitle: "A Lebanese platform connecting people in need with donors, volunteers, and NGOs. Sign up now to be the first to know when we go live.",
      cta: "Join the Waitlist",
      learn: "Learn More",
    },
    features: {
      title: "What Maakon Does",
      sub: "We're building a safe and effective bridge between those in need and those who want to help.",
      cards: [
        { title: "For Those in Need", desc: "A simple, private way to request help at any time — no red tape, no exposure." },
        { title: "For Those Who Want to Help", desc: "Direct your resources to the right place and ensure aid reaches the real beneficiaries." },
        { title: "For NGOs & Organizations", desc: "Dedicated tools to coordinate distribution and manage volunteers on the ground efficiently." },
      ],
    },
    trust: {
      title1: "Your safety and privacy",
      title2: "are our top priority",
      sub: "Maakon is designed to be secure, easy to use, and respectful of your privacy in the hardest moments.",
      points: [
        "Your data is encrypted and kept strictly confidential.",
        "Safe communication without unreliable intermediaries.",
        "A mobile-first experience built for speed.",
      ],
    },
    faq: {
      title: "Frequently Asked Questions",
      items: [
        { q: "What is Maakon?", a: "Maakon is a tech initiative connecting people in need with donors, individuals, and NGOs in an organized, privacy-first way." },
        { q: "When does the platform launch?", a: "We're finalizing testing to ensure the platform is safe and reliable. Waitlist members will be the first to know." },
        { q: "How will my information be used?", a: "Your phone number or email will never be shared with third parties. They are used solely to notify you when we launch." },
      ],
    },
  },
};


export default function Home() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const t = content[lang];

  const featureIcons = [HandHeart, HeartHandshake, Users];

  const switchLang = (newLang: "ar" | "en") => {
    setLang(newLang);
    const t = content[newLang];
    document.documentElement.lang = t.lang;
    document.documentElement.dir = t.dir;
  };

  return (
    <>
      <Nav
        lang={lang}
        onToggleLang={() => switchLang(lang === "ar" ? "en" : "ar")}
        ctaHref="#waitlist"
      />

      <main className="flex-1 flex flex-col pt-16">
        {/* HERO */}
        <section className="px-4 py-16 md:py-24 text-center max-w-4xl mx-auto flex flex-col items-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-8"
            style={{ backgroundColor: "rgba(0,166,81,0.08)", border: "1px solid rgba(0,166,81,0.2)", color: "#00a651" }}
          >
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: "#00a651" }}
              />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "#00a651" }} />
            </span>
            {t.badge}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight mb-6">
            {t.hero.title1}
            <br />
            <span className="font-extrabold" style={{ color: "#ed1c24" }}>{t.hero.title2}</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed">
            {t.hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full sm:w-auto">
            <a
              href="#waitlist"
              className="w-full sm:w-auto px-8 py-4 text-white rounded-full font-bold text-lg transition-all bg-[#00a651] hover:bg-[#008a44]"
              style={{ boxShadow: "0 8px 24px rgba(0,166,81,0.25)" }}
            >
              {t.hero.cta}
            </a>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-full font-bold text-lg transition-all"
            >
              {t.hero.learn}
            </a>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="px-4 py-16 md:py-24 bg-white border-y border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">{t.features.title}</h2>
              <p className="text-slate-500 mt-4 max-w-2xl mx-auto">{t.features.sub}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {t.features.cards.map((card, i) => {
                const Icon = featureIcons[i];
                return (
                  <div key={i} className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col items-center text-center">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                      style={{ backgroundColor: "rgba(0,166,81,0.1)", color: "#00a651" }}
                    >
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-3">{card.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{card.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* TRUST & SAFETY */}
        <section className="px-4 py-16 md:py-24 text-white" style={{ backgroundColor: "#1a2e1a" }}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6 text-center md:text-start">
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                {t.trust.title1}
                <br />
                <span style={{ color: "#00a651" }}>{t.trust.title2}</span>
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed max-w-lg mx-auto md:mx-0">
                {t.trust.sub}
              </p>
              <ul className="space-y-4 pt-4">
                {[ShieldCheck, Shield, Smartphone].map((Icon, i) => (
                  <li key={i} className="flex gap-4 items-center">
                    <div
                      className="p-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: "rgba(0,166,81,0.15)", color: "#00a651" }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-slate-200">{t.trust.points[i]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* WAITLIST FORM */}
        <section id="waitlist" className="px-4 py-16 md:py-24 relative overflow-hidden bg-white">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="relative max-w-5xl mx-auto z-10 w-full px-4">
            <WaitlistForm lang={lang} />
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 py-16 md:py-24 bg-slate-50 border-t border-slate-100">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900">{t.faq.title}</h2>
            </div>
            <div className="space-y-4">
              {t.faq.items.map((item, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-2">
                    <HelpCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#00a651" }} />
                    {item.q}
                  </h3>
                  <p className="text-slate-600" style={{ marginInlineStart: "1.75rem" }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

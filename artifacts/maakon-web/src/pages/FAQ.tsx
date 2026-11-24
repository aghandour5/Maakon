import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowRight, HelpCircle, LifeBuoy, ShieldCheck } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import Footer from "@/components/layout/Footer";

const FAQS = [
  {
    categoryEn: "Basics",
    categoryAr: "الأساسيات",
    questionEn: "What is Maakon?",
    questionAr: "ما هي معكن؟",
    answerEn: "Maakon helps people in Lebanon post urgent requests for help and find organizations on the map. If you want to give, Maakon can help you find an approved organization near you.",
    answerAr: "تساعد معكن الناس في لبنان على نشر طلبات المساعدة العاجلة والعثور على المنظمات على الخريطة. وإذا أردت تقديم المساعدة، يمكنك العثور على منظمة قريبة معتمدة للإحالة.",
  },
  {
    categoryEn: "Basics",
    categoryAr: "الأساسيات",
    questionEn: "Is Maakon free to use?",
    questionAr: "هل استخدام معكن مجاني؟",
    answerEn: "Yes. You can post a request, browse the map, and look up organizations to give through for free.",
    answerAr: "نعم. يمكنك نشر طلب مساعدة وتصفّح الخريطة والبحث عن منظمات لتقديم المساعدة من خلالها مجاناً.",
  },
  {
    categoryEn: "Aid",
    categoryAr: "المساعدة",
    questionEn: "Does Maakon deliver aid directly?",
    questionAr: "هل تقدم معكن المساعدات مباشرة؟",
    answerEn: "Maakon connects people who need help with organizations that may be able to provide it. Each organization coordinates its own contributions.",
    answerAr: "تربط معكن الأشخاص الذين يحتاجون إلى المساعدة بمنظمات قد تتمكن من تقديمها. وتتولّى كل منظمة تنسيق المساهمات الخاصة بها.",
  },
  {
    categoryEn: "Posting",
    categoryAr: "النشر",
    questionEn: "Who can post a need or offer?",
    questionAr: "من يمكنه نشر طلب أو عرض؟",
    answerEn: "Individuals and organizations can post requests for help. Organization accounts can also publish offers. Individuals who want to give can contact an approved organization through the “I Want to Help” page.",
    answerAr: "يمكن للأفراد والمنظمات نشر طلبات المساعدة. ويمكن لحسابات المنظمات أيضاً نشر عروض المساعدة. ويستطيع الأفراد الراغبون في تقديم المساعدة التواصل مع منظمة معتمدة عبر صفحة «أريد أن أساعد».",
  },
  {
    categoryEn: "Privacy",
    categoryAr: "الخصوصية",
    questionEn: "Will my exact location be public?",
    questionAr: "هل سيظهر موقعي الدقيق للعلن؟",
    answerEn: "The map shows an approximate location for an individual request. Organizations can choose to share a more precise public location for their posts.",
    answerAr: "تعرض الخريطة موقعاً تقريبياً لطلبات الأفراد. ويمكن للمنظمات اختيار مشاركة موقع عام أكثر دقة في منشوراتها.",
  },
  {
    categoryEn: "Contact",
    categoryAr: "التواصل",
    questionEn: "How do people contact each other?",
    questionAr: "كيف يتواصل الناس مع بعضهم؟",
    answerEn: "Individual requests keep contact details private. Verified organizations can view them for open requests, and Maakon records each view. To give, use the public contact details listed for approved organizations.",
    answerAr: "تبقى بيانات التواصل في طلبات الأفراد خاصة. يمكن للمنظمات الموثّقة الاطّلاع عليها للطلبات المفتوحة، وتسجّل معكن كل عملية اطّلاع. ولتقديم المساعدة، استخدم بيانات التواصل العامة للمنظمات المعتمدة للإحالة.",
  },
  {
    categoryEn: "Trust",
    categoryAr: "الثقة",
    questionEn: "What does a verified NGO badge mean?",
    questionAr: "ماذا تعني شارة المنظمة الموثقة؟",
    answerEn: "It means an organization has been reviewed by the Maakon admin team. The badge helps people identify organizations with an extra trust signal.",
    answerAr: "تعني أن المنظمة تمت مراجعتها من قبل فريق إدارة معكن. تساعد الشارة الناس على تمييز المنظمات التي لديها إشارة ثقة إضافية.",
  },
  {
    categoryEn: "Posts",
    categoryAr: "المنشورات",
    questionEn: "Can I edit or remove my post later?",
    questionAr: "هل يمكنني تعديل أو حذف منشوري لاحقاً؟",
    answerEn: "Yes. After signing in, you can manage your own posts from the My Posts page.",
    answerAr: "نعم. بعد تسجيل الدخول، يمكنك إدارة منشوراتك من صفحة منشوراتي.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function FAQ() {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      <TopNav title={isRtl ? "الأسئلة الشائعة" : "FAQs"} showBack />

      <main className="flex-1 pt-10 md:pt-14">
        <section className="px-5 pb-10 text-center max-w-3xl mx-auto">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-6 bg-emerald-50 text-emerald-700 border border-emerald-100">
              <HelpCircle className="w-4 h-4" aria-hidden="true" />
              {isRtl ? "مركز المساعدة" : "Help center"}
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-5 leading-tight">
              {isRtl ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto">
              {isRtl
                ? "إجابات واضحة عن استخدام معكن، الخصوصية، النشر، والتواصل."
                : "Clear answers about using Maakon, privacy, posting, and contacting others."}
            </p>
          </motion.div>
        </section>

        <section className="px-5 pb-10 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <ShieldCheck className="w-6 h-6 text-emerald-600 mb-3" aria-hidden="true" />
              <h2 className="font-black text-slate-900 mb-1">
                {isRtl ? "السلامة أولاً" : "Safety First"}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                {isRtl
                  ? "نحمي المواقع الدقيقة للأشخاص الذين يطلبون المساعدة."
                  : "Exact locations for people requesting help are protected."}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <LifeBuoy className="w-6 h-6 text-red-500 mb-3" aria-hidden="true" />
              <h2 className="font-black text-slate-900 mb-1">
                {isRtl ? "تحتاج جواباً آخر؟" : "Need Another Answer?"}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                {isRtl
                  ? "يمكنك التواصل معنا إذا لم تجد ما تبحث عنه هنا."
                  : "Contact us if you do not find what you are looking for here."}
              </p>
            </div>
          </div>
        </section>

        <section className="px-5 pb-16 md:pb-20 max-w-3xl mx-auto">
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.questionEn}
                className="group rounded-lg border border-slate-200 bg-white px-5 py-4 text-start shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-wide text-emerald-600 mb-1">
                      {isRtl ? faq.categoryAr : faq.categoryEn}
                    </span>
                    <span className="block text-base font-bold text-slate-900">
                      {isRtl ? faq.questionAr : faq.questionEn}
                    </span>
                  </span>
                  <span className="text-xl leading-none text-emerald-600 transition-transform group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  {isRtl ? faq.answerAr : faq.answerEn}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-5 pb-16 text-center">
          <Link
            href="/contact"
            className="inline-flex w-60 max-w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white transition-transform active:scale-95 hover:bg-emerald-700"
          >
            {isRtl ? "تواصل معنا" : "Contact Us"}
            <ArrowRight className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} aria-hidden="true" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}

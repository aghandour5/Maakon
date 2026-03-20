import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { TopNav } from "@/components/layout/TopNav";
import { MapPin, HeartHandshake, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <div className="h-dvh bg-background relative overflow-hidden flex flex-col">
      {/* Ambient gradients — no background image to avoid loading flicker */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-destructive/5 blur-3xl pointer-events-none" />

      <TopNav transparent />

      <main className="flex-1 flex flex-col items-center justify-center px-4 z-10 pt-16 pb-6 overflow-y-auto">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10 max-w-sm w-full"
        >
          <div className="inline-flex items-center justify-center w-18 h-18 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/20 mb-5 w-20 h-20">
            <span className="text-primary-foreground font-bold text-4xl leading-none pt-1">
              {isRtl ? "م" : "M"}
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            {t("app_name")}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            {t("home_subtitle")}
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="w-full max-w-sm flex flex-col gap-3"
        >
          {/* I need help */}
          <Link href="/need/new" className="block w-full group">
            <div className="w-full bg-destructive text-destructive-foreground p-5 rounded-2xl shadow-lg shadow-destructive/15 flex items-center gap-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-active:translate-y-0 group-active:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className={isRtl ? "text-right" : "text-left"}>
                <div className="text-xl font-bold leading-tight">{t("i_need_help")}</div>
                <div className="text-white/80 text-sm mt-0.5">
                  {isRtl ? "طلب طعام، مأوى، دواء..." : "Request food, shelter, meds..."}
                </div>
              </div>
            </div>
          </Link>

          {/* I want to help */}
          <Link href="/offer/new" className="block w-full group">
            <div className="w-full bg-success text-success-foreground p-5 rounded-2xl shadow-lg shadow-success/15 flex items-center gap-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-active:translate-y-0 group-active:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-6 h-6 text-white" />
              </div>
              <div className={isRtl ? "text-right" : "text-left"}>
                <div className="text-xl font-bold leading-tight">{t("i_want_to_help")}</div>
                <div className="text-white/80 text-sm mt-0.5">
                  {isRtl ? "تقديم موارد أو خدمات مجانية" : "Offer resources or free services"}
                </div>
              </div>
            </div>
          </Link>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-background text-muted-foreground font-medium">
                {isRtl ? "أو" : "OR"}
              </span>
            </div>
          </div>

          {/* View map */}
          <Link href="/map" className="block w-full group">
            <div className="w-full bg-card border-2 border-border text-foreground p-4 rounded-2xl flex items-center justify-center gap-2.5 font-semibold transition-colors duration-150 group-hover:border-primary/40 group-hover:bg-secondary/60">
              <MapPin className="w-5 h-5 text-primary" />
              <span>{t("view_map")}</span>
            </div>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}

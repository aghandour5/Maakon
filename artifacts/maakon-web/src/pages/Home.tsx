import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { TopNav } from "@/components/layout/TopNav";
import { MapPin, HeartHandshake, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage: `url('${import.meta.env.BASE_URL}images/pattern-bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Subtle ambient gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-destructive/5 blur-3xl" />

      <TopNav transparent />

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 z-10 pt-16 pb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 max-w-xl mx-auto"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/20 mb-6">
             <span className="text-primary-foreground font-bold text-4xl leading-none pt-1">
                {isRtl ? 'م' : 'M'}
              </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
            {t('app_name')}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            {t('home_subtitle')}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md flex flex-col gap-4"
        >
          <Link href="/need/new" className="w-full">
            <button className="w-full group relative overflow-hidden bg-destructive hover:bg-destructive/90 text-destructive-foreground p-6 rounded-2xl shadow-lg shadow-destructive/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-right text-left flex items-center justify-between">
              <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''} w-full`}>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <div className={`flex flex-col ${isRtl ? 'text-right' : 'text-left'}`}>
                  <span className="text-2xl font-bold">{t('i_need_help')}</span>
                  <span className="text-white/80 text-sm mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    {isRtl ? 'طلب طعام، مأوى، دواء...' : 'Request food, shelter, meds...'}
                  </span>
                </div>
              </div>
            </button>
          </Link>

          <Link href="/offer/new" className="w-full">
            <button className="w-full group bg-success hover:bg-success/90 text-success-foreground p-6 rounded-2xl shadow-lg shadow-success/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-right flex items-center justify-between">
               <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''} w-full`}>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <HeartHandshake className="w-8 h-8 text-white" />
                </div>
                <div className={`flex flex-col ${isRtl ? 'text-right' : 'text-left'}`}>
                  <span className="text-2xl font-bold">{t('i_want_to_help')}</span>
                  <span className="text-white/80 text-sm mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                     {isRtl ? 'تقديم موارد أو خدمات مجانية' : 'Offer resources or free services'}
                  </span>
                </div>
              </div>
            </button>
          </Link>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/80"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">{isRtl ? 'أو' : 'OR'}</span>
            </div>
          </div>

          <Link href="/map" className="w-full">
            <button className="w-full bg-card border-2 border-border hover:border-primary/50 text-foreground p-5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-3 font-semibold text-lg">
              <MapPin className="w-6 h-6 text-primary" />
              {t('view_map')}
            </button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}

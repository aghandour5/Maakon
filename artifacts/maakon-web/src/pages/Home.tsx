import { useState } from "react"; // we use useState to manage the state of the mobile menu and the current language direction (RTL or LTR).
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { MapPin, HeartHandshake, AlertTriangle, ArrowLeft, ArrowRight, Globe, Menu, X, LogOut, ShieldAlert, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGate } from "@/hooks/useAuthGate";
import Footer from "@/components/layout/Footer";

// ── Minimal Animation Variants ──────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Home() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, openAuthModal, logout } = useAuth();
  const { requireAuth } = useAuthGate();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language.startsWith("ar") ? "en" : "ar");
  };

  const navLinks = [
    { label: isRtl ? "الرئيسية" : "Home", href: "/" },
    { label: isRtl ? "الخريطة" : "Map", href: "/map" },
    ...(isAuthenticated ? [{ label: isRtl ? "منشوراتي" : "My Posts", href: "/my-posts" }] : []),
    { label: isRtl ? "حول" : "About", href: "/about" },
    { label: isRtl ? "تواصل معنا" : "Contact Us", href: "/contact" },
    { label: isRtl ? "ادعمنا" : "Support Us", href: "/support", icon: <Heart className="w-3.5 h-3.5 mr-1 inline-block" aria-hidden="true" /> },
  ];

  return (
    <div
      className="min-h-dvh flex flex-col relative home-bg-container"
      style={{
        backgroundImage: `
          linear-gradient(135deg, rgba(1,15,10,0.85) 0%, rgba(5, 46, 35, 0.8) 50%, rgba(1,15,10,0.9) 100%),
          url('/Lebanon-Background.png')
        `,
        backgroundSize: "200% 200%, cover",
        backgroundRepeat: "no-repeat",
        animation: "homeGradient 10s ease infinite",
        backgroundBlendMode: "multiply",
      }}
    >
      <style>{`
        .home-bg-container {
          background-position: 0% 0%, center;
          position: relative;
        }
        .home-bg-container::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.15) 0%, transparent 60%);
          pointer-events: none;
          z-index: 1;
        }
        @media (max-width: 640px) {
          .home-bg-container {
            background-position: 0% 0%, 60% center;
          }
        }
        @keyframes homeGradient {
          0%   { background-position: 0% 0%, center; }
          50%  { background-position: 100% 100%, center; }
          100% { background-position: 0% 0%, center; }
        }
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(220, 38, 38, 0.3); }
          50% { transform: scale(1.02); box-shadow: 0 12px 48px rgba(220, 38, 38, 0.5); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s ease-in-out infinite;
        }
        .glass-premium {
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
      `}</style>
      {/* ── Top nav ──────────────────────────────────────────────────────────── */}
      <header className="relative z-50 shrink-0 px-4 pt-6 sm:pt-8">
        <div className="flex items-center justify-between h-16 sm:h-20 px-5 sm:px-8 rounded-2xl mx-auto max-w-6xl border border-white/10 bg-white/5 shadow-sm">
          {/* Brand */}
          <Link href="/" className="shrink-0 flex items-center gap-2 sm:gap-4 group">
            <img src={isRtl ? "/logoNavbarRtl.svg" : "/logoNavbar.svg"} alt="Maakon" className="h-8 sm:h-12 w-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform" style={{ filter: "brightness(0) invert(1)" }} />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-emerald-50 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap flex items-center gap-1.5"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {!isAuthenticated ? (
              <button
                onClick={openAuthModal}
                className="hidden sm:flex items-center gap-1.5 px-4 h-9 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 shadow-sm"
                style={{ background: "#ed1c24" }}
              >
                {t("sign_in")}
              </button>
            ) : (
              <button
                onClick={logout}
                className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-xl font-bold text-xs bg-white/10 text-white/90 hover:bg-white/15 transition-colors border border-white/20"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                {user?.displayName || (user?.accountType === "ngo" ? "NGO" : "User")}
              </button>
            )}

            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-white sm:text-emerald-50 hover:text-white text-sm font-semibold bg-black/20 backdrop-blur-md sm:bg-transparent sm:backdrop-blur-none sm:hover:bg-white/10 transition-colors"
              aria-label={isRtl ? "Switch to English" : "تغيير اللغة إلى العربية"}
            >
              <Globe className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline-block">{isRtl ? "English" : "عربي"}</span>
              <span className="inline-block sm:hidden">{isRtl ? "EN" : "عربي"}</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden flex items-center justify-center w-9 h-9 rounded-xl text-white hover:text-white bg-black/20 backdrop-blur-md hover:bg-black/30 transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-4 right-4 mt-2 p-3 rounded-2xl sm:hidden z-50 border border-white/10 bg-emerald-950/95 backdrop-blur-2xl shadow-2xl"
            >
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-bold text-emerald-50 bg-white/5 hover:text-white hover:bg-white/20 transition-all text-center flex items-center justify-center gap-2"
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
                <div className="border-t border-white/10 mt-2 pt-2">
                  {!isAuthenticated ? (
                    <button
                      onClick={() => { setMobileMenuOpen(false); openAuthModal(); }}
                      className="w-full px-4 py-3 shadow-lg rounded-xl text-sm font-bold bg-white text-emerald-900 hover:bg-emerald-50 transition-colors text-center"
                    >
                      {t("sign_in")}
                    </button>
                  ) : (
                    <button
                      onClick={() => { setMobileMenuOpen(false); logout(); }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-red-100 bg-red-500/20 hover:bg-red-500/30 transition-colors text-center"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 pb-16 pt-8 sm:pt-14 gap-6">
        {/* Logo Focus */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-center px-2 flex flex-col items-center"
        >
          <img
            src="/logo.svg"
            alt="Maakon Logo"
            className="h-28 sm:h-40 md:h-56 w-auto object-contain mb-4 sm:mb-6 drop-shadow-[0_35px_60px_rgba(0,0,0,0.2)]"
          />
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-normal text-emerald-50/90 leading-none tracking-tight max-w-lg mx-auto drop-shadow-sm [&>strong]:font-bold [&>strong]:font-arabic [&>strong]:text-[#00A651] [&>strong]:[text-shadow:0_1px_4px_rgba(0,0,0,0.15)]"
            dangerouslySetInnerHTML={{ __html: t("home_tagline") }}
          />
        </motion.div>

        {/* Action Buttons Container */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.1 }}
          className="w-full max-w-sm flex flex-col gap-4 mt-2"
        >
          {/* I Need Help (Flag Red) */}
          <button
            onClick={requireAuth(() => setLocation('/need/new'))}
            className="w-full relative overflow-hidden rounded-3xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 bg-red-600 hover:bg-red-700 transition-all shadow-lg group animate-pulse-subtle"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 bg-white/20 shadow-inner" aria-hidden="true">
              <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>

            <div className={`flex-1 min-w-0 ${isRtl ? "text-right" : "text-left"}`}>
              <div className="text-xl sm:text-2xl font-black text-white leading-tight">{t("i_need_help")}</div>
              <div className="text-red-100 font-medium text-xs sm:text-sm mt-0.5 opacity-90">
                {isRtl ? "طلب طعام، مأوى، دواء..." : "Request food, shelter, meds..."}
              </div>
            </div>

            <div className={`shrink-0 text-white opacity-80 group-hover:opacity-100 group-hover:-translate-x-1 transition-all ${isRtl ? "rotate-180 group-hover:translate-x-1" : ""}`} aria-hidden="true">
              <ArrowRight className="w-6 h-6" />
            </div>
          </button>

          {/* I Want to Help (White/Green) */}
          <button
            onClick={requireAuth(() => setLocation('/offer/new'))}
            className="w-full relative overflow-hidden rounded-3xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 bg-white hover:bg-emerald-50 transition-all shadow-lg group hover:shadow-emerald-500/20"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-50 shadow-inner" aria-hidden="true">
              <HeartHandshake className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
            </div>

            <div className={`flex-1 min-w-0 ${isRtl ? "text-right" : "text-left"}`}>
              <div className="text-xl sm:text-2xl font-black text-emerald-950 leading-tight">{t("i_want_to_help")}</div>
              <div className="text-emerald-700/80 font-medium text-xs sm:text-sm mt-0.5">
                {isRtl ? "تقديم موارد أو خدمات مجانية" : "Offer resources or free services"}
              </div>
            </div>

            <div className={`shrink-0 text-emerald-950 opacity-40 group-hover:opacity-100 group-hover:-translate-x-1 transition-all ${isRtl ? "rotate-180 group-hover:translate-x-1" : ""}`} aria-hidden="true">
              <ArrowRight className="w-6 h-6" />
            </div>
          </button>
        </motion.div>

        {/* View Map */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <Link href="/map" className="block focus:outline-none focus:ring-2 focus:ring-white/50 rounded-2xl">
            <div className="w-full rounded-2xl px-5 py-4 flex items-center justify-center gap-3 font-bold text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-colors shadow-sm">
              <MapPin className="w-5 h-5" />
              <span className="text-base tracking-wide">{t("view_map")}</span>
            </div>
          </Link>
        </motion.div>
      </main>

      <div className="relative z-10 w-full mt-auto">
        <Footer />
      </div>
    </div>
  );
}

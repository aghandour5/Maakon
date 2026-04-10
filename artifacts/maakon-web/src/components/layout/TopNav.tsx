import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Globe, ArrowRight, ArrowLeft, Menu, X, LogOut, User as UserIcon, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface TopNavProps {
  title?: string;
  showBack?: boolean;
}

export function TopNav({ title, showBack = false }: TopNavProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, openAuthModal, logout } = useAuth();

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
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-black/[0.03] shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
        {/* Left: back + Brand */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {showBack && (
            <button
              onClick={() => window.history.back()}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all shrink-0"
              aria-label="Back"
            >
              {isRtl ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : <ArrowLeft className="h-4 w-4" aria-hidden="true" />}
            </button>
          )}
          <Link href="/" className="shrink-0 no-underline mr-2 sm:mr-4 flex items-center gap-2 sm:gap-3 group">
            <img src="/logo.svg" alt="Maakon" className="h-5 sm:h-9 w-auto group-hover:scale-105 transition-transform" />
            <div className="flex flex-col justify-center">
              <span className="text-slate-900 font-extrabold leading-none text-sm sm:text-lg tracking-tight">Maakon</span>
              <span className="text-slate-600 text-[7px] sm:text-[10px] mt-0.5 font-bold tracking-tight sm:tracking-wide uppercase">Lebanon Crisis Response — معكن</span>
            </div>
          </Link>
          {title && (
            <span className="font-bold text-sm text-slate-500 truncate border-s border-slate-300 ps-3 hidden lg:inline-block">
              {title}
            </span>
          )}
        </div>

        {/* Desktop: Nav links */}
        <nav className="hidden sm:flex items-center gap-1 shrink-0">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-150 whitespace-nowrap flex items-center gap-1.5"
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
              className="hidden sm:flex items-center gap-1.5 px-3 h-8 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {t("sign_in")}
            </button>
          ) : (
            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-1.5 px-3 h-8 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline-block">{user?.displayName || (user?.accountType === "ngo" ? "NGO" : t("account_individual"))}</span>
              <span className="inline-block sm:hidden">{t("logout")}</span>
            </button>
          )}

          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shrink-0"
            aria-label={isRtl ? "Switch to English" : "تغيير اللغة إلى العربية"}
          >
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            <span className="hidden sm:inline-block">{i18n.language.startsWith("ar") ? "English" : "عربي"}</span>
            <span className="inline-block sm:hidden">{i18n.language.startsWith("ar") ? "EN" : "عربي"}</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden flex items-center justify-center w-8 h-8 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-4 right-4 mt-2 p-2 rounded-2xl bg-white sm:hidden border border-black/5"
            style={{
              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
            }}
          >
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all text-center flex items-center justify-center gap-2"
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-slate-100 mt-2 pt-2">
                {!isAuthenticated ? (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal();
                    }}
                    className="w-full px-4 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground text-center"
                  >
                    {t("sign_in")}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-destructive bg-destructive/10 text-center"
                    aria-label="Logout"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    {t("logout")}
                  </button>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

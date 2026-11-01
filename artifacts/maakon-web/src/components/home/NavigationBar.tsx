import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Globe, Menu, X, LogOut, Heart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/layout/Logo";
import { LogoRtl } from "@/components/layout/LogoRtl";

interface NavLink {
  label: string;
  href: string;
  icon?: JSX.Element;
}

export default function NavigationBar() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, openAuthModal, logout } = useAuth();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language.startsWith("ar") ? "en" : "ar");
  };

  const navLinks: NavLink[] = [
    { label: isRtl ? "الرئيسية" : "Home", href: "/" },
    { label: isRtl ? "الخريطة" : "Map", href: "/map" },
    ...(isAuthenticated ? [{ label: isRtl ? "منشوراتي" : "My Posts", href: "/my-posts" }] : []),
    { label: isRtl ? "حول" : "About", href: "/about" },
    { label: isRtl ? "تواصل معنا" : "Contact Us", href: "/contact" },
    {
      label: isRtl ? "ادعمنا" : "Support Us",
      href: "/support",
      icon: <Heart className="w-3.5 h-3.5 mr-1 inline-block" aria-hidden="true" />,
    },
  ];

  return (
    <header className="relative z-50 shrink-0 px-4 pt-6 sm:pt-8">
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className="flex items-center justify-between h-16 sm:h-20 px-5 sm:px-8 rounded-2xl mx-auto max-w-6xl border border-white/10 bg-white/5 shadow-sm"
      >
        {/* Brand Logo */}
        <Link href="/" className={`shrink-0 flex items-center gap-2 sm:gap-4 group ${isRtl ? "translate-x-2 sm:translate-x-3" : ""}`}>
          {isRtl ? (
            <LogoRtl className="home-nav-logo h-8 sm:h-12 w-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform" />
          ) : (
            <Logo className="home-nav-logo h-8 sm:h-12 w-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform" />
          )}
        </Link>

        {/* Desktop Navigation */}
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

        {/* Right Side Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sign In / Logout (Desktop) */}
          {!isAuthenticated ? (
            <button
              onClick={openAuthModal}
              className="hidden sm:flex items-center gap-1.5 px-4 h-9 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ background: "#ed1c24" }}
            >
              {t("sign_in")}
            </button>
          ) : (
            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-xl font-bold text-xs bg-white/10 text-white/90 hover:bg-white/15 transition-colors border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              {user?.displayName || (user?.accountType === "ngo" ? "NGO" : "User")}
            </button>
          )}

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-white sm:text-emerald-50 hover:text-white text-sm font-semibold bg-black/20 backdrop-blur-md sm:bg-transparent sm:backdrop-blur-none sm:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label={isRtl ? "Switch to English" : "تغيير اللغة إلى العربية"}
            title={isRtl ? "Switch to English" : "تغيير اللغة إلى العربية"}
          >
            <Globe className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline-block">{isRtl ? "English" : "عربي"}</span>
            <span className="inline-block sm:hidden">{isRtl ? "EN" : "عربي"}</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden flex items-center justify-center w-9 h-9 rounded-xl text-white hover:text-white bg-black/20 backdrop-blur-md hover:bg-black/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-4 right-4 mt-2 p-3 rounded-2xl sm:hidden z-50 border border-white/10 bg-emerald-950/95 backdrop-blur-2xl shadow-2xl"
          >
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-bold text-emerald-50 bg-white/5 hover:text-white hover:bg-white/20 transition-all text-center flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-white/10 mt-2 pt-2">
                {!isAuthenticated ? (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal();
                    }}
                    className="w-full px-4 py-3 shadow-lg rounded-xl text-sm font-bold bg-white text-emerald-900 hover:bg-emerald-50 transition-colors text-center focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    {t("sign_in")}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-red-100 bg-red-500/20 hover:bg-red-500/30 transition-colors text-center focus:outline-none focus:ring-2 focus:ring-white/50"
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
  );
}

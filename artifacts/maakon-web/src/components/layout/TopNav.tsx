import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ArrowLeft, LogOut, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getHeaderNavItems } from "@/lib/nav-links";
import { Logo } from "./Logo";
import { LogoRtl } from "./LogoRtl";
import { LanguageToggle } from "./LanguageToggle";
import { MobileMenu } from "./MobileMenu";

interface TopNavProps {
  title?: string;
  showBack?: boolean;
}

export function TopNav({ title, showBack = false }: TopNavProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const { isAuthenticated, user, openAuthModal, logout } = useAuth();
  const navItems = getHeaderNavItems(isAuthenticated);
  const accountName = user?.displayName || t(user?.accountType === "ngo" ? "account_ngo" : "account_individual");

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-black/[0.03] shadow-sm transition-all">
      {/* Wraps instead of clipping when text is enlarged; the mobile menu panel is positioned against <header>. */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-2 min-h-16 sm:min-h-20 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          {showBack && (
            <button
              type="button"
              onClick={() => window.history.back()}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 focus-ring-on-light"
              aria-label={t("back")}
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </button>
          )}
          <Link
            href="/"
            aria-label={t("app_name")}
            className="no-underline shrink-0 flex items-center min-h-11 rounded-lg group focus-ring-on-light"
          >
            {isRtl ? (
              <LogoRtl className="h-7 sm:h-12 w-auto group-hover:scale-105 transition-transform" />
            ) : (
              <Logo className="h-7 sm:h-12 w-auto group-hover:scale-105 transition-transform" />
            )}
          </Link>
          {title && (
            <span className="font-bold text-sm text-slate-500 truncate max-w-56 border-s border-slate-300 ps-3 hidden md:inline-block xl:hidden">
              {title}
            </span>
          )}
        </div>

        <nav aria-label={t("main_nav_label")} className="hidden xl:flex items-center gap-1 shrink-0">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-h-11 px-3 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors whitespace-nowrap flex items-center gap-1.5 focus-ring-on-light"
            >
              {item.withHeartIcon && <Heart className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0 ms-auto xl:ms-0">
          {!isAuthenticated ? (
            <button
              type="button"
              onClick={openAuthModal}
              className="hidden xl:flex items-center min-h-11 px-4 rounded-xl font-bold text-sm text-white bg-action-need hover:bg-action-need-hover transition-colors focus-ring-on-light"
            >
              {t("sign_in")}
            </button>
          ) : (
            <button
              type="button"
              onClick={logout}
              className="hidden xl:flex items-center gap-1.5 min-h-11 px-3 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors focus-ring-on-light"
              aria-label={`${t("logout")} (${accountName})`}
              title={t("logout")}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="max-w-[6rem] truncate">{accountName}</span>
            </button>
          )}

          <LanguageToggle variant="light" />

          <MobileMenu
            items={navItems}
            variant="light"
            renderFooter={(close) =>
              !isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    close();
                    openAuthModal();
                  }}
                  className="w-full min-h-11 px-4 rounded-xl text-sm font-bold text-white bg-action-need hover:bg-action-need-hover transition-colors focus-ring-on-light"
                >
                  {t("sign_in")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    close();
                    logout();
                  }}
                  className="w-full min-h-11 flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-bold text-action-need bg-red-50 hover:bg-red-100 transition-colors focus-ring-on-light"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  {t("logout")}
                </button>
              )
            }
          />
        </div>
      </div>
    </header>
  );
}

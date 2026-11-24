import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { LogOut, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { getHeaderNavItems } from "@/lib/nav-links";

export default function NavigationBar() {
  const { t } = useTranslation();
  const { isAuthenticated, user, openAuthModal, logout } = useAuth();
  const navItems = getHeaderNavItems(isAuthenticated);
  const accountName = user?.displayName || t(user?.accountType === "ngo" ? "account_ngo" : "account_individual");

  return (
    <header className="relative z-50 shrink-0 px-4 pt-4 sm:pt-8">
      {/* Wraps instead of clipping when text is enlarged; the mobile menu panel is positioned against <header>. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 min-h-16 sm:min-h-20 px-4 sm:px-8 py-2 rounded-2xl mx-auto max-w-6xl border border-white/10 bg-white/5 shadow-sm">
        <Link
          href="/"
          className="shrink-0 flex items-center min-h-11 rounded-lg group focus-ring-on-dark"
        >
          {/* Official white wordmark; the lettering is artwork, so it doesn't depend on web fonts. */}
          <img
            src="/maakon-logo-white-250.webp"
            srcSet="/maakon-logo-white-250.webp 250w, /maakon-logo-white-500.webp 500w"
            sizes="(min-width: 640px) 124px, 83px"
            width={250}
            height={97}
            alt={t("app_name")}
            draggable={false}
            className="h-8 sm:h-12 w-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform"
          />
        </Link>

        <nav aria-label={t("main_nav_label")} className="hidden xl:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-h-11 px-3 rounded-xl text-sm font-semibold text-emerald-50 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap flex items-center gap-1.5 focus-ring-on-dark"
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
              className="hidden xl:flex items-center min-h-11 px-4 rounded-xl font-bold text-sm text-white bg-action-need hover:bg-action-need-hover transition-colors shadow-sm focus-ring-on-dark"
            >
              {t("sign_in")}
            </button>
          ) : (
            <button
              type="button"
              onClick={logout}
              className="hidden xl:flex items-center gap-1.5 min-h-11 px-3 rounded-xl font-bold text-xs bg-white/10 text-white hover:bg-white/15 transition-colors border border-white/20 focus-ring-on-dark"
              aria-label={`${t("logout")} (${accountName})`}
              title={t("logout")}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="max-w-[6rem] truncate">{accountName}</span>
            </button>
          )}

          <LanguageToggle variant="dark" />

          <MobileMenu
            items={navItems}
            variant="dark"
            renderFooter={(close) =>
              !isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    close();
                    openAuthModal();
                  }}
                  className="w-full min-h-11 px-4 rounded-xl text-sm font-bold bg-white text-emerald-900 hover:bg-emerald-50 transition-colors shadow-lg focus-ring-on-dark"
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
                  className="w-full min-h-11 flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-bold text-red-100 bg-red-500/20 hover:bg-red-500/30 transition-colors focus-ring-on-dark"
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

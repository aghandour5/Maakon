import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { FOOTER_NAV_ITEMS } from "@/lib/nav-links";

export default function Footer() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <footer className="w-full bg-emerald-950 text-emerald-100/80 py-6 md:py-12 px-6 border-t border-white/[0.03] mt-auto shrink-0 shadow-[0_-8px_32px_rgba(0,0,0,0.15)]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:flex-wrap items-center justify-between gap-3 md:gap-6">
        <div className="flex items-center gap-4 shrink-0">
          <img
            src="/logo.svg"
            alt=""
            draggable={false}
            className="h-8 w-auto brightness-0 invert opacity-70"
          />
          <div className="flex flex-col">
            <span className="text-white font-black leading-none text-base tracking-tight mb-1">
              Maakon
            </span>
            <span className="text-emerald-50/80 text-xs font-semibold">
              {t("footer_tagline")}
              {!isRtl && (
                <>
                  {" — "}
                  <span lang="ar" className="font-arabic">معكن</span>
                </>
              )}
            </span>
          </div>
        </div>

        <nav aria-label={t("footer_nav_label")} className="flex flex-wrap items-center justify-center gap-x-2 md:gap-x-4 text-sm font-medium">
          {FOOTER_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center min-h-11 px-2 rounded-lg text-emerald-100/80 hover:text-white transition-colors focus-ring-on-dark"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="text-xs text-emerald-100/80 text-center md:text-start font-medium">
          {t("footer_copyright", { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}

/**
 * LanguageToggle — switches between Arabic and English. Used by both site headers.
 * The label is written in the language it switches to, so speakers of that language can find it.
 * Variant "dark" is for the Home header over the flag background, "light" for the white TopNav.
 */
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

const VARIANT_CLASSES = {
  dark: "text-white bg-black/20 hover:bg-black/30 xl:bg-transparent xl:hover:bg-white/10 focus-ring-on-dark",
  light: "text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 focus-ring-on-light",
} as const;

export function LanguageToggle({ variant }: { variant: keyof typeof VARIANT_CLASSES }) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language.startsWith("ar");
  const label = isArabic ? "Switch to English" : "تغيير اللغة إلى العربية";

  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(isArabic ? "en" : "ar")}
      className={`flex items-center justify-center gap-1.5 min-h-11 min-w-11 px-3 rounded-xl text-sm font-semibold transition-colors ${VARIANT_CLASSES[variant]}`}
      aria-label={label}
      title={label}
    >
      <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
      {isArabic ? (
        <span lang="en">
          <span className="hidden sm:inline">English</span>
          <span className="sm:hidden">EN</span>
        </span>
      ) : (
        <span lang="ar">عربي</span>
      )}
    </button>
  );
}


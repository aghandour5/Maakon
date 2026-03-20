import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Globe, ArrowRight, ArrowLeft } from "lucide-react";

interface TopNavProps {
  title?: string;
  showBack?: boolean;
}

export function TopNav({ title, showBack = false }: TopNavProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language.startsWith("ar") ? "en" : "ar");
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/85 backdrop-blur-xl border-b border-black/5 shadow-sm">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Left: back + logo */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {showBack && (
            <button
              onClick={() => window.history.back()}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-black/5 transition-all shrink-0"
              aria-label="Back"
            >
              {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            </button>
          )}
          <Link href="/" className="flex items-center min-w-0 no-underline">
            <img
              src="/logo.png"
              alt="Maakon"
              className="h-11 w-auto object-contain rounded-lg"
            />
            {title && (
              <span className="font-bold text-sm text-foreground truncate ms-2 border-s border-black/10 ps-2">
                {title}
              </span>
            )}
          </Link>
        </div>

        {/* Right: language toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 h-7 rounded-full text-foreground/60 hover:text-foreground text-xs font-medium border border-black/10 hover:border-black/20 hover:bg-black/5 transition-all shrink-0"
        >
          <Globe className="w-3 h-3" />
          {i18n.language.startsWith("ar") ? "English" : "عربي"}
        </button>
      </div>
    </header>
  );
}

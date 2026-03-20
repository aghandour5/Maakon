import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Globe, ArrowRight, ArrowLeft } from "lucide-react";

interface TopNavProps {
  title?: string;
  showBack?: boolean;
  transparent?: boolean;
}

export function TopNav({ title, showBack = false, transparent = false }: TopNavProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith("ar") ? "en" : "ar";
    i18n.changeLanguage(newLang);
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-200 ${
        transparent
          ? "bg-transparent"
          : "bg-background/90 backdrop-blur-md border-b border-border/60"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Left cluster: back + logo */}
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <button
              onClick={() => window.history.back()}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-foreground hover:bg-secondary transition-colors shrink-0"
              aria-label="Back"
            >
              {isRtl ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
            </button>
          )}

          <Link href="/" className="flex items-center gap-2.5 no-underline min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shrink-0">
              <span className="text-primary-foreground font-bold text-lg leading-none pt-0.5">
                {isRtl ? "م" : "M"}
              </span>
            </div>
            <span
              className={`font-bold text-lg text-foreground truncate ${
                title ? "" : "hover:text-primary transition-colors"
              }`}
            >
              {title ?? t("app_name")}
            </span>
          </Link>
        </div>

        {/* Language toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="rounded-full px-3 h-8 border-border/60 hover:bg-secondary shrink-0 gap-1.5 transition-colors"
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">
            {i18n.language.startsWith("ar") ? "English" : "عربي"}
          </span>
        </Button>
      </div>
    </header>
  );
}

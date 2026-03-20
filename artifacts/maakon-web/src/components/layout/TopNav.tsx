import { Link, useLocation } from "wouter";
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
  const [, setLocation] = useLocation();
  const isRtl = i18n.dir() === "rtl";

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('ar') ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-200 ${
        transparent ? 'bg-transparent' : 'bg-background/80 backdrop-blur-md border-b border-border'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => window.history.back()}
              className="hover-elevate rounded-full"
            >
              {isRtl ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
            </Button>
          )}
          
          <Link href="/" className="flex items-center gap-2 no-underline group hover-elevate px-2 py-1 rounded-md">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-bold text-lg leading-none pt-1">
                {isRtl ? 'م' : 'M'}
              </span>
            </div>
            {title ? (
              <h1 className="font-bold text-lg text-foreground">{title}</h1>
            ) : (
              <h1 className="font-bold text-xl text-foreground tracking-tight group-hover:text-primary transition-colors">
                {t('app_name')}
              </h1>
            )}
          </Link>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleLanguage}
          className="rounded-full px-4 border-border/60 hover:bg-secondary/80 hover-elevate transition-all"
        >
          <Globe className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
          {i18n.language.startsWith('ar') ? 'English' : 'عربي'}
        </Button>
      </div>
    </header>
  );
}

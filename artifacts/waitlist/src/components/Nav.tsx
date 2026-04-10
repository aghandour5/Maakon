"use client";

interface NavProps {
  lang: "ar" | "en";
  onToggleLang: () => void;
  ctaHref: string;
}

export default function Nav({ lang, onToggleLang, ctaHref }: NavProps) {
  const isRtl = lang === "ar";
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center p-1" style={{ backgroundColor: "rgba(0,166,81,0.1)" }}>
            <img src="/logo.svg" alt="Maakon" className="w-full h-full object-contain" />
          </div>
          <span className="font-black text-xl tracking-tight text-slate-900">
            {isRtl ? "معكن" : "Maakon"}
          </span>
        </div>
        
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={onToggleLang}
            className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200"
          >
            {isRtl ? "English" : "عربي"}
          </button>
          <a
            href={ctaHref}
            className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold text-white transition-all shadow-sm bg-[#ed1c24] hover:bg-[#c8161d]"
          >
            {isRtl ? "انضم الآن" : "Join Now"}
          </a>
        </div>
      </div>
    </nav>
  );
}

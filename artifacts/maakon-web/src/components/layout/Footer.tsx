import React from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const currentYear = new Date().getFullYear();

  const NAV_LINKS = [
    { labelEn: "Support Us", labelAr: "ادعمنا", href: "/support" },
    { labelEn: "About Us", labelAr: "من نحن", href: "/about" },
    { labelEn: "Contact Us", labelAr: "تواصل معنا", href: "/contact" },
    { labelEn: "FAQs", labelAr: "الأسئلة الشائعة", href: "/#faq" }, // Placeholder route
  ];

  return (
    <footer className="w-full bg-emerald-950 text-emerald-100/60 py-12 px-6 border-t border-white/[0.03] mt-auto shrink-0 shadow-[0_-8px_32px_rgba(0,0,0,0.15)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 md:gap-6">
        
        {/* Brand */}
        <div className="flex items-center gap-4 shrink-0 transition-opacity hover:opacity-100 opacity-90">
          <img
            src="/logo.svg"
            alt="Maakon"
            className="h-8 w-auto brightness-0 invert opacity-70"
          />
          <div className="flex flex-col">
            <span className="text-white font-black leading-none text-base tracking-tight mb-1">
              Maakon
            </span>
            <span className="text-emerald-50/70 text-[9px] font-bold tracking-widest uppercase">
              {isRtl ? "Lebanon Crisis Response — معكن" : "Lebanon Crisis Response — معكن"}
            </span>
          </div>
        </div>

        {/* Links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-emerald-100/60 hover:text-white transition-colors flex items-center gap-1.5"
            >
              {"icon" in link && (link.icon as React.ReactNode)}
              {isRtl ? link.labelAr : link.labelEn}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <div className="text-[11px] text-emerald-100/50 shrink-0 text-center md:text-start font-medium tracking-wide">
          {isRtl 
            ? `© ${currentYear} معكن. جميع الحقوق محفوظة.` 
            : `© ${currentYear} Maakon. All rights reserved.`}
        </div>
      </div>
    </footer>
  );
}

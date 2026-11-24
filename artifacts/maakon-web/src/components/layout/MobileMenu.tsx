/**
 * MobileMenu — shared disclosure menu for both site headers (NavigationBar on Home, TopNav elsewhere).
 * Shown below the `xl` breakpoint, where the inline links don't fit.
 *
 * Inputs: nav items, a colour variant for dark/light headers, and an optional footer slot (sign-in / logout).
 * Behaviour: the toggle exposes aria-expanded/aria-controls; Escape and outside clicks close the menu and keep
 * focus on the toggle; following a link (route change) closes it.
 * Assumption: rendered inside a positioned header, because the panel is absolutely positioned under it.
 */
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, X } from "lucide-react";
import type { NavItem } from "@/lib/nav-links";

type Variant = "dark" | "light";

const VARIANT_CLASSES: Record<Variant, { toggle: string; panel: string; link: string; divider: string }> = {
  dark: {
    toggle: "text-white bg-black/20 hover:bg-black/30 focus-ring-on-dark",
    panel: "border-white/10 bg-emerald-950/95 backdrop-blur-2xl shadow-2xl",
    link: "text-emerald-50 bg-white/5 hover:text-white hover:bg-white/20 focus-ring-on-dark",
    divider: "border-white/10",
  },
  light: {
    toggle: "text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus-ring-on-light",
    panel: "border-black/5 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)]",
    link: "text-slate-700 hover:text-slate-900 hover:bg-slate-50 focus-ring-on-light",
    divider: "border-slate-100",
  },
};

interface MobileMenuProps {
  items: NavItem[];
  variant: Variant;
  /** Actions under the links (sign-in / logout). Receives `close` so an action can dismiss the menu. */
  renderFooter?: (close: () => void) => ReactNode;
}

export function MobileMenu({ items, variant, renderFooter }: MobileMenuProps) {
  const { t } = useTranslation();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const classes = VARIANT_CLASSES[variant];

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  // Close after navigating (e.g. a link inside the menu was followed).
  useEffect(() => {
    setOpen(false);
  }, [location]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      close(false);
      // If the click landed on something that can't take focus, keep focus on the toggle rather than <body>.
      window.setTimeout(() => {
        if (!document.activeElement || document.activeElement === document.body) toggleRef.current?.focus();
      }, 0);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, close]);

  return (
    <div ref={containerRef} className="xl:hidden">
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={`flex items-center justify-center w-11 h-11 rounded-xl transition-colors ${classes.toggle}`}
        aria-label={t(open ? "menu_close" : "menu_open")}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
      >
        {open ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full inset-x-4 mt-2 p-3 rounded-2xl border z-50 ${classes.panel}`}
          >
            <nav aria-label={t("main_nav_label")} className="flex flex-col gap-2">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`min-h-11 px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-center transition-colors ${classes.link}`}
                >
                  {item.withHeartIcon && <Heart className="w-4 h-4 shrink-0" aria-hidden="true" />}
                  {t(item.labelKey)}
                </Link>
              ))}
            </nav>
            {renderFooter && (
              <div className={`border-t mt-3 pt-3 ${classes.divider}`}>{renderFooter(() => close(false))}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


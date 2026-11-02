/**
 * DevNoticeBar — thin site-wide banner telling visitors the app is still in development.
 * Rendered once above the whole app (see main.tsx), so it appears on every page.
 * Its height is shared through the CSS variable --dev-banner-height (index.css),
 * which full-height pages such as the map subtract from 100dvh.
 */
import { useTranslation } from "react-i18next";

export function DevNoticeBar() {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      className="h-[var(--dev-banner-height)] w-full flex items-center justify-center px-3 bg-amber-400 text-amber-950 text-xs sm:text-sm font-semibold"
    >
      <span className="truncate">{t("dev_notice")}</span>
    </div>
  );
}


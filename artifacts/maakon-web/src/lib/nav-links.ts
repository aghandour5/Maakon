/**
 * Navigation items shared by the site headers (NavigationBar, TopNav), the mobile menu and the footer.
 * Labels are i18n keys, so the wording is identical everywhere and changes in one place.
 */
export interface NavItem {
  labelKey: string;
  href: string;
  /** Only shown to signed-in users. */
  requiresAuth?: boolean;
  /** Shows a heart icon before the label (used for "Support Maakon"). */
  withHeartIcon?: boolean;
}

const HEADER_NAV_ITEMS: readonly NavItem[] = [
  { labelKey: "nav_home", href: "/" },
  { labelKey: "nav_map", href: "/map" },
  { labelKey: "nav_my_posts", href: "/my-posts", requiresAuth: true },
  { labelKey: "nav_about", href: "/about" },
  { labelKey: "nav_contact", href: "/contact" },
  { labelKey: "nav_support", href: "/support", withHeartIcon: true },
];

export const FOOTER_NAV_ITEMS: readonly NavItem[] = [
  { labelKey: "nav_support", href: "/support" },
  { labelKey: "nav_about", href: "/about" },
  { labelKey: "nav_contact", href: "/contact" },
  { labelKey: "nav_faq", href: "/faq" },
];

/** Header links for the current visitor. "My Posts" is hidden when signed out. */
export function getHeaderNavItems(isAuthenticated: boolean): NavItem[] {
  return HEADER_NAV_ITEMS.filter((item) => !item.requiresAuth || isAuthenticated);
}


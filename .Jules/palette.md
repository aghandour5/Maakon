## 2024-05-24 - Accessibility Labels for i18n
**Learning:** When adding `aria-label` attributes to React components in an application with internationalization (i18n), it is crucial to use the translation function (e.g., `t("key", "Fallback")`) instead of hardcoded strings to ensure screen reader announcements are in the correct language and RTL support is maintained.
**Action:** Always wrap user-facing `aria-label` strings in the `t()` function.

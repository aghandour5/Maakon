## 2025-02-28 - WCAG 2.5.3 (Label in Name) on Buttons
**Learning:** Adding an `aria-label` to a button that already contains visible text overrides the visible text for screen readers. This violates WCAG 2.5.3 (Label in Name) and can break voice control navigation.
**Action:** Always ensure that buttons with visible text do not use `aria-label` unless the visible text is completely hidden (e.g., via CSS). Use `title` for tooltips instead.

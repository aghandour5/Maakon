## 2024-06-10 - ARIA pressed and focus visible states for account type selection
**Learning:** Mutually exclusive selection UI using native buttons without `role="radio"` require `aria-pressed` to communicate state and explicit focus-visible classes for keyboard navigation.
**Action:** Always add `aria-pressed` and `focus-visible:ring-2` (or similar) classes to selectable buttons in the Maakon design system.

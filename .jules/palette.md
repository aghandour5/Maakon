# Palette's Journal
## 2024-05-27 - Mutually Exclusive Button Selection Accessibility
**Learning:** Using generic buttons with custom active states for mutually exclusive selections (like choosing between "Individual" and "NGO" accounts) fails to communicate the selection grouping and current state to screen readers, making navigation confusing.
**Action:** Always wrap custom mutually exclusive selection UI in a `role="radiogroup"`, use `role="radio"` and `aria-checked` on the individual options, and ensure proper `focus-visible` styling is applied for keyboard navigation.

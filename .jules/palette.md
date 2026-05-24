## 2026-05-24 - Accessible Mutually Exclusive Custom Selections
**Learning:** Custom interactive elements that function as mutually exclusive selections (like account type pickers) lack inherent semantic meaning and keyboard focus visibility.
**Action:** Always wrap these elements in a `role="radiogroup"` with an `aria-label`, apply `role="radio"` and `aria-checked` to the options, and ensure proper keyboard focus styling using `focus-visible` classes.

## 2025-06-13 - [Add aria-hidden to decorative icons]
**Learning:** Decorative icons like Loader2 used in interactive elements should have `aria-hidden="true"` to prevent screen readers from reading them when the element already manages its state.
**Action:** Add `aria-hidden="true"` to all Loader2 icons when used as loading spinners in buttons.

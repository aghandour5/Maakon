## 2026-06-23 - Custom Button Selection State
**Learning:** When using mutually exclusive custom buttons for selection (like 'Account Type'), screen readers need explicit feedback on which item is currently selected.
**Action:** Use `aria-pressed="true"` conditionally on the active button to announce the selection state correctly, along with `focus-visible` classes to support keyboard navigation.

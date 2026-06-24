## 2026-06-24 - Custom Button Selection State
**Learning:** Custom interactive div/button elements acting as mutually exclusive selection (radio-like behavior) lack native state reporting to screen readers, unlike standard radio buttons.
**Action:** Always add `aria-pressed={selected}` or equivalent state attributes to custom selection buttons to explicitly communicate their pressed/active status to assistive technologies.

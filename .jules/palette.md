## 2024-05-09 - Missing ARIA Labels on Icon-only Buttons
**Learning:** Icon-only navigation buttons (like "Back" Chevrons) in dynamically stepped forms (e.g., PostNeed and PostOffer) often miss `aria-label` attributes, rendering them invisible or confusing to screen reader users since there is no accompanying text.
**Action:** Always ensure any button containing solely an icon component has a descriptive, localized `aria-label` (using the `t` function if internationalization is present) to provide context for assistive technologies.

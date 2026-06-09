## 2026-06-09 - Using aria-pressed for custom mutually-exclusive button selections
**Learning:** When using custom `<button>` elements for mutually-exclusive selection (e.g., categories, urgencies) that are styled conditionally based on a `selected` state, screen readers won't know which option is currently active if no standard roles/attributes are used.
**Action:** Add `aria-pressed={true/false}` to these buttons (or `role="radio"` with `aria-checked`) so screen readers can properly announce the active selection state.

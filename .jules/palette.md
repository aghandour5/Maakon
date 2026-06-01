## 2024-05-15 - Accessible Mutually Exclusive Selection UI
**Learning:** For mutually exclusive selection UI (like account type selectors) that look like cards or buttons, `aria-pressed` or plain `onClick` is insufficient for assistive technologies. Using `role="radio"` and `aria-checked` ensures accurate and accessible screen reader semantics, and the grouping should be wrapped in `role="radiogroup"`.
**Action:** Apply `role="radiogroup"` to the container and `role="radio"`, `aria-checked` to the custom selectable elements, alongside focus-visible classes for keyboard navigation, instead of relying on default button roles without context.
## 2024-05-15 - Proper Radio Group Implementation Constraints
**Learning:** Changing elements to `role="radio"` and `role="radiogroup"` is an accessibility anti-pattern unless full arrow-key keyboard navigation and a roving `tabindex` are also implemented.
**Action:** When working with buttons that act as mutually exclusive selections without complex keyboard event handlers, stick to native button semantics and use `aria-pressed="true/false"` to convey the selection state.

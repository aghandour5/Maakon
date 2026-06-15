## 2024-06-15 - Add aria-hidden to decorative Loader2 icons
**Learning:** The Loader2 icon from lucide-react used as a spinner frequently misses the aria-hidden="true" attribute, which can cause screen readers to announce the decorative loading icon redundantly, as the button itself usually indicates the loading state via aria-busy or disabled. Or sometimes it doesn't.
**Action:** Always add aria-hidden="true" to decorative loading spinners inside buttons.

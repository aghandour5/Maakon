## 2026-05-21 - Accessible custom radio buttons
**Learning:** Custom interactive components acting as mutually exclusive selectors (like account type cards) are not inherently accessible as just buttons.
**Action:** Always wrap them in a `role="radiogroup"` container, give individual buttons `role="radio"`, manage `aria-checked`, and ensure explicit focus-visible classes are applied for keyboard navigability.

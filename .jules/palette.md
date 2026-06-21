
## 2025-03-01 - Add Focus Rings to Top Navigation Buttons
**Learning:** In the Maakon design system, custom or unstyled button implementations (like the ones in `TopNav.tsx` for notifications and user avatars) sometimes miss clear keyboard focus indicators.
**Action:** Always add standard focus-visible classes (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`) to native `<button>` tags acting as interactive elements to ensure accessibility for keyboard navigation.

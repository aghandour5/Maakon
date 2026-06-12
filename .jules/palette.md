## 2024-06-12 - Explicit focus-visible classes for custom button selection UI
**Learning:** Mutually exclusive selection UI using native button elements requires an explicit `aria-pressed` state and clear visual focus-visible utility classes. The `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` pattern ensures proper focus visualization for keyboard users.
**Action:** When implementing custom interactive elements masquerading as toggle buttons, explicitly set `aria-pressed={condition}` and apply consistent `focus-visible` utility classes.

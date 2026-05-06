## 2024-03-24 - Replaced native confirm() dialog with accessible AlertDialog
**Learning:** Native `confirm()` dialogs block the UI thread and disrupt the flow and styling of modern, accessible React applications.
**Action:** Always use the design system's dialog components (like shadcn/ui's `AlertDialog`) to confirm destructive actions.

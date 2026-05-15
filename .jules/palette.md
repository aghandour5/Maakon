## 2024-05-15 - Missing form label associations in NgoModal
**Learning:** Found multiple unassociated inputs, selects, and textareas inside the NGO admin modal. Without `htmlFor` and `id` linking, screen readers fail to correctly announce the purpose of each field, severely degrading accessibility for admin users utilizing assistive technology.
**Action:** Always ensure `htmlFor` attributes on `<label>` elements perfectly match the `id` on the corresponding input controls to guarantee robust accessibility for all users, including admins.

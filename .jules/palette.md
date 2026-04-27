## 2024-04-27 - Connect Form Labels in NGO Modal
**Learning:** Found that form inputs in `NgoModal.tsx` were missing proper `id` to `htmlFor` connections, which is a key accessibility requirement for screen readers and improves click target size.
**Action:** Always ensure that every `<label>` is explicitly linked to its input using `htmlFor` matching the input's `id`.

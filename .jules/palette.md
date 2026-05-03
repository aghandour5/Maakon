## 2024-05-03 - Added Loading Spinners to Profile Forms
**Learning:** Users lack feedback when submitting their individual or NGO profiles, leading to potential multiple submissions or confusion. Forms in `@workspace/maakon-web` benefit from immediate visual feedback during async operations.
**Action:** When working on forms with an `isLoading` state, always use the `Loader2` component from `lucide-react` with `animate-spin` to provide clear feedback inside the submit button.

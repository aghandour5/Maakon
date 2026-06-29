## 2026-06-29 - Handling Decorative Icons & Busy States
**Learning:** The default UI language in Maakon Web is Arabic, meaning English Playwright locators will timeout unless language is toggled first. Additionally, multiple lucide-react icons used decoratively lacked `aria-hidden` attributes, and async buttons lacked `aria-busy`.
**Action:** Always verify decorative icons in interactive elements include `aria-hidden="true"`. When automating Playwright tests, switch the language toggle to English via `page.click("button:has-text('English')")` before relying on English text locators.

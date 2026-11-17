# Kingdom Atmosphere — My Agenda

A mobile-first, offline-capable, multi-year Christian journal and personal planning PWA.

## Structure
- `index.html` — semantic views, forms, dialogs and navigation (no inline app CSS/JS).
- `app.css` — all main layouts, journal styles and mobile responsive rules.
- `app.js` — main agenda date navigation, daily/weekly/monthly content, family, gifts, reminders, activity sessions and saved progress.
- `journal-controller.js` — resilient journal dialogs and immediate local field saves, including iPhone keyboard behavior.
- `growth-controller.js` — five-domain whole-life growth journal.
- `presets-controller.js` — reusable activities with categories, dance styles, time estimates and quick scheduling.
- `pdf-export.js` — offline one-tap PDF generation, download and native file sharing.
- `manifest.webmanifest`, `sw.js`, `icon.svg`, and the original `kingdom-atmosphere-wordmark-gold.webp` — installable/offline experience.

## Data compatibility
**Do not rename localStorage keys without an explicit migration.** Current keys:
- `ka-2027-agenda-v1`: main agenda data across *all* years; historical key retained for compatibility.
- `ka-whole-life-growth-v1`: daily and weekly five-domain growth entries.
- `ka-presets-v1`: user-created presets and recently scheduled activities.
- `ka-agenda-last-date`: last selected date preference.

The JSON backup includes all three content stores. PDF is a printable/shareable snapshot **not** an editable backup. Existing user data must never be reset during a design or software update.

## Ownership / avoiding collisions
- A new planner feature should use existing controllers when possible, not introduce a second action handler for the same button.
- Only `pdf-export.js` owns `#print-agenda`, `#share-agenda` and `#daily-pdf-share`. Old print/report builders were removed.
- `presets-controller.js` dispatches `kingdom:presetScheduled` to synchronize its scheduled entry with the in-memory `app.js` state; do not write an activity to localStorage alone and expect the main data object to update.
- Use unique HTML IDs. Saved field identifiers such as `data-single="vision"` are independent of element IDs.
- Use local dates (`YYYY-MM-DD`), not UTC conversions, for agenda-day selection.
- Avoid introducing additional CSS overrides without first checking existing selectors.

## Release checklist
1. Open the agenda on an iPhone in Safari. Verify the local date and navigate to yesterday and tomorrow.
2. Open all four journal sections; type with the iOS keyboard, close, reopen and verify persistence.
3. Save a goal, weekly outcome, daily action and whole-life entry. Change date and return; check data remains.
4. Save a Dance / Hip-Hop preset; schedule it; reload and confirm the agenda entry persists and the preset is reusable.
5. Generate and open a Day, Week and Month PDF; test **Share PDF** from iPhone and inspect accented text.
6. Export JSON backup, import it into a separate test browser or profile, and verify all three content stores restore.
7. Install the PWA, load while online, go offline and confirm journal, presets and PDF export remain available.
8. Inspect the console for runtime errors and look for keyboard/safe-area overlap.
9. Increase the service-worker cache version when HTML, CSS, JS or other precached assets change; wait for GitHub Pages deployment to succeed.

## Known constraints
- Browser storage is local to that browser/app install and is not cloud synced.
- Reliable notifications while the app is closed require a separate push service.
- PDF text uses built-in standard fonts; unsupported emoji/non-Latin glyphs may become question marks. PDF export is not a KDP-ready book interior.
- Manual real-device iPhone verification is required; syntax checks and simulated DOM tests do not replace it.

The source repo URL can retain `/agenda-2027/` for link compatibility even though the product supports all years.

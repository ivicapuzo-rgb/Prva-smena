# PRD – Точење горива (ГСП Нови Београд)

## Original problem
"napravi istu ovaku aplikaciju za android" – Android app replicating Excel form "ЛИСТА ТОЧЕЊА ГОРИВА - НОВИ БЕОГРАД" (QF-E-003). Admin login with password only "puzopb".

## User choices
Local-only storage, Excel + PDF export, Cyrillic, day shift 07–15h only, admin password gate.

## Architecture
Expo Router (no backend). AsyncStorage via src/utils/storage (per-day shift keys + index, bus list). Export: xlsx (SheetJS) + expo-print, shared via expo-sharing/expo-file-system.

## Implemented (2026-06)
- Login (password puzopb, persisted session, logout)
- Home: date nav, total difference, liters poured, bus count, bad cards, deviation, export
- Аутомати 1–8 start/end with auto difference + signatures (Евидентичар, Радник Кнез Петрол-а)
- Точење: custom numpad, garage no. validation + suggestions, liters, card да/не, auto time, entry list edit/delete
- Историја: saved shifts, Excel/PDF export, open, delete
- Bus list management (276 default numbers from form)

## Redesign (2026-06, iteration 2)
- Switched to Latin script, UI matched to user reference screenshots
- Tabs: SMENA (hero photo, PRVA SMENA, date nav, DOŠLO counter, Unesi vozilo form: garažni broj, mesto sipanja 1-8, količina, auto vreme, napomena), VOZILA (list, filters, add/remove), IZVEŠTAJ (arrivals by time, pump stats + chart, weekly overview + PDF/share, daily Excel/PDF)
- Data model: per-day arrivals {bus, pump, qty, time, note}; old pump-meter screens removed
- Fonts: Anton, Michroma, Barlow Condensed

## Iteration 3 (2026-06)
- Smena tab open without login; Vozila + Izveštaj are admin panel (password puzopb, in-tab gate)
- Excel export fills the ORIGINAL uploaded xlsx (embedded base64, JSZip): only qty + time next to garage number, date in O3; logo/styles/formulas preserved
- Daily PDF redesigned to match reference (red headers, pump table, SMENA, UKUPNA RAZLIKA, EVRODIZEL sorted, filled row highlighted, paginated)
- Izveštaj list order: garage number → time → pump/qty

## Backlog
- P1: Monthly summary per bus; backup/restore file
- P2: Custom pump count / shift times

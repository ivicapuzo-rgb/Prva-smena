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

## Backlog
- P1: Monthly summary per bus; backup/restore file
- P2: Custom pump count / shift times

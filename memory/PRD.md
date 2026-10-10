# Prva smena – evidencija točenja goriva (PRD)

## Original problem
"Napravi aplikaciju prema upustvima koje sam dao u docx fajlu." (Prva smena.docx + Excel QF-E-003 "Lista točenja goriva – Novi Beograd" + 3 sketches: Prva smena, Vozila, Izveštaj). Approved plan: offline PWA, PDFs, admin panel (password puzopb), Electron moved to phase 3.

## Architecture
- Frontend: React PWA (manifest + /sw.js network-first cache), localStorage store (`src/lib/store.js`) with dirty-queue sync to backend; jsPDF + autotable with embedded Roboto (latin diacritics) in `src/lib/pdf.js`; Web Share API for "Podeli".
- Backend: FastAPI `/api/sync` (LWW upsert, returns all), `/api/admin/login`, `/api/admin/data` (HMAC token). Mongo collections: fuelings, totalizers, vehicles (added only; 276 seed vehicles in `src/data/vehicles.js`).

## Implemented (2026-10-10, Phase 1 MVP)
- Smena: hero, date nav, DOŠLO counter, Unesi vozilo (garage, pumps 1-8, liters, auto/manual time, note), auto-add unknown vehicles, Totalizatori 1-8 with diffs/total, signature footer
- Vozila: search history, edit/delete fueling, sorted list, + Dodaj vozilo
- Izveštaj: Stigli (N) latest first, pump stats + chart, weekly overview + PDF/share, 14-day chart, period PDF, QF-E-003 PDF with persisted signature checkbox (new vehicles placed after 2588 as in Excel)
- Admin panel (puzopb): all server days, QF/daily PDF + share
- Sync status badge; offline usage

## Backlog
- P1: Excel (.xlsx) export in QF-E-003 format; 2nd/3rd shift; editable Ispravnost/Kartice columns
- P2: Electron desktop with GitHub updates; multiple evidentičar accounts; daily email report

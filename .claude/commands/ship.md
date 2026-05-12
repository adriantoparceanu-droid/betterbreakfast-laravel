# /ship — Deploy Better Breakfast to production

Execută automat tot ce e necesar pentru a duce modificările pe live, apoi raportează ce mai trebuie făcut manual.

---

## Pasul 1 — Verifică sănătatea proiectului

Rulează în paralel:
- `php artisan test` — toate testele trebuie să treacă
- `npx tsc --noEmit` — TypeScript trebuie să fie curat

Dacă oricare eșuează, **oprește-te imediat** și raportează eroarea. Nu continua cu pașii următori.

---

## Pasul 2 — Analizează ce s-a schimbat

Rulează `git status` și `git diff --stat HEAD` pentru a determina:

**Fișiere frontend** (necesită rebuild):
- Orice fișier `.tsx`, `.ts`, `.css` din `resources/`
- Fișiere din `resources/js/` sau `resources/css/`

**Fișiere backend** (nu necesită rebuild):
- Fișiere `.php` din `app/`, `routes/`, `config/`, `bootstrap/`

**Migrații noi** (notează utilizatorul să verifice producția):
- Fișiere noi în `database/migrations/`

**Seederi modificați** (necesită `?seed=1` pe producție):
- Fișiere modificate în `database/seeders/`

**Documentație**:
- `docs/BUILD_SPEC.md`, `CLAUDE.md`

---

## Pasul 3 — Build frontend dacă e necesar

Dacă există fișiere frontend modificate (`.tsx`, `.ts`, `.css` din `resources/`), rulează:
```
npm run build
```

`public/build/` trebuie comis în git pentru ca producția să vadă modificările UI.

---

## Pasul 4 — Actualizează progresul proiectului

Înainte de commit, actualizează secțiunea **"Completed"** din `docs/BUILD_SPEC.md` (Secțiunea 16) cu ce a fost livrat în acest ship. Adaugă câte un bullet point nou pentru fiecare feature/fix semnificativ, cu data de azi în format `YYYY-MM-DD`.

Format exemplu:
```
- [x] (2026-05-12) Fix: descriere scurtă a ce s-a rezolvat
- [x] (2026-05-12) Feature: descriere scurtă a ce s-a adăugat
```

---

## Pasul 5 — Commit și push

Stagează toate fișierele modificate (inclusiv `public/build/` dacă a fost rebuildat).

Scrie un mesaj de commit descriptiv bazat pe ce s-a schimbat — grupat pe categorii (fix/feature/docs/refactor). Folosește stilul existent din `git log --oneline -5`.

Push pe `origin main`.

---

## Pasul 6 — Raportează utilizatorului

După push reușit, afișează un raport clar în acest format:

```
✅ SHIP COMPLET
═══════════════════════════════

🔧 Ce s-a executat automat:
  • [listă cu ce s-a făcut: teste, build, commit, push]

📋 CE TREBUIE SĂ FACI TU MANUAL:

1. DEPLOY pe producție (întotdeauna):
   https://www.betterbreakfast.eu/deploy.php?token=TOKEN_TĂU

2. SEED date (doar dacă seederii s-au modificat): [afișează doar dacă e cazul]
   https://www.betterbreakfast.eu/deploy.php?token=TOKEN_TĂU&seed=1
   Seederi modificați: [listă]

3. MIGRAȚII (verifică că au rulat): [afișează doar dacă există migrații noi]
   Migrații noi: [listă fișiere]
   Deploy-ul le rulează automat via `artisan migrate --force`

4. ENV pe producție (dacă s-au adăugat variabile noi): [afișează doar dacă e cazul]
   Adaugă în .env pe server:
   [lista variabilelor noi]

═══════════════════════════════
Commit: [hash scurt]
```

Dacă nu există nimic de făcut manual la un punct, nu-l afișa deloc.

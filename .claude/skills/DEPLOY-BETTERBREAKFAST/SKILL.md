---
name: DEPLOY-BETTERBREAKFAST
description: Deploy automat Better Breakfast (Laravel 11 + React/Inertia) pe cPanel — teste + TypeScript check, build Vite dacă e nevoie, actualizează BUILD_SPEC.md, commit + push pe GitHub, declanșează webhook deploy.php, verifică răspunsul JSON și face smoke test pe login. Triggere — "deploy", "ship", "deploy live", "urca pe live", "publica modificari", "deploy betterbreakfast", "fa deploy".
---

# DEPLOY-BETTERBREAKFAST — flux complet de deploy pe cPanel

Automatizează întregul flux de deploy pentru Better Breakfast. Rulează pașii în ordinea de mai jos. Dacă un pas eșuează, **oprește-te și raportează utilizatorului** — nu continua automat.

## Context fix (NU schimba aceste valori)

- **Project root local**: `/Users/cosmin/Herd/betterbreakfast/`
- **Git remote**: `git@github.com:adriantoparceanu-droid/betterbreakfast-laravel.git` (branch `main`)
- **Domeniu live**: `https://betterbreakfast.eu/`
- **Webhook URL** *(nu afișa token-ul utilizatorului în clar dacă el nu îl cere)*:
  ```
  https://betterbreakfast.eu/deploy.php?token=5973e6f510716f1e4a35bc5b298d34f370a1ad9454d95fc6cfe0d1aee4096d8c
  ```

## Pași — strict în această ordine

### Pas 1 — Verifică sănătatea proiectului

Rulează în paralel:
```bash
cd /Users/cosmin/Herd/betterbreakfast && php artisan test 2>&1
```
```bash
cd /Users/cosmin/Herd/betterbreakfast && npx tsc --noEmit 2>&1
```

- Dacă oricare eșuează → **STOP imediat**. Raportează eroarea exactă, nu continua.
- Dacă ambele trec → anunță: "✅ 32 teste OK + TypeScript curat"

### Pas 2 — Verifică starea git

```bash
cd /Users/cosmin/Herd/betterbreakfast && git status --short && git log --oneline -3
```

- **"nothing to commit, working tree clean"** → întreabă dacă vrea să redeclanșeze deploy-ul fără modificări noi. Dacă DA, sari direct la **Pas 7**.
- **Fișiere modificate** → continuă cu **Pas 3**.

### Pas 3 — Decide dacă Vite trebuie rebuildat

Build-ul Vite (`npm run build`) e necesar DOAR dacă s-au modificat fișiere din:
- `resources/js/**` (`.tsx`, `.ts`)
- `resources/css/**`
- `tailwind.config.js` / `vite.config.ts` / `package.json` / `package-lock.json`

Detectează:
```bash
cd /Users/cosmin/Herd/betterbreakfast && git status --short | grep -E "resources/|tailwind\.config|vite\.config|package(-lock)?\.json"
```

- Output gol → **sari la Pas 5**
- Output cu fișiere → continuă cu **Pas 4**

### Pas 4 — Build Vite

```bash
cd /Users/cosmin/Herd/betterbreakfast && npm run build 2>&1 | tail -20
```

Verifică că a generat manifestul:
```bash
ls /Users/cosmin/Herd/betterbreakfast/public/build/manifest.json
```

Warning-uri cosmetice (chunk size, etc.) sunt **neblocante**. Doar "Build failed" / "tsc error" sunt blocante.

`public/build/` trebuie inclus în commit — serverul îl primește prin `git pull`.

### Pas 5 — Actualizează BUILD_SPEC.md

Citește `docs/BUILD_SPEC.md` și adaugă în secțiunea **"Completed"** (Secțiunea 16) câte un bullet point pentru fiecare feature/fix semnificativ din acest deploy:

```
- [x] (YYYY-MM-DD) Fix/Feature: descriere scurtă
```

Folosește data reală de azi. Nu adăuga bullet points pentru modificări minore (whitespace, comentarii).

### Pas 6 — Verifică migrații noi (OBLIGATORIU înainte de commit)

```bash
cd /Users/cosmin/Herd/betterbreakfast && git status --short | grep -E "database/migrations/"
```

Dacă apar migrații noi sau modificate:
1. Listează-le explicit utilizatorului
2. Citește `up()` al fiecăreia și rezumă în 1-2 fraze ce face (CREATE TABLE, ADD COLUMN, etc.)
3. **Cere confirmare**: "Confirmi să rulez aceste migrații pe producție?"
4. Abia după DA explicit → continuă cu Pas 7

### Pas 7 — Commit și push

Arată ce urmează să fie comis:
```bash
cd /Users/cosmin/Herd/betterbreakfast && git status --short
```

**Cere utilizatorului un mesaj de commit scurt și descriptiv** (sub 70 caractere). Sugestii bazate pe fișierele modificate sunt OK. **NU comite fără confirmarea utilizatorului asupra mesajului.**

```bash
cd /Users/cosmin/Herd/betterbreakfast && git add . && git commit -m "$(cat <<'EOF'
<mesaj>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)" && git push origin main 2>&1 | tail -5
```

**Validare push**:
- `main -> main` cu hash range (`xxxxxxx..yyyyyyy`) → OK
- `rejected` sau `non-fast-forward` → **STOP**, sugerează `git pull --rebase origin main` și confirmă înainte. NU rezolva conflictele singur.

### Pas 8 — Declanșează webhook-ul de deploy

Webhook-ul returnează JSON. Rulează și salvează răspunsul:

```bash
RESPONSE=$(curl -s --max-time 180 "https://betterbreakfast.eu/deploy.php?token=5973e6f510716f1e4a35bc5b298d34f370a1ad9454d95fc6cfe0d1aee4096d8c")
echo "$RESPONSE"
```

Dacă răspunsul e gol sau timeout → verifică HTTP code:
```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://betterbreakfast.eu/deploy.php?token=5973e6f510716f1e4a35bc5b298d34f370a1ad9454d95fc6cfe0d1aee4096d8c"
```

- `403` → token greșit sau .env lipsă pe server
- `404` → deploy.php a fost șters / path greșit
- `000` / timeout → server down sau DNS

### Pas 9 — Analizează răspunsul JSON

Pașii executați de deploy.php pe server (în ordine):
1. `git reset --hard HEAD`
2. `git pull origin main`
3. `composer install --no-dev --optimize-autoloader`
4. `php artisan migrate --force`
5. `php artisan config:clear`
6. `php artisan optimize`

Parsează JSON-ul și identifică pașii eșuați:

```bash
echo "$RESPONSE" | python3 -c "
import json, sys
d = json.load(sys.stdin)
steps = d.get('steps', [])
failed = [s for s in steps if s.get('code', -1) != 0]
if not steps:
    print('STATUS: NO STEPS — deploy.php nu a rulat comenzile')
elif failed:
    print('STATUS: FAIL')
    for s in failed:
        print(f'  Pas eșuat (exit {s[\"code\"]}): {s[\"cmd\"][:80]}')
        print(f'  Output: {s[\"out\"][:400]}')
else:
    print(f'STATUS: OK — {len(steps)} pași completați')
    print(f'PHP: {d.get(\"php_version\", \"?\")}')
"
```

### Pas 10 — Analiză erori specifice

- **git pull FAIL** (`CONFLICT`, `rejected`) → conflict de merge — raportează și **STOP**, nu forța
- **composer install FAIL** → problemă de dependențe PHP — paste primele 15 linii de eroare
- **migrate FAIL** → problemă de schemă DB — **BLOCANT** — paste eroarea completă și sugerează fix local + redeploy
- **config:clear sau optimize FAIL** → problemă cu `.env` sau cache — sugerează `?keycheck=1`

Dacă STATUS: OK → continuă cu **Pas 11**.

### Pas 11 — Smoke test final

```bash
curl -sI --max-time 15 https://betterbreakfast.eu/login | head -1
curl -sI --max-time 15 https://betterbreakfast.eu/ | head -1
```

- `HTTP/2 200` sau `HTTP/2 302` → OK
- `HTTP/2 500` → eroare runtime — sugerează verificarea logurilor: `?log=1`
- `HTTP/2 503` → app în maintenance mode
- Timeout / connection refused → server down

### Pas 12 — Raport final pentru utilizator

Format concis (5-8 linii maxim):

```
✅ Deploy Better Breakfast reușit

📝 Commit: <hash_scurt> "<mesaj>"
📦 <N> fișiere modificate (<+X / -Y linii>)
🚀 Build Vite: <DA / NU>
🌐 https://betterbreakfast.eu/login → HTTP <cod>
⏱️ Webhook deploy: <Xs>
```

Dacă seederii s-au modificat, adaugă:
```
⚠️  Seederi modificați detectați — rulează manual DOAR dacă s-au adăugat rețete/module/categorii noi:
   https://betterbreakfast.eu/deploy.php?token=...&seed=1
```

Dacă au apărut erori neblocante, raportează-le explicit cu soluția recomandată.

---

## Cazuri speciale și troubleshooting

### Conflict git la push
Dacă `git push` returnează `rejected (non-fast-forward)`:
1. **NU rezolva singur** — oprește-te
2. Sugerează `git pull --rebase origin main`
3. Dacă confirmă → rulează pull
4. Dacă apar conflicte → STOP, listează fișierele în conflict, cere utilizatorului să decidă

### Webhook returnează 403 Forbidden
Token-ul nu se potrivește cu cel din `.env` de pe server. Cere utilizatorului noul token și actualizează SKILL.md cu el.

### Migrate FAIL pe producție
1. NU rula `migrate:rollback` în producție
2. Identifică migrarea problematică din output
3. Repară LOCAL (ex: adaugă `->nullable()`, corectează FK, etc.)
4. Commit + redeploy

### Asset-uri lipsă după deploy (Vite manifest error)
- Verifică că `public/build/` e committed în git (NU în `.gitignore`)
- Rulează `npm run build` local și re-push

### Endpoint-uri utile de diagnosticare
```
?log=1      — ultimele 150 linii din storage/logs/laravel.log
?info=1     — phpinfo() complet
?seed=1     — rulează ModuleSeeder → CategorySeeder → RecipeSeeder
?keycheck=1 — verifică APP_KEY din .env vs cache config
```

---

## Reguli STRICTE despre baza de date (PRIORITATE MAXIMĂ)

**REGULA DE BAZĂ**: Acest skill NU modifică date din baza de date decât în 2 cazuri:
1. Migrații noi din `database/migrations/*.php` — rulează automat la deploy via `artisan migrate --force`
2. Seed idempotent via `?seed=1` — ModuleSeeder, CategorySeeder, RecipeSeeder folosesc `updateOrCreate`

### NICIODATĂ NU rula automat:
- `php artisan migrate:fresh` (șterge TOȚI utilizatorii și progresul)
- `php artisan migrate:rollback`
- `php artisan migrate:reset`
- `php artisan db:wipe`
- SQL direct prin tinker (DROP, TRUNCATE, DELETE, UPDATE pe tabele cu date de utilizatori)

Dacă utilizatorul cere una din comenzile de mai sus → **STOP** și cere confirmare EXPLICITĂ cu fraza completă: "DA, accept să rulez X pe producție și înțeleg că asta șterge/modifică date."

### Verifică migrațiile noi ÎNAINTE de push (Pas 6 — obligatoriu)

### Modificări seederi — atenționare obligatorie
Dacă `database/seeders/*.php` e modificat:
1. Atenționează că `?seed=1` va suprascrie date de master (rețete, module, categorii)
2. Datele utilizatorilor (`user_modules`, `user_progress`, etc.) **NU sunt afectate** de seederi
3. Cere confirmare explicită înainte de a sugera rularea `?seed=1`

---

## Alte reguli de comportament

- **Limbă**: răspunde în română
- **Nu modifica `.env` pe server** prin acest skill — manual prin cPanel File Manager
- **Nu activa APP_DEBUG=true** în producție ca debugging hack — folosește `?log=1`
- **Token-ul de deploy e SECRET** — dacă utilizatorul cere să-l vadă în chat, dă-i doar primele 8 caractere (`5973e6f5...`)
- **Pe modificări mari** (>15 fișiere sau după migrații noi), confirmă mesajul de commit cu utilizatorul
- **Dacă utilizatorul tastează `deploy` sau `ship` fără context** → verifică mai întâi modificările (Pas 2) și abia apoi confirmă cu el ce să includă în commit

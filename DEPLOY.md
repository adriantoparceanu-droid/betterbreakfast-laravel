# Deploy pe cPanel (fără SSH)

## Setup inițial (o singură dată)

### 1. cPanel → Git™ Version Control → Clone
```
Clone URL:      git@github.com:adriantoparceanu-droid/betterbreakfast-laravel.git
Repository Path: /home/andie/betterbreakfast-laravel
```

### 2. cPanel → File Manager → creează `.env`
Copiază conținutul din `.env.production.example` și completează:
- `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` — din cPanel → MySQL Databases
- `DEPLOY_TOKEN` — generează cu `openssl rand -hex 32` (sau orice string lung)
- `APP_KEY` — lasă gol, va fi generat de setup.php

### 3. Document Root
cPanel → Domains → betterbreakfast.eu → Document Root:
```
/home/andie/betterbreakfast-laravel/public
```

### 4. Rulează setup.php (o singură dată)
Deschide în browser:
```
https://betterbreakfast.eu/setup.php?token=DEPLOY_TOKEN_DIN_ENV
```
Răspunsul JSON arată statusul fiecărui pas:
- `composer install` — instalează dependențele PHP
- `artisan key:generate` — generează APP_KEY în .env
- `artisan migrate` — creează tabelele
- `artisan db:seed` — adaugă rețetele și modulul
- `artisan optimize` — cache config/routes/views

### 5. Șterge setup.php
După ce setup.php a rulat cu succes, șterge-l din File Manager:
```
/home/andie/betterbreakfast-laravel/public/setup.php
```

---

## GitHub Actions Secrets (pentru deploy automat)

GitHub repo → Settings → Secrets → Actions:

| Secret | Valoare |
|---|---|
| `FTP_HOST` | `ftp.betterbreakfast.eu` |
| `FTP_USER` | userul FTP din cPanel |
| `FTP_PASSWORD` | parola FTP din cPanel |
| `DEPLOY_TOKEN` | același token din `.env` |

---

## Deploy obișnuit (automat)

La fiecare `git push origin main`:
1. GitHub Actions face `npm run build`
2. FTP upload `public/build/` pe server
3. Webhook POST la `https://betterbreakfast.eu/deploy.php` care rulează:
   - `git reset --hard HEAD` + `git pull origin main`
   - `composer install --no-dev`
   - `php artisan migrate --force`
   - `php artisan optimize`

---

## Deploy manual (din browser)

```
https://betterbreakfast.eu/deploy.php?token=DEPLOY_TOKEN_DIN_ENV
```

Răspuns JSON cu statusul fiecărui pas. Dacă `code != 0` la vreun pas, deploy-ul se oprește.

---

## Diagnostice

```
https://betterbreakfast.eu/deploy.php?token=TOKEN&log=1    ← ultimele 150 linii din laravel.log
https://betterbreakfast.eu/deploy.php?token=TOKEN&info=1   ← phpinfo()
```

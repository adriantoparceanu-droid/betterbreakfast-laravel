# Deploy pe cPanel

## Setup inițial (o singură dată)

### 1. SSH în cPanel

```bash
cd /home/username/betterbreakfast
git clone https://github.com/yourname/betterbreakfast-laravel.git .
composer install --no-dev --optimize-autoloader
cp .env.production.example .env
# Editează .env cu credențialele MySQL din cPanel
php artisan key:generate
php artisan migrate --force
php artisan db:seed --class=RecipeSeeder
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 2. Configurare cPanel

- **Document Root**: `/home/username/betterbreakfast` (nu `/public`!)
- `.htaccess` din rădăcină redirecționează automat spre `public/`
- Setează variabila de mediu `DEPLOY_SECRET` în cPanel → Software → Node.js App → Environment Variables
  (sau adaug-o direct în `.env`)

### 3. GitHub Secrets necesare

| Secret | Valoare |
|---|---|
| `FTP_HOST` | ftp.betterbreakfast.ro |
| `FTP_USER` | username@betterbreakfast.ro |
| `FTP_PASSWORD` | parola FTP cPanel |
| `DEPLOY_SECRET` | un șir random generat cu `openssl rand -hex 32` |

---

## Deploy obișnuit (automat via GitHub Actions)

La fiecare `git push origin main`:
1. GitHub Actions face `npm run build`
2. FTP upload doar `public/build/` pe server
3. POST webhook la `https://betterbreakfast.ro/deploy.php` care rulează:
   - `git pull origin main`
   - `php artisan migrate --force`
   - `php artisan config:cache`
   - `php artisan route:cache`
   - `php artisan view:cache`

---

## Deploy manual (fără GitHub Actions)

```bash
ssh username@betterbreakfast.ro
cd /home/username/betterbreakfast
git pull origin main
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache
```

Apoi local:
```bash
npm run build
# FTP public/build/ pe server manual
```

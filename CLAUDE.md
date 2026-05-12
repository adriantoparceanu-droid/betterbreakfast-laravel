# Better Breakfast — CLAUDE.md

## Project overview

**Better Breakfast** este un PWA offline-first care livrează un plan de mic dejun de 10 zile. Spec complet: `docs/BUILD_SPEC.md`.

## Stack

- **Backend:** Laravel 11 + Inertia.js v2 + PHP 8.3
- **Frontend:** React 18, Vite 8, TypeScript, Tailwind CSS
- **State / offline:** Zustand v5 + Dexie v4 (IndexedDB)
- **Auth:** Laravel Breeze v2 (sessions) — login cu email SAU username
- **Routing React:** Ziggy (`route()` helper)
- **Animații:** Framer Motion v11
- **Forms:** React Hook Form v7 + Zod v3

## Dev

```bash
# Start Vite (frontend HMR)
npm run dev

# Build producție
npm run build     # tsc + vite build

# Artisan
php artisan migrate
php artisan db:seed     # ModuleSeeder + RecipeSeeder
php artisan serve       # (opțional, Herd gestionează)
```

**Local URL:** `betterbreakfast.test` (Laravel Herd)  
**Dev DB:** SQLite (`database/database.sqlite`)  
**Admin local:** `admin@betterbreakfast.ro` / `admin123`

## Structura frontend

```
resources/js/
  Pages/
    Auth/Login.tsx          # Tab login/register animat
    Onboarding.tsx
    Today.tsx               # Ecranul principal
    Plan.tsx
    Staples.tsx
    Swap.tsx
    Complete.tsx
    Admin/                  # Dashboard, Users, Recipes, Ingredients, Modules, Stats
  Layouts/
    AppLayout.tsx           # Bottom nav + header cu ⚙
    AdminLayout.tsx         # Sidebar admin
  Components/
  store/                    # Zustand stores
  db/                       # Dexie schema
```

Paginile app folosesc `PageComponent.layout = AppLayout` (persistent layout Inertia).

## Rute

| Grup | Prefix | Middleware |
|------|--------|------------|
| App | — | `auth` |
| Admin | `/admin` | `auth`, `admin` |
| API | `/api` | `auth:sanctum` |

**API endpoints:** `/api/recipes`, `/api/user/progress` (GET/PUT), `/api/sync` (POST), `/api/analytics` (POST)

## Principii produs (NON-NEGOCIABILE)

- **Offline-first:** UI se randează din IndexedDB/Zustand — niciodată nu blochează pe rețea
- **Local wins:** La conflict local vs server, câștigă localul
- **Max 2 tap-uri** pentru a completa o zi
- **Zero prep time** afișat oriunde în app
- Exact **10 rețete**, o singură utilizare per ciclu
- Default servings: **1** (nu 2)
- Post-onboarding redirect: **`/staples`** (nu Today)

## Ce NU se construiește

- ❌ Rețete extra / browse rețete
- ❌ AI / recomandări
- ❌ Social features
- ❌ Notificări
- ❌ Gamification
- ❌ Inventory tracking
- ❌ Prep time (nicăieri)

## Deploy (cPanel — betterbreakfast.eu)

- **cPanel user:** `andie`
- **GitHub repo:** `git@github.com:adriantoparceanu-droid/better.git`
- `.htaccess` în rădăcină redirecționează tot spre `public/`
- `deploy.php` — webhook cu `X-Deploy-Token`
- `.github/workflows/deploy.yml` — build + FTP `public/build/` + webhook
- **Instrucțiuni complete:** `DEPLOY.md`

**NU folosi:** Vercel, Supabase, Firebase, Docker — toate incompatibile cu cPanel shared hosting (CloudLinux LVE).

## Analytics

Doar două evenimente: `COMPLETE_DAY` și `SWAP_RECIPE`, cu `anonymousId` anonim. Queue offline în Dexie, flush când e online. Fail silently.

## Testare

**Regula:** după fiecare modificare se rulează `php artisan test` și `npx tsc --noEmit`. Ambele trebuie să treacă.

```bash
php artisan test          # toate testele PHP (22 teste)
npx tsc --noEmit          # verificare TypeScript
```

### Convenții importante pentru teste

- **`UserFactory`** generează `username` (nu `name`) și nu include `email_verified_at` — schema noastră nu are aceste câmpuri Breeze default
- **hCaptcha** este bypass-at automat în `APP_ENV=testing` — nu trimite `hcaptcha_token` în teste
- **Login** acceptă câmpul `login` (email SAU username), nu `email`
- **Redirecturi după autentificare:** utilizatori normali → `today`, admini → `admin.dashboard`, înregistrare → `onboarding`
- **Testele Breeze moștenite** (EmailVerification, ProfileTest cu `name`) au fost înlocuite cu teste relevante pentru app

### Structura testelor

```
tests/
  Feature/
    ExampleTest.php               # root redirect + acces today autentificat
    ProfileTest.php               # schimbare parolă
    Auth/
      AuthenticationTest.php      # login email, username, admin, logout
      RegistrationTest.php        # register, unicitate email/username
      PasswordResetTest.php       # forgot password flow complet
      PasswordConfirmationTest.php
    Admin/
      RecipeTest.php              # CRUD rețete + toggle activ
```

### Gotcha: coloana `image` NOT NULL

`recipes.image` are `NOT NULL default ''`. Middleware `ConvertEmptyStringsToNull` convertește `image: ''` în `null` în request. Controllerul rectifică explicit: `$data['image'] = $data['image'] ?? '';`.

### Pagini Auth existente

```
resources/js/Pages/Auth/
  Login.tsx           # tab login/register animat + "Forgot password?" link
  ForgotPassword.tsx  # cerere link reset
  ResetPassword.tsx   # formular parolă nouă
  ConfirmPassword.tsx
  Register.tsx
  VerifyEmail.tsx
```

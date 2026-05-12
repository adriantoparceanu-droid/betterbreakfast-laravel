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
php artisan db:seed     # ModuleSeeder + RecipeSeeder + CategorySeeder
php artisan serve       # (opțional, Herd gestionează)
```

**Local URL:** `betterbreakfast.test` (Laravel Herd)  
**Dev DB:** SQLite (`database/database.sqlite`)  
**Admin local:** `admin@betterbreakfast.ro` / `admin123`

## Model de acces (paid)

**Ambele module sunt cu plată.** Nu există acces gratuit.

| Modul | Preț default | Tip acces |
|-------|-------------|-----------|
| Module 1 — 10-Day Breakfast Plan | €9.99 | Acces complet la app (Today/Plan/Staples) |
| Module 2 — Premium Categories | Per categorie (€3.99–€4.99) | Fiecare categorie separat |

**Flux nou user:**
```
Register → Onboarding → /staples → middleware EnsureModuleAccess
    → redirect /purchase (dacă fără acces)
    → admin acordă acces manual după confirmare plată
    → acces complet la Today / Plan / Staples
```

**Prețurile** sunt configurabile din `/admin/modules` și `/admin/categories` — nu sunt hardcodate.

**Admins bypass** automat middleware-ul — au acces la tot fără intrare în `user_modules`.

## Structura frontend

```
resources/js/
  Pages/
    Auth/Login.tsx          # Tab login/register animat
    Onboarding.tsx
    Purchase.tsx            # Gate pagină plată (fără AppLayout)
    Today.tsx               # Ecranul principal (necesită acces modul 1)
    Plan.tsx                # (necesită acces modul 1)
    Staples.tsx             # (necesită acces modul 1)
    Explore.tsx             # Browser categorii premium (accesibil fără modul 1)
    Swap.tsx
    Complete.tsx
    Admin/                  # Dashboard, Users, Recipes, Ingredients, Modules, Categories, Stats
  Layouts/
    AppLayout.tsx           # Bottom nav (Today/Plan/Staples/Explore) + header cu ⚙
    AdminLayout.tsx         # Sidebar admin
  Components/
  store/                    # Zustand stores
  db/                       # Dexie schema
```

Paginile app folosesc `PageComponent.layout = AppLayout` (persistent layout Inertia).  
`Purchase.tsx` nu are layout — este o pagină standalone de gate.

## Rute

| Grup | Prefix | Middleware |
|------|--------|------------|
| Onboarding / Purchase / Explore | — | `auth` |
| App (Today/Plan/Staples/Swap/Complete) | — | `auth`, `module.access` |
| Admin | `/admin` | `auth`, `admin` |
| API | `/api` | `auth` (sesiune web) |

**Web routes cu acces gated:**
- `GET /purchase` — pagina de cumpărare (redirect la /today dacă are deja acces)
- `GET /explore` — browser categorii premium (fără gate modul 1)
- `GET /today`, `/plan`, `/staples`, `/swap/{day}`, `/complete/{day}` — necesită `module.access`

**API endpoints:** `/api/recipes`, `/api/user/progress` (GET/PUT), `/api/sync` (POST), `/api/analytics` (POST), `/api/explore` (GET — categorii premium cu locked flag)

## Baza de date — tabele relevante

| Tabel | Scop |
|-------|------|
| `modules` | Module disponibile (id, name, slug, price, is_active) |
| `user_modules` | Acces user la modul (pivot: user_id, module_id, purchased_at) |
| `recipes` | Rețete cu module_id și category_id (nullable) |
| `recipe_categories` | Categorii premium (id, module_id, name, slug, price, sort_order) |
| `user_categories` | Acces user la categorie (pivot: user_id, category_id, purchased_at) |

## Middleware custom

| Alias | Clasă | Comportament |
|-------|-------|-------------|
| `admin` | `AdminMiddleware` | 403 dacă nu e admin |
| `module.access` | `EnsureModuleAccess` | Redirect `/purchase` dacă nu are acces modul 1. Admins bypass. |

## Principii produs (NON-NEGOCIABILE)

- **Offline-first:** UI se randează din IndexedDB/Zustand — niciodată nu blochează pe rețea
- **Local wins:** La conflict local vs server, câștigă localul
- **Max 2 tap-uri** pentru a completa o zi
- **Zero prep time** afișat oriunde în app
- Exact **10 rețete** în Modulul 1, o singură utilizare per ciclu
- Default servings: **1** (nu 2)
- Post-onboarding redirect: **`/staples`** → middleware redirecționează la `/purchase` dacă fără acces

## Ce NU se construiește

- ❌ Rețete extra / browse rețete (în afară de Explore pentru categorii premium)
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
php artisan test          # toate testele PHP (32 teste)
npx tsc --noEmit          # verificare TypeScript
```

### Convenții importante pentru teste

- **`UserFactory`** generează `username` (nu `name`) și nu include `email_verified_at` — schema noastră nu are aceste câmpuri Breeze default
- **hCaptcha** este bypass-at automat în `APP_ENV=testing` — nu trimite `hcaptcha_token` în teste
- **Login** acceptă câmpul `login` (email SAU username), nu `email`
- **Redirecturi după autentificare:** utilizatori normali → `onboarding` (la register), admini → `admin.dashboard`
- **Acces modul în teste:** un user fără `user_modules` entry este redirecționat la `/purchase`. Pentru teste care necesită acces, creează modulul și inserează în `user_modules` manual (seeders nu rulează în `RefreshDatabase`)
- **Testele Breeze moștenite** (EmailVerification, ProfileTest cu `name`) au fost înlocuite cu teste relevante pentru app

### Structura testelor

```
tests/
  Feature/
    ExampleTest.php               # root redirect + acces today (cu/fără modul)
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

### Gotcha: chei pivot în `belongsToMany`

Laravel derivă automat cheia pivot din numele modelului. `RecipeCategory` → `recipe_category_id`. Deoarece coloana reală este `category_id`, relațiile trebuie să specifice explicit cheile:
```php
// User model
$this->belongsToMany(RecipeCategory::class, 'user_categories', 'user_id', 'category_id')
// RecipeCategory model  
$this->belongsToMany(User::class, 'user_categories', 'category_id', 'user_id')
```

### Gotcha: `category_id` absent din request

Dacă `category_id` lipsește din payload (nu e trimis deloc), `$data['category_id']` aruncă Notice în PHP 8.x. Folosește `??` pentru acces sigur:
```php
$data['category_id'] = ($data['category_id'] ?? null) ?: null;
```

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

# Better Breakfast — CLAUDE.md

## Limbă de comunicare

**Răspunsurile Claude sunt întotdeauna în română.** Interfața aplicației este în engleză, dar toate conversațiile și explicațiile sunt în română.

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
- **Plăți:** Stripe Checkout (hosted) — `stripe/stripe-php` v20
- **i18n:** EN/RO — soluție proprie (dicționare bundle-uite + `useT`), fără librărie i18n
- **Testare FE:** Vitest 4 + React Testing Library (jsdom)
- **AI:** Google Gemini 2.5 Flash (`GEMINI_API_KEY`) — calcul nutrițional + traduceri admin

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
Register → /purchase → Stripe Checkout → plată card
    → webhook checkout.session.completed → acces acordat automat în user_modules
    → /purchase?stripe_success=1 → PurchaseController redirect → /onboarding
    → /onboarding (setup servings) → /staples
```

**Redirect după acces:** `PurchaseController` verifică `foundation_done`:
- `false` → redirect `/onboarding` (user nou, nu a setat serving-urile)
- `true` → redirect `/staples` (user existent, a trecut deja prin onboarding)

**Admin bypass:** Admins bypass automat middleware-ul — au acces la tot fără intrare în `user_modules`.

**Fallback manual:** Adminul poate acorda/revoca accesul manual din `/admin/users` pentru cazuri excepționale (rambursări, erori tehnice).

**Prețurile** sunt configurabile din `/admin/modules` și `/admin/categories` — nu sunt hardcodate.

## Stripe — integrare plăți

| Variabilă env | Descriere |
|--------------|-----------|
| `STRIPE_KEY` | Publishable key (pk_test_... / pk_live_...) |
| `STRIPE_SECRET` | Secret key (sk_test_... / sk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret pentru verificare webhook (whsec_...) |

**Controller:** `App\Http\Controllers\StripeController`
- `POST /purchase/checkout` → `createCheckoutSession()` → redirect Stripe via `Inertia::location()`
- `POST /webhook/stripe` → `webhook()` — fără auth, fără CSRF (exclus în `bootstrap/app.php`)

**Checkout session — request body:**
```json
{ "type": "module",   "id": "module-breakfast-10-day" }
{ "type": "category", "id": "cat-highprotein" }
```
`type` determină în ce tabelă se inserează accesul după plată.

**Webhook metadata stocat în Stripe:**
```json
{ "user_id": 42, "type": "module", "item_id": "module-breakfast-10-day" }
{ "user_id": 42, "type": "category", "item_id": "cat-highprotein" }
```

**Logica webhook `checkout.session.completed`:**
- `type=module` → inserează în `user_modules` (`user_id`, `module_id`, `purchased_at`)
- `type=category` → inserează în `user_categories` (`user_id`, `category_id`, `purchased_at`)
- Backward compat: sesiuni vechi cu `module_id` direct (fără `type`) → tratate ca `type=module`
- Toate operațiile sunt logate cu `Log::info` / `Log::error`

**Webhook local (dev):**
```bash
stripe listen --forward-to betterbreakfast.test/webhook/stripe
```
`STRIPE_WEBHOOK_SECRET` local (whsec_...) e diferit de cel de producție — se actualizează la fiecare sesiune `stripe listen`.

**⚠️ Gotcha critic — semnătură webhook:**
`STRIPE_WEBHOOK_SECRET` de pe server trebuie să fie signing secret-ul din **același mod** (Test sau Live) cu cheile Stripe folosite. Dacă apare eroarea `No signatures found matching the expected signature`, secretul e greșit sau din modul greșit.

**Card de test Stripe:** `4242 4242 4242 4242`, orice dată viitoare, orice CVC.

**Ghid trecere pe Live:** `docs/Stripe_live.md`

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
    FoundationDay.tsx       # Day 0 — prep checklist (necesită acces modul 1)
    Explore.tsx             # Browser categorii premium (accesibil fără modul 1)
    ExploreRecipe.tsx       # Detaliu rețetă din categorie premium
    Swap.tsx
    Complete.tsx
    PrivacyPolicy.tsx       # Pagină publică, conținut din site_settings
    Admin/                  # Dashboard, Users, Recipes, Ingredients, Modules, Categories, Stats
  Layouts/
    AppLayout.tsx           # Bottom nav + header ⚙ + <PlanInitializer/> (asignare rețete)
    AdminLayout.tsx         # Sidebar admin
  Components/
  locales/
    en.ts                   # Dicționar UI EN (sursă de adevăr — typeof en = Dictionary)
    ro.ts                   # Dicționar UI RO (tipat Dictionary → tsc impune paritatea)
    index.ts                # getDictionary(locale)
  hooks/
    useT.ts                 # t('cheie', {param}) — interpolare + fallback ro→en→cheie
    useRecipes.ts           # useRecipes / useRecipesLoaded / useRecipeById / ...
    useEnsurePlanAssigned.ts # Asignare canonică rețete (montat în AppLayout)
  lib/
    localize.ts             # localizeRecipe / buildIngredientNameMap / localized
    translate.ts            # client helper → POST /admin/translate (Gemini)
    utils.ts                # cn, formatQty, convertUnit, shuffle (Fisher-Yates)
  store/
    userStore.ts            # progres user (Zustand persist `bb-user-progress`, sync server)
    settingsStore.ts        # locale EN/RO (Zustand persist `bb-settings`, per-device)
    syncStore.ts
  db/                       # Dexie schema (`bb` IndexedDB)
  __tests__/                # Teste Vitest (useT, localize, settingsStore)
```

Paginile app folosesc `PageComponent.layout = AppLayout` (persistent layout Inertia).  
`Purchase.tsx` nu are layout — este o pagină standalone de gate.

## Internaționalizare (i18n EN/RO)

Două sisteme distincte. Contract complet în memoria de proiect `i18n-contract`.

### 1. Texte UI — dicționare bundle-uite
- `locales/en.ts` e sursa de adevăr; `Dictionary = typeof en`. `ro.ts` e tipat `const ro: Dictionary` → **`tsc`/`npm run build` PICĂ dacă o cheie lipsește în RO** (paritate impusă de compilator).
- `useT()` → `{ t, dict, locale }`. `t('namespace.cheie', { param })` cu interpolare `{param}` și fallback `ro → en → cheia brută` (app-ul nu crapă la cheie lipsă, afișează EN).
- Locale persistat **per-device** în `settingsStore` (Zustand persist `bb-settings`) — NU se sincronizează cu serverul, NU e în `UserProgress`. Toggle EN/RO în `SettingsModal` (⚙).
- **Regulă:** orice text vizibil userului trece prin `t()`, niciodată hardcodat. La schimbarea textului EN, actualizează și valoarea RO (tsc prinde cheia lipsă, NU valoarea nesincronizată).

### 2. Conținut (rețete/ingrediente/categorii/module) — coloană DB
- Coloană `translations` JSON nullable pe `recipes`, `master_ingredients`, `recipe_categories`, `modules`. **EN = sursă de adevăr** în coloanele existente; RO trăiește în `translations.ro`.
- Frontend: `lib/localize.ts` — `localizeRecipe(recipe, locale)` (fallback EN per câmp), `buildIngredientNameMap` (chei pantry EN-stabile, ca bifele din Staples să nu se desincronizeze la schimbarea limbii), `localized()` (name/description generic).
- Serializare: `translations` e inclus în `/api/recipes`, `/api/explore`, props Inertia `ExploreRecipe` + `Purchase`.
- **Editarea EN din admin NU propagă în RO** — adminul re-traduce manual (revizuit de om).

### Traducere AI în admin
- `Admin\TranslationController` → `POST /admin/translate` (auth+admin). Gemini 2.5 Flash, `responseSchema` per tip: `recipe | ingredient | category | module | field | list`. Păstrează numere/unități/HTML.
- `lib/translate.ts` — helper client `translateContent(type, payload)`.
- `RecipeForm.tsx` are tab-uri **English / Română**; în tab-ul RO fiecare câmp (nume, fiecare ingredient, fiecare pas, substituții, why-this-works) are buton **„Tradu cu AI"** individual. Save scrie tot în `recipes.translations.ro`.
- Modules/Categories/Ingredients: câmp RO + buton AI; controllerele curăță blocul RO gol → `null`.

## Plan & asignare rețete

**Sursă unică:** rețetele se asignează exclusiv prin `useEnsurePlanAssigned()`, montat o singură dată în `AppLayout` printr-un `<PlanInitializer/>` (return null) în `SyncBootstrap`. Rulează pe orice ecran din app, deci garantează asignarea după onboarding (redirect → `/staples` → AppLayout, layout persistent, re-rulează când `recipesLoaded` devine true).

- **`Plan.tsx` NU mai asignează** — e pur preview + drag-reorder (`handleDragEnd`, acțiune user).
- Hook-ul: gated obligatoriu pe `useRecipesLoaded()` (`useLiveQuery` e `undefined` la primul render chiar dacă Dexie are date → fără gate s-ar asigna pe fallback-ul hardcodat). Completează doar zile `d >= currentDay` necompletate; **NU atinge** `completedDays`/zile trecute (istoricul nu se rescrie); păstrează asignările valide (fără reșuflare); shuffle = Fisher-Yates (`shuffle()` din `lib/utils.ts`).
- Reset/Restart asignează explicit toate 10 → hook-ul face early-return.

## Rute

| Grup | Prefix | Middleware |
|------|--------|------------|
| Onboarding / Purchase / Explore | — | `auth` |
| App (Today/Plan/Staples/Swap/Complete) | — | `auth`, `module.access` |
| Admin | `/admin` | `auth`, `admin` |
| API | `/api` | `auth` (sesiune web) |

**Web routes cu acces gated:**
- `GET /purchase` — pagina de cumpărare (redirect la **/staples** dacă are deja acces)
- `GET /explore` — browser categorii premium (fără gate modul 1)
- `GET /explore/recipe/{id}` — detaliu rețetă premium (fără gate modul 1, locked dacă categoria nu e cumpărată)
- `GET /foundation-day` — checklist prep Day 0 (necesită `module.access`)
- `GET /today`, `/plan`, `/staples`, `/swap/{day}`, `/complete/{day}` — necesită `module.access`

**API endpoints:** `/api/recipes`, `/api/user/progress` (GET/PUT), `/api/sync` (POST), `/api/analytics` (POST), `/api/explore` (GET — categorii premium cu locked flag), `/api/user/reset-plan` (POST — resetează progresul la ciclu nou)

## Privacy Policy

Pagina `/privacy-policy` este publică (fără auth) și conținutul ei se editează din `/admin/pages`.

### Stocare
- Tabel `site_settings` (key/value) — cheia `privacy_policy` conține HTML generat de TipTap.
- Model `App\Models\SiteSetting` cu helper-e statice `SiteSetting::get($key, $default)` și `SiteSetting::set($key, $value)`.

### Rute
| Rută | Controller | Descriere |
|------|-----------|-----------|
| `GET /privacy-policy` | `PrivacyPolicyController@show` | Pagină publică, fără auth |
| `GET /admin/pages` | `Admin\PagesController@index` | Editor admin |
| `PUT /admin/pages` | `Admin\PagesController@update` | Salvare conținut |

### Checkbox register
- Formularul de înregistrare (`Auth/Login.tsx`) include checkbox „I agree to the Privacy Policy" cu link activ spre `/privacy-policy` (se deschide în tab nou).
- Butonul Continue este blocat până la bifarea checkbox-ului (validare frontend + backend `accepted`).
- Câmpul trimis spre backend: `privacy_policy: '1'`.
- Validare Laravel: `'privacy_policy' => 'accepted'`.
- Teste: trimite `'privacy_policy' => '1'` în orice test de register.

## Afișarea conținutului rich text (TipTap HTML)

**`@tailwindcss/typography` NU este instalat** și NU trebuie instalat. Clasa `prose` din Tailwind nu funcționează fără plugin — nu o folosi.

### Pattern obligatoriu pentru render HTML din TipTap

Orice loc care afișează HTML salvat din `RichTextEditor` (substitutions, whyThisWorks, privacy policy etc.) **trebuie** să folosească clasa CSS `.rte-display`, definită în `resources/css/app.css`:

```tsx
// ✅ Corect — pentru afișare read-only a conținutului TipTap
<div
    className="text-sm text-gray-700 leading-relaxed rte-display"
    dangerouslySetInnerHTML={{ __html: content }}
/>

// ❌ Greșit — prose nu are efect, nu e instalat pluginul typography
<div
    className="prose prose-sm max-w-none text-gray-700"
    dangerouslySetInnerHTML={{ __html: content }}
/>
```

### CSS classes
| Clasă | Unde | Efect |
|-------|------|-------|
| `.rte-content` | `RichTextEditor` (editor TipTap) | Stilizare + placeholder |
| `.rte-display` | Pagini user (Today, PrivacyPolicy etc.) | Stilizare read-only |

Ambele sunt definite în `resources/css/app.css` și partajează aceleași reguli de bază (bold, italic, liste). `.rte-display` adaugă suport pentru headings (h1/h2/h3) pentru pagini cu conținut lung (e.g. Privacy Policy).

## UI — Explore (categorii premium)

Pagina `/explore` afișează categoriile premium ca tab-uri orizontale + un panou de detalii cu buton de unlock.

### Flux unlock categorie

Butonul Unlock din `UnlockModal` face `POST /purchase/checkout` cu `{ type: 'category', id: category.id }` — același endpoint ca Module 1, nu mailto. După plată:
- Stripe redirecționează la `/explore?stripe_success=1`
- Pagina detectează query param, afișează banner **"Thank you!"** și îl șterge după 5 secunde
- Categoria apare imediat deblocată (webhook procesează înainte de redirect)

### Convenție obligatorie pentru butoanele de categorie

- **Tab-urile mici** (selector categorie, sus) — afișează **doar numele** categoriei, fără preț.
- **Butonul mare verde** (Unlock) — afișează **numele + prețul**: `Unlock {Nume} — €{preț}`.

```tsx
// ✅ Corect
{cat.name}

// ❌ Greșit — nu afișa prețul în tab
{cat.name} <span>€{cat.price.toFixed(2)}</span>
```

Prețul apare o singură dată, în contextul acțiunii de cumpărare (butonul mare), nu în navigarea între categorii. Orice categorie nouă adăugată trebuie să respecte acest pattern.

## Foundation Day (Day 0)

Pagina `/foundation-day` este un checklist de prep înainte ca userul să înceapă ziua 1. Nu este o zi contorizată în ciclul de 10 — este opțională ca workflow dar **obligatorie ca pregătire** (ingredientele pregătite influențează calitatea săptămânii).

### State în Zustand (`UserProgress`)
- `foundationChecked: string[]` — ID-urile step-urilor bifate (ex: `'hard-boil-eggs'`, `'cook-chicken'`)
- `foundationDone: boolean` — setat la `true` când userul apasă "Go to today's recipe" cu toate step-urile obligatorii bifate

### Comportament
- Step-urile **opționale** (ex: Make Vinaigrette) nu blochează finalizarea
- "Go to today's recipe" e disabled până când toate step-urile non-opționale sunt bifate
- "Skip for now" navighează la `/today` fără a apela `completeFoundation()` — Foundation Day rămâne incomplet
- Pagina `Plan.tsx` afișează Foundation Day ca "Day 0" cu indicator de progres (`foundationChecked.length/9 steps done`)

### Secțiuni checklist
- **Cook**: Hard-Boil Eggs, Cook Chicken Breast, Cook Quinoa
- **Wash & Prep**: Leafy Greens, Fresh Herbs, Hardy Vegetables
- **Finishing Touches**: Squeeze Lemon Juice, Extract Pomegranate Seeds, Make Vinaigrette (optional)

## Baza de date — tabele relevante

| Tabel | Scop |
|-------|------|
| `modules` | Module disponibile (id, name, slug, price, is_active) |
| `user_modules` | Acces user la modul (pivot: user_id, module_id, purchased_at) |
| `recipes` | Rețete cu module_id și category_id (nullable) |
| `recipe_categories` | Categorii premium (id, module_id, name, slug, price, sort_order) |
| `user_categories` | Acces user la categorie (pivot: user_id, category_id, purchased_at) |
| `users` | Coloana relevantă: `current_session_id` (string nullable) — folosit de `EnsureSingleDevice` pentru single-device enforcement |
| `site_settings` | Setări cheie/valoare — ex: `privacy_policy` (HTML din TipTap) |
| `master_ingredients` | Listă master ingrediente (name unique, category, nutriție/100g) |

**Coloana `translations` (JSON nullable)** există pe `recipes`, `master_ingredients`, `recipe_categories`, `modules` — overlay RO `{ "ro": {...} }`; EN rămâne în coloanele existente. Migrații: `2026_05_16_120001..120004`.

## Auth — normalizare email și username

Email și username sunt **case-insensitive**: userul poate introduce `Test@Example.COM` sau `ADRIAN` și se salvează automat ca `test@example.com` / `adrian`.

**Implementare:**
- `RegisteredUserController::store()` face `$request->merge(['email' => Str::lower(...), 'username' => Str::lower(...)])` **înainte** de validare — regula `unique:users` rulează pe valoarea normalizată
- `ProfileUpdateRequest::prepareForValidation()` face același lucru pentru update profil
- `LoginRequest::authenticate()` face `->lower()` pe câmpul `login` înainte de query
- **Parola nu se atinge** — rămâne case-sensitive

Nu folosi regula `lowercase` în validare — ea aruncă eroare. Normalizează întotdeauna cu `Str::lower()` înainte de validare.

## Middleware custom

| Alias | Clasă | Comportament |
|-------|-------|-------------|
| `admin` | `AdminMiddleware` | 403 dacă nu e admin |
| `module.access` | `EnsureModuleAccess` | Redirect `/purchase` dacă nu are acces modul 1. Admins bypass. |
| `single.device` | `EnsureSingleDevice` | Un singur device activ per user. La login nou invalidează sesiunea veche via `current_session_id` pe `users`. |

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
- **GitHub repo:** `git@github.com:adriantoparceanu-droid/betterbreakfast-laravel.git`
- `.htaccess` în rădăcină redirecționează tot spre `public/`
- `deploy.php` — webhook declanșat de skill-ul `DEPLOY-BETTERBREAKFAST`
- **Instrucțiuni complete:** `DEPLOY.md`

**NU folosi:** Vercel, Supabase, Firebase, Docker — toate incompatibile cu cPanel shared hosting (CloudLinux LVE).

### Reguli OBLIGATORII pentru deploy și migrații

- ❌ **NICIODATĂ** nu copia/sincroniza baza de date locală (SQLite dev) pe serverul live (MySQL producție)
- ❌ **NICIODATĂ** nu rula `artisan db:seed` pe producție fără aprobare explicită din partea utilizatorului — nici manual, nici prin webhook
- ❌ **NICIODATĂ** nu include `INSERT` / date hardcodate în fișierele de migrație — migrațiile conțin doar schema (DDL), nu date
- ✅ Date de producție (module, categorii, rețete) se gestionează exclusiv prin interfața `/admin` de pe live
- ✅ Deploy-ul standard rulează doar: `git pull` + `composer install --no-dev` + `migrate --force` + `optimize`

## Analytics

Evenimente tracked via `track()` helper (`lib/analytics/index.ts`): `COMPLETE_DAY`, `SWAP_RECIPE`. Queue offline în Dexie, flush când e online. Fail silently.

**⚠️ Gap de tip:** `ExploreRecipe.tsx` trimite `EXPLORE_MADE_THIS` via `fetch` raw (nu via `track()`), deci nu e inclus în `AnalyticsEventName` din `types/app.ts`. La adăugarea de evenimente noi, folosește `track()` și adaugă tipul în union.

## Testare

**Regula:** după fiecare modificare se rulează `php artisan test` și `npx tsc --noEmit`. Ambele trebuie să treacă. La modificări frontend, rulează și `npm test` (Vitest).

```bash
php artisan test          # toate testele PHP (128 teste)
npx tsc --noEmit          # verificare TypeScript (include și fișierele de test)
npm test                  # Vitest — teste frontend (21 teste)
npm run test:watch        # Vitest watch
```

Config Vitest: `vitest.config.ts` + `vitest.setup.ts` (jsdom, alias `@/`, stub `route()`). Tipuri în `resources/js/vitest-env.d.ts`.

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
    I18nTest.php                  # TranslationController + persistență translations + serializare
    ExploreRecipeTest.php         # acces rețetă premium, made_count
    UserWorkflowTest.php          # E2E register→onboarding→ciclu 10 zile→restart
    Admin/
      RecipeTest.php              # CRUD rețete + toggle activ
      CategoryTest.php            # CRUD categorii premium
      RecipeImageUploadTest.php   # upload imagine
      RecipesPageTest.php         # pagina admin unificată

resources/js/__tests__/         # Vitest
  useT.test.tsx                  # switch EN/RO, interpolare, fallback, chei nested
  localize.test.ts               # localizeRecipe, buildIngredientNameMap, localized
  settingsStore.test.ts          # default EN, persist bb-settings
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

### Gotcha: câmpuri de parolă la register (iOS)

**NU** reintroduce trucul `readOnly` + `onTouchStart` + `unlock()` — era fragil și bloca complet desktop-ul. Câmpurile `password` și `password_confirmation` din `RegisterForm` folosesc atribute HTML standard: `autoComplete="new-password"` + `autoCorrect="off"` + `autoCapitalize="off"` + `spellCheck={false}`, cu `{...register(...)}` direct (RHF dă `name` distinct). iOS oferă sugestia „Strong Password" dar nu blochează tastarea manuală — userul poate scrie propria parolă.

### Mesaje de validare Zod (i18n)

Schemele Zod din `Login.tsx` se construiesc prin factory cu `t`: `makeLoginSchema(t)` / `makeRegisterSchema(t)`, memoizate cu `useMemo`. Orice mesaj de validare nou trece prin `t('auth.errX')`, nu string hardcodat.

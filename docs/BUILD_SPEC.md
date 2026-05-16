# BETTER BREAKFAST — BUILD SPEC (V5 MVP, WEB APP)

## 1. Product Overview

Better Breakfast is a mobile-first web app (PWA-style) delivering a 10-day guided breakfast system.

**Purpose:** Help users build a consistent, high-protein, high-fiber breakfast habit with minimal decisions and zero pressure.

**Core principles:**
- One action per day
- No decision overload
- No performance pressure
- Fast interaction (<10 seconds)
- Guided through constraint (not abundance)
- Native-app feel in a web environment

---

## 2. Platform & Access

**Platform:** Web-based (browser), designed as PWA-style app. Users instructed to "Add to Home Screen."

**Access Model:** Users must register/login with Email, Username, Password. After registration, users must purchase access to unlock the app.

### Paid Access Model

| Module | Slug | Price | Access |
|--------|------|-------|--------|
| 10-Day Breakfast Plan (Module 1) | `breakfast-10-day` | €9.99 one-time | Full app (Today, Plan, Staples) |
| Premium Recipes (Module 2) | `breakfast-premium` | per-category | Explore screen premium categories |

**Payment flow:** Stripe Checkout (hosted). User plătește online cu cardul → Stripe trimite webhook `checkout.session.completed` → Laravel acordă accesul automat în `user_modules`. Admin poate acorda/revoca accesul manual din `/admin/users` (pentru cazuri excepționale).

**Access gate:** After registration → `/purchase` → Stripe Checkout → webhook → `/onboarding` → `/staples`.

### Registration & Onboarding Flow

```
Register → /purchase → Stripe Checkout → webhook acordă acces → /onboarding → /staples
```

Admins bypass all access checks automatically.

### GDPR (Minimum Compliance)
Because email is collected, this falls under GDPR. You must include:
- Privacy note on auth screen: *"Used only for access and account recovery"*
- No additional data collection
- Ability to request deletion (manual is fine)

---

## 3. Core Features

### Module 1 — 10-Day Breakfast Plan (paid, €9.99)
- Auth (register/login)
- Onboarding (system explanation + setup)
- Today screen (main experience)
- 10-day progression system
- Fixed recipe pool (10 total)
- Smart swap system (unused recipes only)
- Completion tracking + check-in
- Pantry checklist (precise quantities)
- Portion scaling (global + per recipe)
- Restart functionality
- Purchase gate screen (before access granted)

### Module 2 — Premium Recipes (paid, per-category)
- Explore screen (accessible to all authenticated users, even without Module 1)
- Categories with horizontal pill navigation
- Per-category purchase via email
- Locked/unlocked state per category
- 3–5 categories at launch (High Protein, Quick Meals, Plant-Based, etc.)

---

## 4. Recipe System (FINAL LOGIC)

**Module 1 Total Recipes:** Exactly 10 recipes. No additions. No external browsing.

**Core Rule:** Each recipe can be used once per 10-day cycle.

**Daily Logic:**
- User is assigned a recipe
- User can swap with ANY recipe not yet used
- Used recipes are removed from pool

**Result:** No repetition. Decreasing choice set over time. Built-in completion structure.

**Module 2 Recipes:** Separate pool, organized by category. No interaction with Module 1 recipe pool.

---

## 5. Data Models

### Recipe
```ts
Recipe {
  id: string
  module_id: string          // which module this recipe belongs to
  category_id: string | null // Module 2 only — which premium category
  name: string
  image: string
  baseServings: number
  ingredients: {
    name: string
    quantity: number
    unit: string
    category: string   // for Staples grouping
  }[]
  steps: string[]
  nutrition: {
    calories: number
    protein: number
    fat: number
    carbs: number
    fiber: number
  }
}
```

### RecipeCategory (Module 2 premium categories)
```ts
RecipeCategory {
  id: string           // e.g. "cat-highprotein"
  module_id: string    // always "module-breakfast-premium"
  name: string
  slug: string         // unique
  description: string | null
  price: number        // per-category purchase price
  sort_order: number
  is_active: boolean
}
```

### MasterIngredient
```ts
MasterIngredient {
  id: string
  name: string   // unique — normalized, singular form (e.g. "Rolled oats")
  category: string  // one of: Proteins | Grains | Dairy | Fruits | Vegetables | Seeds & Nuts | Condiments
}
```

**Purpose:** Single source of truth for ingredient names. Prevents duplicates caused by typos, plural/singular inconsistencies, or casing variations. Used as autocomplete source in the admin recipe form.

**Populated via:** "Seed from recipes" button in `/admin/ingredients` — auto-imports unique ingredients from all existing recipes (both hardcoded and DB). Admin cleans up duplicates manually after seeding.

---

### User
```ts
User {
  email: string
  username: string
  passwordHash: string
}
```

### UserProgress
```ts
UserProgress {
  currentDay: number
  completedDays: number[]
  selectedRecipes: {
    [dayNumber]: recipeId
  }
  usedRecipeIds: string[]
  checkIns: {
    [dayNumber]: "energized" | "full" | "hungry"
  }
  pantryChecked: string[]
  defaultServings: number
}
```

### DB Tables (pivot / access)

| Table | Columns | Purpose |
|-------|---------|---------|
| `modules` | id (string PK), name, slug, description, price, is_active | Content modules |
| `user_modules` | user_id FK, module_id FK, purchased_at | Module 1 access grants |
| `recipe_categories` | id (string PK), module_id FK, name, slug, description, price, sort_order, is_active | Module 2 categories |
| `user_categories` | user_id FK, category_id FK, purchased_at | Per-category access grants |

---

## 6. Portion Logic (FINALIZED)

### Global Default Servings
- Set during onboarding
- Drives: Pantry quantities + Default recipe scaling

### Pantry Servings Control
- Adjustable at top of Staples screen
- Updates ALL pantry quantities

### Recipe-Level Servings (Temporary Override)
- Adjustable per recipe
- Affects: Only that recipe's ingredients
- Does NOT affect: Pantry or global default

**Principle:**
- Pantry = planning (precise + stable)
- Recipe = execution (flexible)

---

## 7. Navigation Structure

Bottom navigation: **Today** | **Plan** | **Staples** | **Explore**

Default = Today

Settings icon (⚙) in header — top right, accessible from all app screens.

**Explore** tab is visible to all authenticated users, even those without Module 1 access. It shows premium categories from Module 2.

---

## 8. Screen Specifications

### 8.1 AUTH SCREEN

**Inputs:** Email, Username, Password

**Elements:**
- Login / Register toggle (animated tabs)
- Privacy note: *"Used only for access and account recovery"*
- hCaptcha (bypassed in `APP_ENV=testing`)
- Login accepts `login` field (email OR username)
- CTA: "Continue"

---

### 8.2 ONBOARDING SCREEN (shown once, after first register)

**Content:**
- Short explanation: *"10 days. 10 breakfasts. No decisions."*
- Input: Number of servings (default: 1)
- CTA: "Start 10-Day Plan"

**Behavior:**
- Saves `defaultServings`
- Redirects to **Staples screen** (not Today) — user sets up pantry first
- Shown only once (flag in UserProgress or localStorage)

---

### 8.3 TODAY SCREEN (CORE)

**Header:**
- "Day X of 10"
- Progress bar
- Username greeting (e.g., "Good morning, Alex")

**Recipe Card:**
- Image (placeholder)
- Name
- Nutrition Row: `Calories | Protein | Carbs | Fat | Fiber`
- Servings Control (adjustable, local override only)
- Ingredients list (precisely scaled quantities)
- Steps (3–5 steps)

**Actions:**
- Primary: **"I made this"**
- Secondary: **"Swap"**

**⚠️ REMOVED:** ❌ No prep time shown anywhere

---

### 8.4 SWAP SCREEN

**Title:** "Choose another option"

**Shows:** ONLY recipes not yet used in current cycle

**Each Option Card:**
- Image
- Name
- Full nutrition row: `Calories | Protein | Carbs | Fat | Fiber`

**Behavior:** Tap → instantly replaces today's recipe (offline-first, no loading)

**⚠️ REMOVED:** ❌ No prep time shown

---

### 8.5 COMPLETION FLOW

**Step 1 — Overlay:**
- Text: "Day complete ✓"
- Full-screen animated overlay

**Step 2 — Check-in:**
- Text: "How did this feel?"
- Options: Energized | Full | Still hungry

**On confirm:**
- Add recipe to `usedRecipeIds`
- Save check-in
- Advance `currentDay`
- Dismiss overlay → Today screen updates to next day

---

### 8.6 PLAN SCREEN

**Layout:** 10 day cards in a list

**Day states:**
- Completed → ✓ checkmark
- Today → highlighted, "Today" badge
- Future → preview (recipe name if selected, "Not set" if not)
- Past → read-only, no editing

**Behavior:** Future days → tap opens Swap screen for that day

---

### 8.7 STAPLES SCREEN

**Organization:** By category:
- Proteins
- Grains
- Dairy
- Fruits
- Vegetables
- Seeds & Nuts
- Condiments

**Servings control:** At top of screen — adjusts ALL quantities

**Row Design:**
```
[ ] Ingredient name        Quantity + unit
```

**Rules:**
- Ingredient = primary focus (left, bold)
- Quantity = precise (right) — gram/ml accurate, NO rounding simplification
- Quantities scale with servings
- Checkbox toggle persisted in `pantryChecked`

---

### 8.8 SETTINGS (accessible via ⚙ icon in header)

**Options:**
- Restart plan → confirmation modal

**Restart modal:**
- Text: "Restart the 10-day plan?"
- Buttons: Cancel | Restart

**On restart:**
- Reset: `completedDays`, `selectedRecipes`, `usedRecipeIds`, `checkIns`, `pantryChecked`, `currentDay` → 1
- Keep: account data, `defaultServings`

---

### 8.9 PURCHASE SCREEN (gate — no app layout)

Shown to authenticated users without Module 1 access when they try to access any module-gated route.

**Layout:** Standalone page (no bottom nav, no app header — gate experience).

**Elements:**
- Brand logo / bowl emoji
- Module name + description
- "What's included" checklist:
  - 10 simple, nutritious breakfast recipes
  - Day-by-day guided 10-day plan
  - Shopping list (Staples)
  - Offline access — works without internet
  - Swap recipes you don't like
- Price: `€9.99 one-time`
- CTA button: `Purchase access — €9.99` → `POST /purchase/checkout` → redirect Stripe Checkout
- Footer note: *"Secure payment via Stripe. One-time charge, no subscription."*
- Banner `stripe_success=1`: "Payment confirmed! Your access is being activated." + buton "Check my access"
- Banner `stripe_canceled=1`: "Payment was canceled. You can try again."
- "Already purchased? Contact us to activate" link (fallback suport)
- Sign out button

**Redirect logic (PurchaseController):**
- Admin → redirect la `onboarding` (dacă `foundation_done = false`) sau `staples`
- User cu acces modul + `foundation_done = true` → redirect la `staples`
- User cu acces modul + `foundation_done = false` → redirect la `onboarding`
- User fără acces → render Purchase screen

---

### 8.10 EXPLORE SCREEN

Accessible to all authenticated users (even without Module 1 access). Shows Module 2 premium categories.

**Layout:** Uses AppLayout (bottom nav visible).

**Navigation:**
- Horizontal scrollable category pills at top
- Active pill highlighted in brand color
- Lock icon on pills for categories the user hasn't purchased

**Category content:**
- **Unlocked:** Full recipe cards (image, name, nutrition, ingredients, steps)
- **Locked:** Blurred recipe cards with lock icon overlay; category pill triggers Unlock modal

**UnlockModal (bottom sheet):**
- Category name + description
- Price badge
- "Unlock — €X.XX" CTA → opens mailto to `hello@betterbreakfast.eu` with pre-filled purchase request
- Admin contact note

**Data source:** `/api/explore` — returns categories with `has_access` flag; locked categories return recipes with `locked: true` and no detail data.

---

## 9. UX Constraints

- Max 2 taps to complete a day
- No unnecessary screens
- Inputs only in: Auth, Onboarding, Servings controls
- No typing during daily use
- No notifications

---

## 10. What NOT to Build

- ❌ No extra recipes (Module 1 is fixed at 10)
- ❌ No AI
- ❌ No social features
- ❌ No inventory tracking
- ❌ No gamification
- ❌ No prep time displayed anywhere
- ❌ No subscriptions — doar one-time payment per modul/categorie

---

## 11. Offline-First Implementation

### Core Principle (NON-NEGOTIABLE)
The app must always render from local data first, never from the network.

### What MUST be stored locally (IndexedDB via Dexie)
- All 10 recipes + ingredients + nutrition
- currentDay, selectedRecipes, usedRecipeIds, checkIns, pantryChecked, defaultServings

### App Load Flow
```
1. Read IndexedDB / Zustand persist
2. Hydrate app state
3. Render UI immediately
4. Check network status
5. If online → trigger background sync (silent)
```

### Offline Rules
- ❌ Never fetch recipes on every load
- ❌ Never store progress only on server
- ❌ Never block UI while syncing
- ❌ Never require connection for swap logic

### Conflict Strategy
**Local state always wins.** Single-user, low-risk. If mismatch: overwrite server with local.

---

## 12. Analytics

### Events tracked
```ts
// Complete day
{
  event: "COMPLETE_DAY",
  timestamp: number,
  dayNumber: number,
  recipeId: string,
  anonymousId: string,
}

// Swap recipe
{
  event: "SWAP_RECIPE",
  timestamp: number,
  dayNumber: number,
  fromRecipeId: string,
  toRecipeId: string,
  anonymousId: string,
}
```

### Anonymous ID
```ts
function getAnonymousId() {
  let id = localStorage.getItem("anon_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("anon_id", id);
  }
  return id;
}
```

### Rules
- ❌ Never store email, username, IP
- ✅ Works offline (queued in Dexie, flushed when online)
- ✅ Fail silently, retry later

### GDPR Note
Anonymous data (no cross-site tracking, no advertising) → likely no cookie banner needed, but must be disclosed in privacy policy.

---

## 13. Admin Panel

Admin routes are under `/admin/*`, accessible only to users with `role = "admin"`.

### Navigation tabs
| Tab | Route | Purpose |
|-----|-------|---------|
| Dashboard | `/admin` | Overview stats |
| Recipes | `/admin/recipes` | List, create, edit recipes (all modules) |
| Ingredients | `/admin/ingredients` | Master ingredient list — CRUD |
| Users | `/admin/users` | Manage user access + grant/revoke module & category access |
| Modules | `/admin/modules` | Manage content modules (name, price) |
| Categories | `/admin/categories` | Manage Module 2 premium categories |
| Stats | `/admin/stats` | Analytics |

---

### Admin — Users page (`/admin/users`)

**Module 1 access:** Grant / Revoke button per user.

**Module 2 category access:** Expandable row per user showing all premium categories. Grant/Revoke per category. Summary badge: "X/Y unlocked".

**Role toggle:** Promote to admin / demote from admin.

**Shows all users including admins.**

---

### Admin — Categories page (`/admin/categories`)

Manages the `recipe_categories` table (Module 2 premium categories).

**Features:**
- List categories with: module badge, active status, recipe count, price
- Add new category (name, slug auto-derived, description, price, sort_order)
- Inline edit (name, description, price, sort_order)
- Toggle active/inactive
- Delete (only if no recipes assigned)

---

### Admin — Ingredients page (`/admin/ingredients`)

Manages the `MasterIngredient` table.

**Features:**
- Filter list by name or category (live, client-side)
- Inline edit (click Edit → all fields become editable in-row, Save/Cancel)
- Delete with browser `confirm()` dialog
- Add new ingredient via form at top of list
- **"Seed from recipes"** button — one-time import of all unique ingredients from existing recipe data; admin fills in nutrition data afterward

**Fields per ingredient:**
- Name (unique)
- Category (dropdown from `INGREDIENT_CATEGORIES`)
- Calories / Protein / Fat / Carbs / Fiber per 100g (all nullable — shown as `—` until filled in)

**Purpose of nutrition data:** Used by the "Calculate from ingredients" button in the recipe form to auto-estimate nutrition values.

---

### Admin — Recipe Form (Ingredients section)

The ingredient rows in the recipe form have two admin-only enhancements:

#### Unit system toggle (Metric / Imperial)
- Toggle appears in the header of the Ingredients section
- Switches the Unit dropdown between two unit sets
- Auto-detected from existing ingredient units when editing a recipe (e.g. detects `tsp` → activates Imperial)
- Default for new recipes: Metric

**Metric units:** `ml`, `cl`, `dl`, `l`, `g`, `kg`

**Imperial units:** `tsp`, `tbsp`, `fl oz`, `cup`, `pt`, `qt`, `oz`, `lb`

**Universal units (always shown):** `whole`, `piece`, `slice`, `clove`, `can`, `packet`, `bunch`, `handful`, `sprig`, `stalk`, `head`, `knob`, `pinch`, `dash`, `drop`, `splash`, `drizzle`, `dollop`

Units are defined in `data/units.ts`.

#### Ingredient name — autocomplete search
- Text input replaced with combobox that searches `MasterIngredient` list
- Selecting from dropdown auto-fills **Name** and **Category** for that row
- If typed name has no match: inline option `+ Add "X" to ingredient list` appears
  - Admin picks category → Confirm → ingredient saved to master and selected
  - Does NOT block saving the recipe — adding to master is optional
- Master list updates in real-time within the form (no page reload needed)

#### Category field (Module 2 recipes)
- Dropdown showing active `RecipeCategory` options, filtered by selected module
- Required when module is `breakfast-premium`, optional otherwise

### Admin — Recipe form (`/admin/recipes/create`, `/admin/recipes/{id}/edit`)

The recipe form is a **dedicated Inertia page** (not a modal). Accessed via "+ Add Recipe" or "Edit" from the list.

#### Metric / Imperial toggle
- Toggle at the top of the Ingredients section (default: Metric)
- When switched, **all ingredient rows auto-convert** quantity + unit simultaneously
  - Metric → Imperial: `g→oz`, `kg→lb`, `ml→fl oz`, `l→fl oz`
  - Imperial → Metric: `oz→g`, `lb→g`, `fl oz→ml`, `tsp→ml`, `tbsp→ml`, `cup→ml`
  - Universal units (`whole`, `piece`, `clove`, etc.) are never converted
- Unit input is a **dropdown** grouped into Metric / Imperial / Universal
- New ingredient rows default to the unit system currently active
- What is saved to DB is whatever unit the admin has in the form at save time — no internal normalization

#### Calculate nutrition button
- Button "⚡ Calculate from ingredients" in the Nutrition section
- Reads current ingredient list from the form
- Converts each ingredient's quantity to grams using the unit map
- Looks up per-100g macros from `master_ingredients` table (passed as a prop)
- Divides by `base_servings` → fills Calories/Protein/Fat/Carbs/Fiber fields
- Ingredients not found in master list, with no nutrition data, or with universal units → skipped with amber warning list
- Fields remain editable after calculation

---

## 14. Access Control & Middleware

### Middleware

| Alias | Class | Applied to |
|-------|-------|------------|
| `auth` | Laravel's built-in | All app routes |
| `admin` | `AdminMiddleware` | `/admin/*` routes |
| `module.access` | `EnsureModuleAccess` | Today, Plan, Staples, Swap, Complete |

### EnsureModuleAccess logic
```
1. If user is admin → pass through
2. If user has module 'breakfast-10-day' in user_modules → pass through
3. Else → redirect to /purchase
```

### Route groups
```
/             → redirect to login (public)
/purchase     → auth (no module.access — accessible before paying)
/explore      → auth (no module.access — accessible without Module 1)
/onboarding   → auth
/today        → auth + module.access
/plan         → auth + module.access
/staples      → auth + module.access
/swap/{day}   → auth + module.access
/complete/{day} → auth + module.access
/admin/*      → auth + admin
/api/*        → auth (session cookie)
```

---

## 15. Decisions Made in Session

| Question | Answer |
|----------|--------|
| Recipe images | Placeholders now, replace later with real assets |
| Restart location | Settings icon (⚙) in app header |
| Username display | Shown in app (e.g., greeting on Today screen) |
| Communication language | Romanian (code and UI remain in English) |
| Default servings in onboarding | 1 (changed from 2) |
| Post-onboarding redirect | Staples screen (changed from Today) — user sets up pantry first |
| Ingredient duplicates | Solved via `MasterIngredient` table — admin curates list, recipe form uses autocomplete |
| Unit input in recipe form | Dropdown (not free text) — split into Metric / Imperial + Universal; system is per-form toggle, not stored in recipe |
| Unit system stored in recipe? | No — only the unit string is stored (e.g. `"tsp"`). System toggle is a UI-only helper for the admin |
| Ingredient name blocks save? | No — adding to master list is optional; admin can type a free name and still save the recipe |
| Module 1 price | €9.99 one-time — NOT free, never will be |
| Payment method | Stripe Checkout (hosted) → webhook acordă acces automat; admin poate gestiona manual din `/admin/users` |
| Module 2 structure | Per-category access at different prices |
| Explore accessibility | `/explore` accessible without Module 1 — lets users browse before paying |
| Category navigation | Horizontal scrolling pills |
| Number of categories at launch | 3–5 |
| Online payments | Implementat via Stripe Checkout — `stripe/stripe-php` v20, webhook `checkout.session.completed` |
| Admin bypass | Admins bypass `module.access` and `purchase` gate automatically |

---

## 16. Project Progress

### Completed

- [x] Auth system (login by email OR username, register, forgot password, hCaptcha)
- [x] Onboarding screen
- [x] Today screen (offline-first, Zustand + Dexie)
- [x] Plan screen
- [x] Staples screen
- [x] Swap screen
- [x] Complete screen (check-in flow)
- [x] Settings (restart plan)
- [x] Admin panel: Dashboard, Recipes, Ingredients, Users, Modules, Stats
- [x] Admin: Categories tab (Module 2 premium categories CRUD)
- [x] Admin: Per-user category grant/revoke
- [x] Admin: Role toggle (admin/user)
- [x] Module 1 paid access gate (`EnsureModuleAccess` middleware)
- [x] Purchase screen (Stripe Checkout CTA, standalone no-nav gate page)
- [x] Explore screen (Module 2 categories, locked/unlocked state, unlock modal)
- [x] DB: `recipe_categories`, `user_categories` tables + migrations
- [x] Seeder: Module 2 `breakfast-premium` + 3 categories + 10 premium recipes
- [x] Analytics (COMPLETE_DAY, SWAP_RECIPE events — offline queue)
- [x] Test suite (32 tests passing)
- [x] Fix: API /api/recipes now returns camelCase keys (`baseServings`) — nutrition displayed correctly in Today/Swap
- [x] Admin recipe form moved from modal → dedicated page (`/admin/recipes/create`, `/admin/recipes/{id}/edit`)
- [x] Recipe form: metric/imperial toggle auto-converts ingredient rows on switch
- [x] Recipe form: unit input is a dropdown (Metric / Imperial / Universal groups)
- [x] Recipe form: "Calculate from ingredients" button — estimates nutrition from master_ingredients per-100g data
- [x] master_ingredients: added 5 nullable nutrition columns (per 100g)
- [x] Admin Ingredients page: inline edit now includes all 5 nutrition fields
- [x] (2026-05-12) Fix: Recipe form ingredient category auto-fills from master ingredients list on select
- [x] (2026-05-12) Feature: Recipe form — Substitutions + Why this works collapsible sections cu rich text editor (TipTap v3, Bold/Italic/Liste)
- [x] (2026-05-12) Feature: Recipe form — drag-and-drop reordering pentru ingrediente și pași (dnd-kit)
- [x] (2026-05-12) DB: Adăugat coloanele `substitutions` și `why_this_works` (TEXT nullable) pe tabela `recipes`
- [x] (2026-05-13) Fix: RecipeSeeder setează `module_id` + `is_active` pentru toate cele 10 rețete din Modulul 1
- [x] (2026-05-13) Fix: API `/api/recipes` filtrează acum doar rețetele cu `module_id = module-breakfast-10day`
- [x] (2026-05-13) Fix: `bootstrapRecipes()` curăță Dexie înainte de bulkPut (elimină rețete vechi/greșite)
- [x] (2026-05-13) Fix: Today — auto-select robust, rezolvă zombie selection (selectedId setat pe rețetă inexistentă)
- [x] (2026-05-13) Fix: Plan — eliminat `isLocked`/`foundationDone` care bloca toate zilele; `DEFAULT_USER_PROGRESS.foundationDone = true`
- [x] (2026-05-13) Fix: `/purchase` redirecționează la `/staples` (nu `/today`) după grant acces sau plată
- [x] (2026-05-13) Feature: API `/api/recipes` returnează acum câmpurile `substitutions` și `whyThisWorks`
- [x] (2026-05-13) Feature: Today — afișează secțiunile Substitutions și Why this works (din rich text) când sunt prezente
- [x] (2026-05-13) Fix: Today/Plan — nutrition grid protejat cu null-check (nu mai crăpă când lipsesc date nutriționale)
- [x] (2026-05-13) Feature: Plan — auto-asignare rețete pentru zilele necompletate la mount
- [x] (2026-05-13) Feature: Admin Recipes — filtre module / categorie / status cu buton Clear filters
- [x] (2026-05-13) UI: Login — înlocuit emoji 🥣 cu ilustrație SVG ou prăjit; tagline actualizat
- [x] (2026-05-13) Feature: Admin Ingredients — buton "Lookup" via USDA FoodData Central API completează automat kcal/proteină/grăsime/carbohidrați/fibre per 100g (Add + Edit)
- [x] (2026-05-13) Feature: Admin Ingredients — eliminat butonul "Seed from recipes" din header
- [x] (2026-05-13) Seeder: MasterIngredientNutritionSeeder — 61 ingrediente cu valori nutritionale verificate (USDA + corecții manuale)
- [x] (2026-05-13) Feature: Privacy Policy — pagină publică /privacy-policy + editor TipTap în Admin Pages
- [x] (2026-05-13) DB: Creat tabela site_settings (key/value) pentru conținut editabil
- [x] (2026-05-13) DB: Redenumit categorii ingrediente — Grains → Grains & Legumes, Seeds & Nuts → Fats, Nuts & Seeds
- [x] (2026-05-13) Config: USDA FDC API key adăugat în config/services.php
- [x] (2026-05-13) Fix: Calculate from ingredients — toGrams() acum convertește unitățile universale (handful, pinch, dash, whole etc.) cu lookup WHOLE_GRAMS per ingredient
- [x] (2026-05-13) Fix: Calculate from ingredients — adăugat "Lemon juice" în master_ingredients (era lipsă, rețeta îl referencia ca "Lemon juice" nu "Lemon, juiced")
- [x] (2026-05-15) UI: Onboarding — redesign complet cu copy marketing, bullets beneficii, picker persoane, buton "Set up my kitchen"
- [x] (2026-05-15) UI: Purchase + Onboarding — înlocuit emoji 🥣 / cerc verde cu egg.png (consistent cu Login)
- [x] (2026-05-15) Flow: Register → Purchase (nu Onboarding) → după acces acordat → Onboarding → Staples
- [x] (2026-05-15) Feature: Stripe Checkout integration — `stripe/stripe-php` v20, `StripeController` cu `createCheckoutSession()` + `webhook()`
- [x] (2026-05-15) Feature: Webhook `POST /webhook/stripe` — verificare semnătură, event `checkout.session.completed`, acordare acces automat în `user_modules`
- [x] (2026-05-15) Config: `STRIPE_KEY`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET` în `.env` + `config/services.php`
- [x] (2026-05-15) Config: Stripe CLI instalat și autentificat; `stripe listen` configurat pentru testare locală
- [x] (2026-05-16) UI: Staples — header redesign: titlu + contor pe aceeași linie, card alb cu progress bar, text descriptiv, butoane Go to Foundation Day + Skip for now
- [x] (2026-05-16) Feature: Foundation Day — pagină completă (`/foundation-day`) cu 9 pași pe 3 secțiuni (Cook / Wash & Prep / Finishing Touches), progress bar, checklist persistent în Zustand
- [x] (2026-05-16) Feature: Plan — card Day 0 (Foundation Day) afișat deasupra zilelor 1–10, clickabil permanent, arată progresul pașilor bifați
- [x] (2026-05-16) Feature: Staples → Foundation Day button activ cu route real
- [x] (2026-05-16) Fix: Register form — autoComplete="off" pe câmpurile de parolă, elimină dialogul iOS "Use Strong Password" care bloca tastatura
- [x] (2026-05-16) Feature: PWA icons — generate iconițe corecte din egg.png pentru toate platformele (192/512 Android, maskable 512 adaptive, apple-touch-icon 180 iOS, favicon.ico 16/32/48)
- [x] (2026-05-16) Fix: iOS "Use Strong Password" — readonly trick pe câmpurile de parolă din register; readOnly setat via DOM în useEffect, eliminat sincron în onTouchStart înainte că Safari să afișeze dialogul
- [x] (2026-05-16) Fix: iOS confirm password field — adăugat focus() cu delay 50ms în unlock() pentru a forța tastatura după dismissarea dialogului nativ iOS pe câmpul 2 (Confirm password)
- [x] (2026-05-16) Fix: Purchase page — butonul Purchase dezactivat automat după plată confirmată; auto-refresh la fiecare 3s până când webhook-ul acordă accesul și controller-ul redirecționează
- [x] (2026-05-16) Fix: Purchase polling — menține ?stripe_success=1 la fiecare visit de poll; fără acest fix, primul poll dropa query param-ul și butonul revenea la starea normală înainte ca webhook-ul să acorde accesul
- [x] (2026-05-16) Refactor: StripeController — arhitectură multi-pachet generică (type=module|category + item_id în metadata); suportă Module 1 + categorii premium + orice pachet viitor
- [x] (2026-05-16) Feature: Explore — butonul Unlock trimite spre Stripe Checkout (înlocuiește mailto); polling + banner activating după plată, same pattern ca Purchase
- [x] (2026-05-16) Fix: Webhook — adăugat logging complet (Log::info/error) pentru diagnoză; backward compat cu sesiuni vechi (module_id fără type)

### In Progress / Planned

- [ ] Real recipe images (Module 1 + Module 2)
- [ ] Production deploy to betterbreakfast.eu (cPanel via FTP + webhook)
- [ ] Explore: fetch and cache Module 2 recipe data in Dexie for offline access
- [ ] Privacy policy page

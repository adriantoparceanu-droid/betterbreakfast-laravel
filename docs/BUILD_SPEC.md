# BETTER BREAKFAST — BUILD SPEC (V4 MVP, WEB APP)

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

**Access Model:** Users must register/login with Email, Username, Password.

**Purpose:** Restrict access to paying users. Enable account recovery.

### GDPR (Minimum Compliance)
Because email is collected, this falls under GDPR. You must include:
- Privacy note on auth screen: *"Used only for access and account recovery"*
- No additional data collection
- Ability to request deletion (manual is fine)

---

## 3. Core Features

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

---

## 4. Recipe System (FINAL LOGIC)

**Total Recipes:** Exactly 10 recipes. No additions. No external browsing.

**Core Rule:** Each recipe can be used once per 10-day cycle.

**Daily Logic:**
- User is assigned a recipe
- User can swap with ANY recipe not yet used
- Used recipes are removed from pool

**Result:** No repetition. Decreasing choice set over time. Built-in completion structure.

---

## 5. Data Models

### Recipe
```ts
Recipe {
  id: string
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

Bottom navigation: **Today** | **Plan** | **Staples**

Default = Today

Settings icon (⚙) in header — top right, accessible from all app screens.

---

## 8. Screen Specifications

### 8.1 AUTH SCREEN

**Inputs:** Email, Username, Password

**Elements:**
- Login / Register toggle
- Privacy note: *"Used only for access and account recovery"*
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

## 9. UX Constraints

- Max 2 taps to complete a day
- No unnecessary screens
- Inputs only in: Auth, Onboarding, Servings controls
- No typing during daily use
- No notifications

---

## 10. What NOT to Build

- ❌ No extra recipes
- ❌ No AI
- ❌ No social features
- ❌ No inventory tracking
- ❌ No gamification
- ❌ No prep time displayed anywhere

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
| Recipes | `/admin/recipes` | List, create, edit recipes |
| Ingredients | `/admin/ingredients` | Master ingredient list — CRUD |
| Users | `/admin/users` | Manage user access |
| Modules | `/admin/modules` | Manage content modules |
| Stats | `/admin/stats` | Analytics |

---

### Admin — Ingredients page (`/admin/ingredients`)

Manages the `MasterIngredient` table.

**Features:**
- Filter list by name or category (live, client-side)
- Inline edit (click Edit → fields become editable, Save/Cancel)
- Delete with browser `confirm()` dialog
- Add new ingredient via form at top of list (Name + Category → Save)
- **"Seed from recipes"** button — one-time import of all unique ingredients from existing recipe data (hardcoded + DB); admin cleans up duplicates after

**Fields per ingredient:** Name (unique), Category (dropdown from `INGREDIENT_CATEGORIES`)

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

---

## 14. Decisions Made in Session

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

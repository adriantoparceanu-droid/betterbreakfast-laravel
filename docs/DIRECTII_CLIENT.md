# Direcții implementare — Sistem Onboarding cu Modale

> Analiză bazată pe recomandările ChatGPT, adaptată specific pentru Better Breakfast.
> De implementat într-o sesiune viitoare.

---

## Principii de bază adoptate

### 1. State-driven, nu route-driven
Redirecturile bazate pe `if (!onboardingDone) redirect(...)` sunt fragile în context offline-first — Zustand se hidratează async, ceea ce poate crea flash de redirect greșit sau loop. Comportamentul app-ului se derivă din stare, nu din rute.

### 2. "Furthest progress wins" la reconciliere
Când există divergență între local (Zustand/Dexie) și server, câștigă întotdeauna starea mai avansată. Niciodată nu se face regresie automată a unui user.

### 3. Nu auto-reseta niciodată
`resetProgress()` din `userStore.ts` deja face asta corect (păstrează `onboardingDone: true` și `defaultServings`). Principiul trebuie extins și la modalele de onboarding — un restart de plan nu înseamnă că userul devine user nou.

---

## Bug existent de reparat prima dată

În `resources/js/types/app.ts`, `DEFAULT_USER_PROGRESS` are `foundationDone: true`.
Asta înseamnă că un user nou e considerat că a completat foundation din start — incorect.

```typescript
// Înainte (greșit)
foundationDone: true,

// După (corect)
foundationDone: false,
```

---

## 1. `setupStage` — valoare derivată, nu stocată

Nu se adaugă un câmp `setupStage` în `UserProgress`. Se derivă la runtime dintr-un hook dedicat:

```typescript
type SetupStage = 'needs_setup' | 'needs_staples' | 'active' | 'complete'

function useSetupStage(): SetupStage {
    const { onboardingDone, foundationDone, completedDays } = useUserStore(s => s.progress)
    if (!onboardingDone)              return 'needs_setup'
    if (!foundationDone)              return 'needs_staples'
    if (completedDays.length === 10)  return 'complete'
    return 'active'
}
```

**Avantaj:** nu există niciodată stare inconsistentă stocată. Tot ce e în `UserProgress` e sursa de adevăr; `setupStage` se calculează din el.

---

## 2. `seenModals: string[]` în UserProgress

Se adaugă un singur câmp nou în `UserProgress`:

```typescript
seenModals: string[]   // default: []
```

Fiecare modal are un ID fix. Modalul apare dacă ID-ul lui **nu e în `seenModals`**. Se marchează ca văzut imediat când apare (optimistic), fără să aștepte sync cu serverul.

### Modale propuse — în ordinea fluxului

| ID | Unde apare | Conținut |
|----|-----------|---------|
| `staples_welcome` | Prima vizită pe `/staples` | Explică ce e lista de staples și cum o bifezi |
| `plan_welcome` | Prima vizită pe `/plan` | Explică că sunt 10 zile, cum funcționează Foundation Day |
| `today_welcome` | Prima vizită pe `/today` | Explică că rețeta zilei e fixă, cum marchezi ziua completă |
| `swap_hint` | Primul swap | Explică că poți schimba orice rețetă o singură dată |

Patru modale, fiecare apare o singură dată, în context natural — fără ecran separat de "tur".

### Acțiune nouă în userStore

```typescript
markModalSeen: (id: string) =>
    set((s) => ({
        progress: {
            ...s.progress,
            seenModals: s.progress.seenModals.includes(id)
                ? s.progress.seenModals
                : [...s.progress.seenModals, id],
        },
    })),
```

---

## 3. Reconciliere `seenModals` local ↔ server

La sync, se face **union** (nu înlocuire):

```typescript
reconciledSeenModals = [...new Set([...localSeenModals, ...serverSeenModals])]
```

Dacă un modal a fost văzut pe orice device, nu mai apare niciodată pe niciun device. Niciodată nu se șterg ID-uri din listă.

---

## 4. Banner persistent "Continue setup"

Dacă `setupStage === 'needs_staples'` (onboarding done, foundation nu), se afișează un card sticky în partea de sus a oricărei pagini din app (în `AppLayout`):

> **Finish your kitchen setup →**
> Your shopping list is ready. Check off what you have.

Acesta protejează împotriva întreruperilor — user-ul a setat servings-urile, a plecat, s-a întors după 2 zile și știe exact unde a rămas.

---

## 5. Ce NU se schimbă

- Rutele rămân identice — niciun nou ecran de onboarding
- `AppLayout` rămâne cu bottom nav pentru toate paginile
- Modalele sunt componente în cadrul paginilor existente, nu pagini noi
- `resetProgress()` nu resetează `seenModals`

---

## Ordinea implementării

1. Fix `DEFAULT_USER_PROGRESS.foundationDone: false`
2. Adaugă `seenModals: string[]` în `UserProgress` + `DEFAULT_USER_PROGRESS`
3. Adaugă acțiunea `markModalSeen(id: string)` în `userStore`
4. Creează hook `useSetupStage()` în `resources/js/hooks/`
5. Creează componenta generică `<OnboardingModal id="..." />` în `resources/js/Components/`
6. Implementează cele 4 modale în paginile respective (Staples, Plan, Today, Swap)
7. Adaugă bannerul "Continue setup" în `AppLayout` (condiționat de `setupStage`)
8. Extinde sync-ul cu serverul să includă `seenModals` (union la reconciliere)
9. Adaugă coloana `seen_modals` (JSON) în tabela `user_progress` din baza de date

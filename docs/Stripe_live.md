# Stripe — Trecere pe Live (Plăți Reale)

Ghid pas cu pas pentru a comuta Better Breakfast de la modul Test la modul Live în Stripe.

---

## Pregătire — ce ai nevoie înainte să începi

- [ ] Cont Stripe activat și verificat (identity verification completat)
- [ ] Date bancare introduse în Stripe (pentru a primi plăți)
- [ ] Termeni și condiții acceptați în Stripe Dashboard
- [ ] Aplicația testată complet în Test mode (plăți, webhook, access grant)

---

## Pasul 1 — Obții cheile Live din Stripe Dashboard

1. Mergi pe **dashboard.stripe.com**
2. Toggle-ul din stânga sus → **Live mode** (nu Test mode)
3. **Developers → API keys**
4. Copiezi ambele chei:

| Cheie | Prefix | Unde o pui |
|-------|--------|-----------|
| Publishable key | `pk_live_...` | `STRIPE_KEY` în `.env` |
| Secret key | `sk_live_...` | `STRIPE_SECRET` în `.env` |

> ⚠️ Secret key se vede o singură dată la creare. Dacă o pierzi, trebuie să o regenerezi.

---

## Pasul 2 — Creezi endpoint-ul webhook în Live mode

1. În Stripe Dashboard, asigură-te că ești în **Live mode**
2. **Developers → Webhooks → Add endpoint**
3. Completezi:
   - **Endpoint URL:** `https://betterbreakfast.eu/webhook/stripe`
   - **Events to listen:** selectezi `checkout.session.completed`
4. Click **Add endpoint**
5. Pe pagina endpoint-ului, dai click **Reveal** la **Signing secret**
6. Copiezi valoarea (`whsec_live_...`) → aceasta e `STRIPE_WEBHOOK_SECRET` pentru producție

> ⚠️ Signing secret-ul din Live mode este **diferit** de cel din Test mode și de cel generat de `stripe listen` local.

---

## Pasul 3 — Actualizezi `.env` pe server

Mergi pe **cPanel → File Manager → `/home/andie/betterbreakfast.eu/.env`**

Înlocuiești cele 3 variabile Stripe cu valorile live:

```env
STRIPE_KEY=pk_live_...
STRIPE_SECRET=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

> Nu modifica altceva în `.env`. Salvează fișierul.

---

## Pasul 4 — Reîncarcă config-ul pe server

Declanșează webhook-ul de deploy (Claude poate face asta) sau rulează manual din cPanel Terminal:

```bash
cd /home/andie/betterbreakfast.eu
php artisan config:clear
php artisan optimize
```

Sau mai simplu: spui lui Claude `"reîncarcă config-ul"` și declanșează deploy-ul fără commit nou.

---

## Pasul 5 — Verifici că totul funcționează

### Test rapid cu card real

1. Creează un cont nou pe betterbreakfast.eu (sau folosește un cont existent fără acces)
2. Mergi la `/purchase`
3. Plătești cu un card real (sumă mică — €9.99)
4. Verifici că:
   - [ ] Redirecționează corect spre Stripe Checkout
   - [ ] După plată, revii pe `/purchase?stripe_success=1`
   - [ ] Bannerul "Payment confirmed! Activating your account…" apare
   - [ ] În maxim 5-10 secunde ești redirecționat la `/onboarding` sau `/staples`
   - [ ] În `/admin/users` userul are acces la modul 1

### Verifici livrarea webhook-ului

În Stripe Dashboard (Live mode) → **Developers → Webhooks → endpoint-ul tău → Recent deliveries**

Trebuie să apară un eveniment `checkout.session.completed` cu **HTTP 200**.

Dacă apare eroare (400, 500):
- **400** → `STRIPE_WEBHOOK_SECRET` greșit — reverifica pasul 3 și 4
- **500** → eroare în aplicație — verifici log-urile: `https://betterbreakfast.eu/deploy.php?token=...&log=1`

---

## Pasul 6 — Verifici log-urile aplicației

Accesează log-urile pentru a confirma că webhook-ul a procesat corect:

```
https://betterbreakfast.eu/deploy.php?token=5973e6f5...&log=1
```

Cauți linii de tipul:
```
Stripe webhook checkout.session.completed — userId=X, type=module, itemId=module-breakfast-10-day
Stripe webhook: acces modul acordat — userId=X, moduleId=module-breakfast-10-day
```

Dacă apare:
```
Stripe webhook: semnătură invalidă — No signatures found...
```
→ `STRIPE_WEBHOOK_SECRET` din `.env` nu se potrivește cu cel din Stripe Dashboard.

---

## Pasul 7 — Rambursare de test (opțional, recomandat)

Fă o rambursare din Stripe Dashboard pentru plata de test:
- **Payments → găsești plata → Refund**

Verifici că rambursarea funcționează. Accesul rămâne activ (nu se revocă automat la rambursare — se gestionează manual din `/admin/users`).

---

## Diferențe Test vs Live — rezumat

| | Test mode | Live mode |
|--|-----------|-----------|
| `STRIPE_KEY` | `pk_test_...` | `pk_live_...` |
| `STRIPE_SECRET` | `sk_test_...` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_test_...` | `whsec_live_...` |
| Card de plată | `4242 4242 4242 4242` | Card real |
| Bani transferați | Nu | Da |
| Webhook endpoint Stripe | Secțiunea Test | Secțiunea Live |

---

## Rollback la Test mode

Dacă ai o problemă și vrei să revii temporar la Test mode:

1. Înlocuiești cele 3 variabile în `.env` cu valorile de test
2. Reîncarcă config-ul (deploy webhook sau `config:clear` + `optimize`)
3. În Stripe Dashboard → Test mode → verifici că endpoint-ul de test există și are signing secret corect

---

## Checklist final înainte de lansare

- [ ] `STRIPE_KEY` începe cu `pk_live_`
- [ ] `STRIPE_SECRET` începe cu `sk_live_`
- [ ] `STRIPE_WEBHOOK_SECRET` este signing secret-ul din **Live mode** (nu Test, nu `stripe listen`)
- [ ] Webhook endpoint configurat în **Live mode** în Stripe Dashboard cu URL exact `https://betterbreakfast.eu/webhook/stripe`
- [ ] Eveniment selectat: `checkout.session.completed`
- [ ] Config reîncărcat pe server după modificarea `.env`
- [ ] Plată test cu card real procesată cu succes
- [ ] Log-urile confirmă `acces modul acordat` / `acces categorie acordat`
- [ ] Webhook deliveries în Stripe Dashboard arată HTTP 200

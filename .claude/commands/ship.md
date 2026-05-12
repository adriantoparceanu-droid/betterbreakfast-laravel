# /ship

Invocă skill-ul **DEPLOY-BETTERBREAKFAST** pentru deploy complet automatizat.

Skill-ul face: teste + TypeScript check → build Vite (dacă e nevoie) → actualizare BUILD_SPEC.md → commit + push → webhook deploy.php → verificare JSON → smoke test → raport final.

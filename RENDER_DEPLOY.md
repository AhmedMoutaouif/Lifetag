# Deploy Render (sans tunnel)

Ce projet est deja configure pour un deploy Render via `render.yaml`.

## 1) Preparer le repo

1. Commit/push ce projet sur GitHub.
2. Verifie que `render.yaml` est a la racine.

## 2) Creer une base Postgres gratuite

Render n'offre pas toujours Postgres gratuit selon le plan.  
Le plus simple: creer un Postgres gratuit sur [Neon](https://neon.tech) ou [Supabase](https://supabase.com).

Recupere ensuite l'URL complete:

`postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require`

## 3) Deploy automatique sur Render (Blueprint)

1. Va sur Render -> **New** -> **Blueprint**
2. Connecte ton repo `Lifetag`
3. Render detecte `render.yaml` et propose 2 services:
   - `lifetag-api`
   - `lifetag-frontend`
4. Lance la creation

## 4) Remplir les variables d'environnement

### Service `lifetag-api`

- `DATABASE_URL` = URL Postgres (Neon/Supabase)
- `JWT_SECRET` = cle secrete forte (32+ caracteres)
- `FRONTEND_URL` = URL publique du frontend Render
- `STRIPE_SECRET_KEY` (optionnel)
- `STRIPE_PREMIUM_PRICE_ID` (optionnel)
- `STRIPE_WEBHOOK_SECRET` (optionnel)

### Service `lifetag-frontend`

- `VITE_API_URL` = URL publique API Render (ex: `https://lifetag-api.onrender.com`)
- `VITE_PUBLIC_APP_URL` = URL publique frontend (ex: `https://lifetag-frontend.onrender.com`)

## 5) Verifier

- API logs: doit afficher `No pending migrations to apply.` puis `Server running...`
- Frontend: page login s'ouvre sans erreur CORS
- Test login avec un utilisateur existant

Si base vide, cree un admin:

```bash
node backend/seed-admin.js
```

ou sur Render Shell du service API:

```bash
node seed-admin.js
```

## 6) Domaine Cloudflare (sans cloudflared tunnel)

Dans Cloudflare DNS:

- `api.getlifetag.com` -> CNAME vers `lifetag-api.onrender.com` (Proxy ON)
- `getlifetag.com` ou `www.getlifetag.com` -> cible frontend Render

Puis:

- mets `FRONTEND_URL` (API) sur le domaine frontend final
- mets `VITE_API_URL` (frontend) sur le domaine API final
- redeploy les 2 services


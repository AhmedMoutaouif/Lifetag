# Déployer LifeTag

Stack : **frontend** Vite/React (statique) + **backend** Express + **Prisma** + **SQLite** (fichier sur le serveur).

---

## Guide gratuit pas à pas (avec ton nom de domaine)

Tu vas utiliser **deux services gratuits** :

| Partie | Service gratuit | Rôle |
|--------|-----------------|------|
| Site (pages React) | **Cloudflare Pages** | Héberge `https://www.tondomaine.com` (ou `app.…`) |
| API + base SQLite | **Un petit serveur Linux** | Tourne 24h/24 avec Docker |

Pour le serveur **gratuit** le plus fiable avec une **vraie base de données qui reste** :

1. **[Oracle Cloud — Always Free](https://www.oracle.com/cloud/free/)** : une VM ARM gratuite (parfois un peu long à obtenir).  
2. **Alternative** : une VM chez **Hetzner / OVH / Scaleway** à ~4–5 €/mois (plus simple si Oracle refuse).

Pour que **`https://api.tondomaine.com`** marche **sans ouvrir les ports 80/443** sur la box (simple et sécurisé), on utilise un **Cloudflare Tunnel** (gratuit).

### Schéma des URLs (exemple)

- `https://www.tondomaine.com` → site LifeTag (Cloudflare Pages)  
- `https://api.tondomaine.com` → API (Tunnel vers ta VM, port 5000)

Adapte les sous-domaines (`www`, `app`, `api`) comme tu veux, mais garde **une URL stable** pour l’API et **la même base** pour le site public (QR codes).

---

### Étape 1 — Mettre le domaine sur Cloudflare (gratuit)

1. Crée un compte sur [cloudflare.com](https://www.cloudflare.com).
2. **Ajoute ton site** (ton domaine).
3. Cloudflare te donne **2 serveurs DNS** (ex. `xxx.ns.cloudflare.com`).  
4. Chez **ton registrar** (là où tu as acheté le domaine), remplace les DNS par ceux de Cloudflare.  
5. Attends la propagation (souvent 15 min à quelques heures).

Tu gères ensuite **tous** les sous-domaines depuis Cloudflare.

---

### Étape 2 — Créer une VM Linux gratuite (Oracle Cloud)

1. Compte [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/).
2. **Créer une instance** :
   - Image : **Ubuntu 22.04** (ou 24.04)
   - Forme : **VM.Standard.A1.Flex** (ARM) avec 1 OCPU + 6 Go RAM (Always Free eligible)
   - Télécharge une **clé SSH** ou colle ta clé publique
3. Dans **Security List / pare-feu Oracle**, autorise au minimum le **SSH port 22** depuis ton IP (pour te connecter).  
   Tu n’es **pas obligé** d’ouvrir 80/443 si tu utilises le Tunnel.
4. Note l’**IP publique** de la VM.

Connexion depuis ton PC :

```bash
ssh -i ta_cle.pem ubuntu@IP_PUBLIQUE
```

(Sur Oracle l’utilisateur est souvent `ubuntu` ou `opc` selon l’image.)

---

### Étape 3 — Installer Docker sur la VM

Sur la VM :

```bash
sudo apt update && sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin git
sudo usermod -aG docker $USER
```

Déconnecte-toi / reconnecte-toi (`exit` puis SSH) pour que le groupe `docker` soit pris en compte.

---

### Étape 4 — Mettre le code sur la VM

**Option A — GitHub (recommandé)** : dépose le projet sur un dépôt (privé ou public), puis sur la VM :

```bash
cd ~
git clone https://github.com/TON_COMPTE/Lifetag.git
cd Lifetag
```

**Option B — Sans Git** : compresse le dossier `Lifetag` sur ton PC (zip), envoie-le avec **WinSCP** ou :

```bash
scp -i ta_cle.pem -r C:\Users\...\Desktop\Lifetag ubuntu@IP:/home/ubuntu/
```

---

### Étape 5 — Configurer l’API (variables d’environnement)

Sur la VM, dans le dossier du projet :

```bash
cd ~/Lifetag
cp .env.deploy.example .env.deploy
nano .env.deploy
```

Renseigne au minimum :

- **`JWT_SECRET`** : une longue chaîne aléatoire (ex. 40+ caractères).  
- **`FRONTEND_URL`** : **l’URL exacte** du site une fois déployé, par ex. `https://www.tondomaine.com` (sans slash final).  
- **`HOST_PORT=5000`** (par défaut).  
- Stripe : laisse vide pour tester sans paiement, ou mets tes clés **live** plus tard.

Lance l’API :

```bash
docker compose --env-file .env.deploy up -d --build
```

Vérifie sur la VM :

```bash
curl -s http://127.0.0.1:5000/api/...
```

(S’il n’y a pas de route publique sans auth, tu peux tester avec une route existante ou `curl -I`.)

Créer l’admin :

```bash
docker compose exec api node seed-admin.js
```

Note l’email / mot de passe affichés et **change le mot de passe** après la première connexion si possible.

---

### Étape 6 — Cloudflare Tunnel vers l’API (HTTPS sur `api.tondomaine.com`)

1. Va sur [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) (gratuit pour un usage perso léger).  
2. **Networks → Tunnels → Create a tunnel**.  
3. Nomme-le (ex. `lifetag-api`), installe **cloudflared** sur la VM en suivant la commande affichée (souvent un `wget` + `dpkg`).  
4. **Public hostname** :
   - Subdomain : `api`
   - Domain : `tondomaine.com`
   - Service type : **HTTP**
   - URL : `http://localhost:5000`
5. Enregistre. Cloudflare crée le DNS pour `api.tondomaine.com`.

Sur la VM, active le service tunnel (systemd) comme indiqué dans le tutoriel Cloudflare pour qu’il redémarre au boot.

Test : dans un navigateur, `https://api.tondomaine.com` peut répondre 404 sur `/` mais l’important est que les routes `/api/...` utilisées par l’app répondent.

---

### Étape 7 — Déployer le frontend sur Cloudflare Pages (gratuit)

1. Mets ton code sur **GitHub** (au moins le dossier `frontend` ou le monorepo).  
2. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**.  
3. Projet : choisis le repo, **root directory** : `frontend` (si le repo est la racine Lifetag).  
4. **Build settings** :
   - Build command : `npm run build`
   - Build output directory : `dist`
5. **Variables d’environnement** (onglet Settings → Environment variables) :

   - `VITE_API_URL` = `https://api.tondomaine.com`  
   - `VITE_PUBLIC_APP_URL` = `https://www.tondomaine.com` (ou l’URL **Pages** que tu vas attacher)

6. Lance un **Deploy**.

7. **Domaine personnalisé** : Pages → Custom domains → ajoute `www.tondomaine.com` (ou `tondomaine.com`). Cloudflare configure le DNS.

8. **Important** : remets **`FRONTEND_URL`** dans `.env.deploy` sur la VM **exactement** sur la même URL que le site (ex. `https://www.tondomaine.com`), puis :

```bash
docker compose --env-file .env.deploy up -d
```

(pour recharger l’env si besoin ; sinon `docker compose restart api`).

---

### Étape 8 — Vérifications

- Ouvre `https://www.tondomaine.com` : le site charge.  
- Inscription / connexion : doit parler à `https://api.tondomaine.com`.  
- Si erreur CORS : `FRONTEND_URL` doit **coller** à l’URL du navigateur (avec `https`, sans slash final).  
- QR d’urgence : doit utiliser `VITE_PUBLIC_APP_URL` (déjà dans le build).

---

## Pourquoi pas un hébergeur “Node gratuit” type Render sans VPS ?

Sur l’offre **gratuite** de beaucoup de PaaS, le disque est **éphémère** : ta **SQLite est effacée** à chaque redémarrage.  
Pour LifeTag tel qu’il est écrit, un **VPS + volume Docker** (ou un disque persistant payant) est le bon compromis gratuit / peu cher.

---

## Rappel : commandes Docker (déjà dans le repo)

```bash
cp .env.deploy.example .env.deploy
# éditer .env.deploy

docker compose --env-file .env.deploy up -d --build
docker compose exec api node seed-admin.js
```

- Base SQLite persistante : volume Docker `lifetag_db`.

---

## Build frontend en local (si tu préfères uploader `dist` à la main)

```bash
cd frontend
# Créer .env.production avec VITE_API_URL et VITE_PUBLIC_APP_URL
npm ci
npm run build
```

---

## Déploiement **sans Git**

### A) Frontend sur Cloudflare Pages (upload du dossier `dist`)

1. Sur ton PC, dans le dossier `frontend` :
   - Crée **`frontend/.env.production`** avec par exemple :
     - `VITE_PUBLIC_APP_URL=https://www.getlifetag.com`
     - `VITE_API_URL=https://api.getlifetag.com`
   - Puis :
     ```bash
     cd frontend
     npm ci
     npm run build
     ```
   - Le site compilé est dans **`frontend/dist/`**.

2. Installe l’outil Cloudflare (une fois) et connecte-toi :
   ```bash
   npm install -g wrangler
   wrangler login
   ```
   (Ou : `npx wrangler login` sans install global.)

3. Crée un projet Pages (une fois) :
   ```bash
   npx wrangler pages project create lifetag-frontend
   ```
   (Remplace `lifetag-frontend` par le nom que tu veux.)

4. Envoie le contenu de **`dist`** sur Pages :
   ```bash
   cd frontend
   npx wrangler pages deploy dist --project-name=lifetag-frontend
   ```

5. Dans le tableau de bord Cloudflare → **Workers & Pages** → ton projet → **Custom domains** → ajoute **`www.getlifetag.com`** (et la racine si besoin).

À chaque modification du site : refais **`npm run build`** puis **`npx wrangler pages deploy dist --project-name=lifetag-frontend`**.

---

### B) Backend sur la VM **sans Git** (copie des fichiers)

1. Sur ton PC, compresse le dossier du projet (zip) **sans** `node_modules` (optionnel mais plus léger).

2. Envoie-le sur la VM avec **WinSCP**, **FileZilla (SFTP)** ou en ligne de commande depuis Windows (PowerShell, avec ta clé SSH) :
   ```powershell
   scp -i "C:\chemin\vers\ta_cle.pem" -r C:\Users\...\Desktop\Lifetag ubuntu@IP_DE_LA_VM:/home/ubuntu/
   ```

3. Sur la VM :
   ```bash
   cd ~/Lifetag
   cp .env.deploy.example .env.deploy
   nano .env.deploy   # JWT_SECRET, FRONTEND_URL, Stripe…
   docker compose --env-file .env.deploy up -d --build
   docker compose exec api node seed-admin.js
   ```

4. Configure le **Cloudflare Tunnel** vers `http://localhost:5000` pour **`api.getlifetag.com`** (comme dans la section Tunnel plus haut).

---

### Alternative frontend ultra-simple (sans Wrangler)

- **[Netlify Drop](https://app.netlify.com/drop)** : glisser-déposer le dossier **`dist`** (après `npm run build`).  
- Puis dans Netlify : **Domain settings** → domaine personnalisé ; chez Cloudflare tu pointes un **CNAME** `www` vers l’URL Netlify indiquée (**DNS only** / nuage gris pour éviter un double proxy si besoin).

---

## Sécurité (court)

- `JWT_SECRET` fort et unique.  
- Ne commite pas `.env`, `.env.deploy`, `.env.production`.  
- Stripe : webhook en **https** vers ton URL API réelle ; clés **live** en production.

---

## Autres hébergeurs statiques (frontend)

- **Netlify** / **Vercel** : aussi gratuits avec domaine perso ; mêmes variables `VITE_*`.  
- Fichiers utiles : `frontend/public/_redirects` (Netlify), `frontend/vercel.json` (Vercel).

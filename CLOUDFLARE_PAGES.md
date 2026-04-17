# Deploy the LifeTag frontend on Cloudflare Pages

The frontend is a **Vite + React** SPA. Cloudflare Pages builds it from Git and serves static files from `frontend/dist`.

## Prerequisites

- Domain DNS on Cloudflare (e.g. `getlifetag.com`) **or** use the default `*.pages.dev` URL first.
- Your **API** URL reachable from browsers (HTTPS), with CORS allowing your frontend origin (see `FRONTEND_URL` on the backend).

## 1. Push the latest frontend to GitHub

Cloudflare builds from the repository. Ensure `master` (or your production branch) includes the `frontend/` folder.

## 2. Create a Pages project

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com).
2. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Authorize GitHub and select the **Lifetag** repository.

## 3. Build configuration

Use these settings (monorepo: only the frontend app is built):

| Setting | Value |
|--------|--------|
| **Production branch** | `master` (or your default branch) |
| **Root directory** | `frontend` |
| **Build command** | `npm ci && npm run build` |
| **Build output directory** | `dist` |

Optional but recommended:

| Environment variable (Build) | Example |
|------------------------------|---------|
| `NODE_VERSION` | `22` |

## 4. Environment variables (required for production)

In the project → **Settings** → **Environment variables**, add for **Production** (and **Preview** if you use previews):

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Public API base URL, **no trailing slash** (e.g. `https://api.getlifetag.com`) |
| `VITE_PUBLIC_APP_URL` | Public site URL used in QR links and redirects (e.g. `https://getlifetag.com` or `https://www.getlifetag.com`) |

Vite inlines these at **build time**. After changing them, trigger a **new deployment** (retry deployment or push a commit).

## 5. SPA routing

`frontend/public/_redirects` contains:

```txt
/* /index.html 200
```

So client routes (`/dashboard`, `/login`, etc.) work on refresh.

## 6. Custom domain

1. Pages project → **Custom domains** → **Set up a custom domain**.
2. Add `getlifetag.com` and/or `www.getlifetag.com` as documented by Cloudflare.
3. Set `VITE_PUBLIC_APP_URL` to the **canonical** URL you use in production (match `www` vs apex).

## 7. Backend CORS

In `backend/.env` (or your host env), set `FRONTEND_URL` to the same origin as the live site (no trailing slash), e.g. `https://getlifetag.com`.  
`server.js` also allows known hosts; keep your production frontend origin consistent.

## 8. Verify after deploy

- Open the production URL → landing page loads.
- Open `/login` directly → no 404.
- Login works (API URL and CORS correct).
- QR / emergency links use `VITE_PUBLIC_APP_URL` as expected.

## CLI alternative (optional)

If you prefer uploading a folder instead of Git:

```bash
cd frontend
npm ci
npm run build
npx wrangler pages deploy dist --project-name=lifetag-frontend
```

You must be logged in (`npx wrangler login`) and have created the project once in the dashboard or via Wrangler.

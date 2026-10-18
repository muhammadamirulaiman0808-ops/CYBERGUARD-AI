# CyberGuard AI

A website security scanner. Enter a public address and get a score out of 100, a pass/fail list of checks, and fixes ordered by importance. Scans are saved to a per-user history and can be exported as a PDF.

**What it checks (100 points):** HTTPS 25, SSL certificate 25 (15 if it expires in under 14 days), and six security headers: HSTS 12, CSP 12, X-Frame-Options 10, X-Content-Type-Options 6, Referrer-Policy 5, Permissions-Policy 5.
Risk: 80+ Low, 50-79 Medium, below 50 High. The analysis is rule-based, not an external AI.

**Stack:** FastAPI, SQLAlchemy, Supabase Postgres, JWT auth (backend only) / React 19, Vite, Tailwind v4, framer-motion, jsPDF.

## Folder structure

```
CyberGuardAI/
  backend/
    app/
      main.py          app, CORS, security headers, error handling
      config.py        environment variables
      database.py  models.py  schemas.py  crud.py  clock.py
      core/            security (JWT, bcrypt), rate_limit, url_guard (SSRF protection)
      routers/         auth, scan, history, profile, feedback
      services/        scanner, ssl_checker, header_checker, score, analysis
    tests/
    requirements.txt  requirements-dev.txt  .env.example
  frontend/
    src/
      components/  pages/  context/  hooks/  utils/  api.js  App.jsx  main.jsx  index.css
    package.json  vite.config.js  vercel.json  .env.example
```

## Run locally

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env              # then fill in DATABASE_URL and SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(48))"   # paste into SECRET_KEY
pytest                            # run the tests
uvicorn app.main:app --reload     # http://127.0.0.1:8000  (docs at /docs in development)
```

The start command is now `app.main:app`, not `main:app`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env              # VITE_API_URL=http://127.0.0.1:8000
npm run lint
npm run dev                       # http://localhost:5173
npm run build                     # production build into dist/
```

## Environment variables

| Backend | Purpose |
| --- | --- |
| `APP_ENV` | `development` or `production` (production hides /docs and ignores `ALLOW_PRIVATE_TARGETS`) |
| `DATABASE_URL` | Supabase pooler URL (port 6543). URL-encode special characters in the password |
| `SECRET_KEY` | At least 32 random characters. The app refuses to start without it |
| `ACCESS_TOKEN_MINUTES` | Login lifetime, default 60 |
| `FRONTEND_URL` | Allowed CORS origin(s), comma-separated |
| `FRONTEND_ORIGIN_REGEX` | Optional, e.g. Vercel preview URLs |
| `ALLOW_PRIVATE_TARGETS` | Development only. Lets you scan localhost |

| Frontend | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend address, no trailing slash |

## API

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/register` | no | 5 per minute per IP |
| POST | `/login` | no | Username or email. 10 per minute per IP |
| GET | `/full-scan?url=` | yes | 10 per minute per user. 400 for blocked targets, 502 if unreachable |
| GET | `/history` | yes | Newest first |
| GET | `/history/stats` | yes | Total, average, low/medium/high counts |
| GET / DELETE | `/history/{id}` | yes | Saved report / delete one |
| DELETE | `/history` | yes | Delete all |
| GET / PUT | `/profile` | yes | |
| PUT | `/profile/password` | yes | |
| POST | `/feedback` | optional | Username comes from the token only |
| GET | `/health` | no | |

Errors use proper HTTP status codes with a `detail` message.

## Security notes

- **SSRF protection:** only public IPs on ports 80, 443, 8080 and 8443. DNS is resolved and checked, and every redirect hop is validated again.
- Passwords are hashed with bcrypt. JWT secret comes from the environment. Tokens identify users by id.
- Rate limits are in memory, so they reset on restart and are per server instance.
- `.env` files must never be committed. If a key was ever pushed, rotate it.

## Migrating from the first version

1. Delete the old `.py` files sitting directly in `backend/` (everything outside `app/` and `tests/`). The code now lives in `backend/app/`.
2. Delete `node_modules`, `venv` and `__pycache__` from Git (`git rm -r --cached --ignore-unmatch node_modules frontend/node_modules backend/venv`).
3. The database tables are unchanged, so existing users and history keep working. Old users must log in again (new token format).
4. Generate a new `SECRET_KEY`.

Deployment (Render + Vercel) is covered separately.

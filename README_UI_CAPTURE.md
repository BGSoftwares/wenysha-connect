README — Capture frontend signup (local machine)

This file documents exact steps I used (on an Ubuntu-like machine) to reproduce the UI signup and capture the network request/response. Use the Playwright script when possible; Puppeteer is provided as a fallback.

Prerequisites
- Node.js (v18+ / v20+ recommended)
- npm
- Backend running (Django) and reachable. In this workspace I used the backend on port `8001`.
- Frontend dev server running (Vite) — default used here is `http://localhost:8081`.

1) Start the backend (example used here)

```bash
cd backend
./venv_linux/bin/python manage.py runserver 8001
```

2) Start the frontend dev server

```bash
# workspace root
npm run dev
# Vite in this workspace started on http://localhost:8081
```

3) Programmatic (fast) signup using the frontend fetch logic

This mirrors `src/lib/api.ts`'s `signup()` call.

```bash
# from workspace root
node scripts/programmatic_signup.js

# You can override values via env vars, for example:
VITE_API_BASE_URL=http://127.0.0.1:8001/api EMAIL=test+auto@example.com node scripts/programmatic_signup.js
```

4) Capture the signup using Playwright (recommended)

Install Playwright and browsers:

```bash
npm install -D playwright
npx playwright install
```

Run the script I added:

```bash
# from workspace root
node scripts/capture_signup_playwright.js

# If your frontend runs on a different URL:
FRONTEND_URL=http://localhost:8081 node scripts/capture_signup_playwright.js
```

Notes: In some environments (containers, CI) Playwright may require additional system packages. If `npx playwright install` fails with system package errors, prefer the Puppeteer script below or install the needed OS packages.

5) Capture the signup using Puppeteer (fallback)

Install Puppeteer (and system libs if needed):

On Debian/Ubuntu, install missing libs first (example list):

```bash
sudo apt-get update
sudo apt-get install -y \
  libatk1.0-0 libatk-bridge2.0-0 libgtk-3-0 libnss3 libxss1 libasound2 \
  libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxrandr2 libgbm1 \
  libpangocairo-1.0-0 libpango-1.0-0 libcups2 libdbus-1-3 libxtst6 fonts-liberation

npm install -D puppeteer
```

Run the CJS Puppeteer script (this workspace uses ESM by default so the CJS file is provided):

```bash
node scripts/capture_signup_puppeteer.cjs

# Example with env overrides:
FRONTEND_URL=http://localhost:8081 EMAIL=test+ui@example.com node scripts/capture_signup_puppeteer.cjs
```

6) Verify DB write (Django ORM)

```bash
# from workspace root (use absolute venv path if needed)
/workspaces/wenysha-connect/backend/venv_linux/bin/python /workspaces/wenysha-connect/backend/manage.py shell -c "from core.models import PendingApproval; print(PendingApproval.objects.filter(email__contains='prog_frontend_').values_list('email', flat=True))"
```

Files added in this repository for these steps
- `scripts/programmatic_signup.js` — lightweight node fetch script that mirrors the frontend API call
- `scripts/capture_signup_playwright.js` — Playwright capture script (may require system deps)
- `scripts/capture_signup_puppeteer.cjs` — Puppeteer capture script (CJS) for environments where Playwright install fails

If you want, I can convert one of these into a CI-friendly test (Playwright test or Jest + node fetch). Tell me which and I will add it.

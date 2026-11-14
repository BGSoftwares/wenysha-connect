# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

**Reconnect / resync with GitHub (one-click)**

If the Lovable ↔ GitHub link is disconnected or the default branch (`main`) needs to be resynced, use one of the bundled scripts from the project root:

- **Windows:** right-click `reconnect-github.ps1` and choose **Run with PowerShell**.
- **macOS / Linux:** run `./reconnect-github.sh` in a terminal.

Each script will:

1. Point the `origin` remote to `https://github.com/BGSoftwares/AbleGodCollegeELibrary.git`.
2. Fetch the latest `main` from GitHub.
3. Merge any remote changes into the local `main`.
4. Push the local `main` to GitHub so both branches are in sync.

> Note: If the GitHub App authorization in Lovable itself has expired, reconnect it first via the Lovable editor: **Plus (+) menu → GitHub → Connect project**. Then run the script to resync `main`.

## What technologies are used for this project?


This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

### AI Coach configuration

The teacher AI Coach calls the `student-feedback-ai` Supabase Edge Function. Set
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the frontend, then
configure these secrets for the Edge Function:

- `LOVABLE_API_KEY` — the server-side Lovable AI key.
- `DJANGO_API_BASE_URL` — the backend API base URL, including `/api` (for example,
  `https://your-backend.example.com/api`). The function uses it to confirm that a
  request comes from an active teacher account before generating feedback.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

### Self-hosted Docker deployment

The Compose deployment serves the frontend and API through Nginx over HTTPS.
It requires a public DNS name, an externally managed MySQL database, and a
certificate directory containing `fullchain.pem` and `privkey.pem` as regular
files (not symlinks to paths outside the mounted directory).

1. Copy `deploy.env.example` to `deploy.env`. Set `DOMAIN`, `TLS_CERT_DIR` to
   the host directory containing the certificate files, and the MySQL
   connection values. Set `DJANGO_SECRET_KEY` to a unique random value of at
   least 50 characters (for example, generate one with
   `python -c "import secrets; print(secrets.token_urlsafe(64))"`).
2. Ensure the certificate is valid for `DOMAIN`, the MySQL server accepts
   connections from the Docker host, and inbound TCP ports 80 and 443 are
   allowed. Do not expose MySQL publicly unless your provider requires it;
   restrict its network access to the application host.
3. Validate and start the deployment:

   ```sh
   docker compose --env-file deploy.env config --quiet
   docker compose --env-file deploy.env up --build -d
   ```

The stack also runs a Redis container (set `REDIS_PASSWORD`) that holds login
rate limits, lockouts and MFA state shared by all backend replicas; nginx
load-balances `BACKEND_REPLICAS` API containers. Backend containers run as a
non-root user, so a media volume created by an older version needs a one-time
`chown` (see `docs/SECURITY.md`). Admins must set up two-step verification at
first sign-in (`MFA_REQUIRED_ROLES`). Read `docs/SECURITY.md` for the full
security setup, including enforcing the Content-Security-Policy.

Compose runs database migrations before starting the API. Uploaded media is
stored in a Docker volume; back up that volume and the external MySQL database
regularly. Keep `deploy.env` and private TLS keys out of version control.
Configure optional `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
before building if the Supabase-backed AI features are used. Build-time Vite
values are embedded in the frontend image, so rebuild after changing them.

### PythonAnywhere (Django WSGI)

The Django WSGI application can serve the built React app from the same
PythonAnywhere web app. Use a PythonAnywhere account with a custom domain and
HTTPS for production. The application needs a writable, persistent media
directory and a database that the PythonAnywhere account can reach. A managed
MySQL database is recommended for production; SQLite is suitable only for
small single-instance deployments with reliable backups.

1. Clone the repository into your PythonAnywhere home directory. In a Bash
   console, create a virtual environment and install the backend dependencies:

   ```sh
   cd ~/wenysha-connect
   python3.11 -m venv ~/.virtualenvs/wenysha-connect
   source ~/.virtualenvs/wenysha-connect/bin/activate
   pip install -r backend/requirements.txt
   ```

   Select this virtualenv and a compatible Python version in the PythonAnywhere
   **Web** tab. If `mysqlclient` cannot be installed in that environment, use
   PythonAnywhere's documented MySQL client setup or choose a supported
   database configuration before deploying.

2. Create `backend/.env` on the server (it is ignored by Git) and set at least:

   ```dotenv
   DJANGO_DEBUG=False
   DJANGO_SECRET_KEY=<unique-random-secret-at-least-50-characters>
   DJANGO_ALLOWED_HOSTS=<your-domain>,<your-PythonAnywhere-domain>
   CSRF_TRUSTED_ORIGINS=https://<your-domain>,https://<your-PythonAnywhere-domain>
   CORS_ALLOWED_ORIGINS=https://<your-domain>,https://<your-PythonAnywhere-domain>
   DJANGO_SECURE_SSL_REDIRECT=True
   DJANGO_MEDIA_ROOT=/home/<username>/wenysha-connect-media
   MYSQL_HOST=<database-host>
   MYSQL_PORT=3306
   MYSQL_DATABASE=<database-name>
   MYSQL_USER=<database-user>
   MYSQL_PASSWORD=<database-password>
   ```

   For a single-instance SQLite setup, use `USE_SQLITE=True` instead of the
   `MYSQL_*` settings and make regular offsite backups of
   `backend/db.sqlite3`. Keep the `.env` file and database credentials private.
   Create the media directory and ensure the WSGI process can write to it.

3. Build the frontend for same-origin Django hosting. The example file sets the
   API to `/api` and bundled asset URLs to `/static/`:

   ```sh
   cd ~/wenysha-connect
   cp frontend.pythonanywhere.env.example .env.production
   npm ci
   npm run build
   ```

   The build output must remain in the repository-root `dist` directory. The
   Django settings automatically collect files from that directory when it
   exists. If using the AI Coach, also provide `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_PUBLISHABLE_KEY` during the frontend build, and configure
   `LOVABLE_API_KEY` and `DJANGO_API_BASE_URL` as Supabase Edge Function
   secrets. Keep the AI key out of frontend variables and Django settings.

4. In the PythonAnywhere **Web** tab, create a manual-config web app and point
   its WSGI configuration file to the backend. A minimal configuration is:

   ```python
   import os
   import sys

   project_root = "/home/<username>/wenysha-connect"
   sys.path.insert(0, os.path.join(project_root, "backend"))
   os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

   from django.core.wsgi import get_wsgi_application
   application = get_wsgi_application()
   ```

   The Django settings load `backend/.env` automatically. Set the virtualenv
   path in the Web tab, then run migrations and collect static files from a
   Bash console using that same virtualenv:

   ```sh
   cd ~/wenysha-connect/backend
   source ~/.virtualenvs/wenysha-connect/bin/activate
   python manage.py migrate --noinput
   python manage.py collectstatic --noinput
   ```

   Add PythonAnywhere static-file mappings for `/static/` to
   `/home/<username>/wenysha-connect/backend/staticfiles` and `/media/` to the
   persistent directory configured by `DJANGO_MEDIA_ROOT`. Reload the web app
   after configuration changes. `/api/health/` reports backend/database
   health; the site root and React client-side routes serve the frontend when
   `dist/index.html` is present.

The frontend and API may also be deployed separately on other providers. Set
`VITE_API_BASE_URL` to the deployed API's `/api` URL when building the frontend,
and set `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` to the exact HTTPS
frontend origin in Django. Configure persistent storage for uploaded media,
HTTPS, a private production secret, and a production database. The existing
Docker Compose path is intended for providers that support containers, an
external MySQL service, persistent volumes, and TLS certificates; it is not a
one-click template for every hosting provider.

The frontend currently attempts to connect to a WebSocket notification URL,
but this Django deployment does not provide a matching WebSocket consumer.
Deployments should not rely on realtime WebSocket notifications until a
compatible ASGI/WebSocket service is implemented and configured.

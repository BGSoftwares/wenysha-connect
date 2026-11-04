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

Compose runs database migrations before starting the API. Uploaded media is
stored in a Docker volume; back up that volume and the external MySQL database
regularly. Keep `deploy.env` and private TLS keys out of version control.
Configure optional `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
before building if the Supabase-backed AI features are used. Build-time Vite
values are embedded in the frontend image, so rebuild after changing them.

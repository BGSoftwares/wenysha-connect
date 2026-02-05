# Connect This Project to GitHub

This repo is intended to connect to: **https://github.com/BGSoftwares/wenysha-connect.git**

## Prerequisites

- **Git** installed and on your PATH: [git-scm.com](https://git-scm.com/download/win)

## Steps (run from project root)

### 1. Initialize Git (if not already)

```bash
git init
```

### 2. Add the GitHub remote

```bash
git remote add origin https://github.com/BGSoftwares/wenysha-connect.git
```

If `origin` already exists and points elsewhere, either update it:

```bash
git remote set-url origin https://github.com/BGSoftwares/wenysha-connect.git
```

or add a different name:

```bash
git remote add github https://github.com/BGSoftwares/wenysha-connect.git
```

### 3. Ensure secrets are not committed

The `.gitignore` already excludes:

- `backend/.env` (Django + MySQL + superuser credentials)
- `backend/venv/`
- `.env` (frontend)

**Do not remove these.** Never commit `.env` or real passwords.

### 4. Stage, commit, and push

```bash
git add .
git status
# Review: ensure backend/.env and backend/venv/ do NOT appear
git commit -m "Wenyasha Connect: React + Django backend + MySQL schema"
git branch -M main
git push -u origin main
```

If the GitHub repo already has content (e.g. a README), you may need:

```bash
git pull origin main --allow-unrelated-histories
# Resolve any conflicts, then:
git push -u origin main
```

### 5. Authentication

- **HTTPS:** Git will prompt for your GitHub username and a **Personal Access Token** (not your GitHub password). Create one at: GitHub → Settings → Developer settings → Personal access tokens.
- **SSH:** If you use SSH keys, use the SSH URL: `git@github.com:BGSoftwares/wenysha-connect.git` and set `origin` to that instead.

---

**Superuser (already set in `backend/.env`, not committed):**

- Username: `wenyasha`
- Email: `admin@wenyasha.edu.zw`
- Password: (stored in `backend/.env` as `DJANGO_SUPERUSER_PASSWORD`)

Run backend setup (after installing Python and MySQL): `cd backend` then `.\setup-and-run.ps1` or `setup-and-run.bat`. The superuser will be created automatically on first migrate.

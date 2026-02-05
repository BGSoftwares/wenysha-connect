# Wenyasha Connect – Backend (Django + MySQL)

## Python

You need **Python 3.10+** on this machine.

- **Option A:** Install from [python.org](https://www.python.org/downloads/) (check “Add Python to PATH”).
- **Option B:** Use the Windows Store “Python 3.12” (or similar).

There is no “Python in this folder” – the virtual environment (`venv`) will use whatever `python` (or `py`) is on your PATH.

## Superuser (already configured)

In `backend/.env` (do not commit this file):

- **Username:** `wenyasha`
- **Email:** `admin@wenyasha.edu.zw`
- **Password:** (stored as `DJANGO_SUPERUSER_PASSWORD` in `.env`)

When you run the setup script, the superuser is created automatically if these three env vars are set.

## Quick run

1. Create the MySQL database (see project root `docs/RUN.md`).
2. Edit `backend/.env` and set `MYSQL_PASSWORD` (and any other MySQL settings).
3. From the **backend** folder:

   **PowerShell:**
   ```powershell
   .\setup-and-run.ps1
   ```
   **CMD:**
   ```cmd
   setup-and-run.bat
   ```

4. Open: **http://127.0.0.1:8000/admin** and log in with the superuser above.

## GitHub

Repo: **https://github.com/BGSoftwares/wenysha-connect.git**

See **docs/GITHUB.md** in the project root for connecting this project to GitHub and pushing. Ensure Git is installed and that you never commit `backend/.env` or `backend/venv/`.

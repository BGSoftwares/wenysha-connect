# How to Run Wenyasha Connect (Frontend + Backend)

## Prerequisites

- **Node.js** (v18+) and **npm**
- **Python** 3.10+
- **MySQL** 5.7+ or 8.x
- **MySQL database** created, e.g. `wenyasha_connect`

---

## 1. Database (MySQL)

Create database and user:

```sql
CREATE DATABASE wenyasha_connect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wenyasha'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL ON wenyasha_connect.* TO 'wenyasha'@'localhost';
FLUSH PRIVILEGES;
```

---

## 2. Backend (Django)

**Requirement:** Python 3.10+ on your PATH (e.g. from [python.org](https://www.python.org/downloads/) or Windows Store).

**Option A – one-shot script (recommended):**

From the project root:

```bash
cd backend
# PowerShell:
.\setup-and-run.ps1
# Or CMD:
setup-and-run.bat
```

The script creates the venv, installs dependencies, copies `.env.example` to `.env`, runs `makemigrations` and `migrate`, then starts the server. Edit `.env` with your MySQL settings and `DJANGO_SECRET_KEY` before or after the first run. Run `python manage.py createsuperuser` manually afterward (or set optional `DJANGO_SUPERUSER_*` in `.env` for non-interactive create).

**Option B – manual steps:**

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate  (PowerShell: venv\Scripts\Activate.ps1)
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Create `.env` from `.env.example` and set:

- `MYSQL_DATABASE=wenyasha_connect`
- `MYSQL_USER=wenyasha`
- `MYSQL_PASSWORD=your_password`
- `MYSQL_HOST=127.0.0.1`
- `MYSQL_PORT=3306`
- `DJANGO_SECRET_KEY=<a-secret-key>`
- `CORS_ORIGINS=http://localhost:8080,http://127.0.0.1:8080`

Run migrations and create superuser:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

Create roles (optional, for auth):

```bash
python manage.py shell
```

```python
from core.models import Role
Role.objects.get_or_create(name='Admin', defaults={'description': 'Full access'})
Role.objects.get_or_create(name='Teacher', defaults={'description': 'Teacher'})
Role.objects.get_or_create(name='Student', defaults={'description': 'Student'})
Role.objects.get_or_create(name='Parent', defaults={'description': 'Parent'})
Role.objects.get_or_create(name='Accounts', defaults={'description': 'Accounts'})
```

Start backend:

```bash
python manage.py runserver
```

API base: **http://127.0.0.1:8000/api**

---

## 3. Frontend (React + Vite)

```bash
# From project root (wenysha-connect-main)
npm install
```

Create `.env` in project root:

```
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Start frontend:

```bash
npm run dev
```

App: **http://localhost:8080**

---

## 4. Auth flow

1. **Sign up**: Use **Sign Up** → submit form → creates a **pending approval** (no login yet).
2. **Approve**: Admin goes to Django admin or calls `POST /api/auth/pending-approvals/{id}/approve/` → creates User + UserProfile with role.
3. **Login**: Use **Portal** → choose portal → email + password → JWT stored → redirect to dashboard by role.

For quick testing, create a user and profile via Django admin or shell and log in with that email/password.

---

## 5. Test the app

- **Frontend:** Open http://localhost:8080. Use **Portal** to log in (after backend is running and a user exists). Use **Sign Up** to register (creates a pending approval). Use **Contact** to send a message (saved to DB if backend is running).
- **Admin Dashboard:** If you are not logged in or the backend is not running, you will see "Failed to load data" or an auth error—this is expected. Log in via Portal first; ensure the backend is running and CORS includes `http://localhost:8080`.
- **Backend API:** http://127.0.0.1:8000/api/ ; Django admin: http://127.0.0.1:8000/admin/ (superuser: see `backend/.env` or `backend/README.md`).

---

## 6. Push to GitHub

Install **Git** from https://git-scm.com/download/win. From the project root run:

```powershell
.\push-to-github.ps1
```

Or follow **docs/GITHUB.md** for manual steps. The script sets the remote to https://github.com/BGSoftwares/wenysha-connect.git and pushes to `main`. Ensure `backend/.env` is never committed (it is in `.gitignore`).

---

## 7. Environment variables summary

**Backend (`.env` in `backend/`):**

| Variable | Description |
|----------|-------------|
| DJANGO_SECRET_KEY | Secret key for Django |
| DEBUG | True/False |
| ALLOWED_HOSTS | Comma-separated hosts |
| MYSQL_DATABASE | Database name |
| MYSQL_USER | MySQL user |
| MYSQL_PASSWORD | MySQL password |
| MYSQL_HOST | MySQL host |
| MYSQL_PORT | MySQL port |
| CORS_ORIGINS | Allowed frontend origins |

**Frontend (`.env` in project root):**

| Variable | Description |
|----------|-------------|
| VITE_API_BASE_URL | Backend API base, e.g. `http://127.0.0.1:8000/api` |

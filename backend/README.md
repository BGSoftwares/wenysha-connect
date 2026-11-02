# Able God College – Backend (Django + MySQL)

## Python

You need **Python 3.10+** on this machine.

- **Option A:** Install from [python.org](https://www.python.org/downloads/) (check “Add Python to PATH”).
- **Option B:** Use the Windows Store “Python 3.12” (or similar).

There is no “Python in this folder” – the virtual environment (`venv`) will use whatever `python` (or `py`) is on your PATH.

## Superuser

Configure a local administrator using Django's `createsuperuser` command or the optional `DJANGO_SUPERUSER_*` environment variables. Keep credentials private and do not commit `.env`.

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

4. Open: **http://127.0.0.1:8000/admin** and log in with your configured administrator account.

## Attendance module

Attendance uses the existing `school.AcademicYear` and `school.Term` records. Its additive migrations add session-aware attendance, calendar overrides, policy settings, parent excuses, audit history, per-learner term summaries, report snapshots, and in-portal parent alerts for same-day absence/lateness and low term attendance.

After backing up the configured database, apply the attendance migrations from the **backend** folder:

```powershell
python manage.py migrate attendance
```

Check migration state with:

```powershell
python manage.py showmigrations attendance
python manage.py test attendance.tests
```

Existing attendance rows are retained and associated with a configured term when their date is within that term. Rows that cannot be matched remain available with a null term. New sessions default to morning. Admins can manage calendar overrides, policy thresholds, excuses, and audit history. Teachers can mark whole classes and retain offline register drafts in their browser; parents can submit supported absence documents and receive attendance alerts; students have read-only attendance history and term summaries.

An optional notification adapter can be configured with the dotted import path `ATTENDANCE_NOTIFICATION_PROVIDER`. The configured callable receives a dictionary containing `kind`, `message`, `student_id`, `term_id`, and `created_at` after the database transaction commits. Leave it unset for in-portal notifications only. Provider credentials and vendor setup belong in environment-specific configuration, not source control.

Rollback is schema-changing. Back up the database first and obtain explicit approval before running it: reversing migrations `0006` through `0002` drops notifications, snapshots, summaries, settings, excuses, audit records, and the added columns on attendance records. The original attendance rows remain, but data entered only into the added fields or tables is lost. For a database that has applied later migrations, reverse one migration at a time in dependency order and inspect `showmigrations` before proceeding:

```powershell
python manage.py migrate attendance 0001
```

Do not roll back production or a shared database without a verified backup and an approved maintenance window.

## Report-card review workflow

Apply the report-card review migration from the **backend** folder after backing up the configured database:

```powershell
python manage.py migrate exams
```

The assigned class teacher saves a comment for each learner and submits the completed class reports. An administrator then adds an individual principal comment to each submitted report. Publishing is blocked once this review workflow has started until every marked learner has a submitted class-teacher comment and a principal comment. Students can read the saved comments after results are published.

## GitHub

Repo: **https://github.com/BGSoftwares/AbleGodCollegeELibrary.git**

See **docs/GITHUB.md** in the project root for connecting this project to GitHub and pushing. Ensure Git is installed and that you never commit `backend/.env` or `backend/venv/`.

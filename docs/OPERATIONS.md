# Operations guide

Everything needed to deploy, secure, back up and test the school portal.

## 1. First deploy (Docker)

Run these on the server, in the folder that holds `docker-compose.yml`:

```sh
sh scripts/generate-secrets.sh        # writes deploy.env with fresh random secrets
nano deploy.env                       # set DOMAIN, TLS_CERT_DIR and the MYSQL_* values
docker compose --env-file deploy.env config --quiet        # prints nothing when the file is complete
docker compose --env-file deploy.env up --build -d
docker compose --env-file deploy.env ps                    # migrate = exited (0), the rest = running/healthy
docker compose --env-file deploy.env exec frontend nginx -t
curl -k https://YOUR_DOMAIN/api/health/                     # {"status":"ok",...}
```

If `up` fails, `docker compose --env-file deploy.env logs migrate backend` shows why. The most common causes are a
missing value in `deploy.env`, a MySQL host the server cannot reach, or a TLS folder without `fullchain.pem` / `privkey.pem`.

## 2. Rotate secrets and default passwords

- **Secrets:** `sh scripts/generate-secrets.sh` keeps the old file as `deploy.env.old`, then restart with
  `docker compose --env-file deploy.env up -d`. Changing `DJANGO_SECRET_KEY` signs everyone out. If `MFA_ENCRYPTION_KEY`
  was empty, it also resets everyone's authenticator app, so set that key once and keep it.
  Change the MySQL password inside MySQL first, then update `MYSQL_PASSWORD`.
- **Default passwords:**
  ```sh
  docker compose --env-file deploy.env run --rm backend python manage.py rotate_default_passwords --dry-run
  docker compose --env-file deploy.env run --rm backend python manage.py rotate_default_passwords
  ```
  It finds accounts still using a seed or username-based password, gives each a random one (printed once), signs them out
  and forces a new password at next sign-in. Delete `deploy.env.old` and any chat messages that contained old secrets.

## 3. Daily backups

The `backup` service dumps the database and zips the uploaded files every day at `BACKUP_HOUR` (UTC) into `BACKUP_DIR`
(default `./backups`), keeping `BACKUP_KEEP_DAYS` days. A failed dump never replaces an older good one.

```sh
docker compose --env-file deploy.env logs backup               # shows "next run in ...s" and each result
docker compose --env-file deploy.env run --rm -e BACKUP_ONCE=1 backup   # take a backup right now
sh scripts/restore.sh backups/db-YYYYMMDD-HHMMSS.sql.gz       # replace live data (asks you to type RESTORE)
```

Backups on the same server do not survive losing the server. Copy `BACKUP_DIR` somewhere else daily (another machine,
object storage, or a synced drive). Test a restore on a spare database at least once a term.

Local development with SQLite: copy `backend/db.sqlite3` while the server is stopped. It is no longer tracked by git.

## 4. Dashboard data

The admin dashboard charts and events come from `GET /api/auth/dashboard/summary/` (admins only):

- Attendance trend: share of present and late marks per month, last 7 months.
- Average marks: mean percentage per subject from entered exam marks, top 8.
- Upcoming events: exams that have not ended, plus holidays and closures from the school calendar.

Empty data shows an empty state, never made-up numbers. The teacher, parent and student dashboards still show sample charts.

## 5. Tests

- Backend: `cd backend && python manage.py test`
- Frontend: install the test tools once, then run them. CI does the same.
  ```sh
  npm install --no-save --no-package-lock vitest@2.1.9 jsdom@25.0.1 @testing-library/react@16.1.0 @testing-library/dom@10.4.0
  npm run test:ui
  ```

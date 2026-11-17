# Operations guide

Everything needed to deploy, secure, back up and test the school portal.

## 1. First deploy (Docker)

Run these on the server, in the folder that holds `docker-compose.yml`:

```sh
sh scripts/generate-secrets.sh        # writes deploy.env with fresh random secrets
nano deploy.env                       # set DOMAIN, TLS_CERT_DIR and the MYSQL_* values (and BACKUP_REMOTE, see section 3)
bash scripts/preflight.sh             # checks settings, certificate, MySQL reachability; lists what to fix
docker compose --env-file deploy.env up --build -d
docker compose --env-file deploy.env ps                    # migrate = exited (0), the rest = running/healthy
sh scripts/smoke-test.sh https://YOUR_DOMAIN               # health, headers, sign-in refusal, private paths
```

The whole sequence above (build, start, smoke test, backup, restore) is rehearsed on every pull request by the
"Docker stack" job in CI, on a throw-away MySQL, so a broken compose file or Dockerfile is caught before it reaches you.
It cannot test your own domain, certificate or MySQL server, which is what `preflight.sh` and `smoke-test.sh` are for.
For a real sign-in check, add `SMOKE_USER=name SMOKE_PASS=... ` before `sh scripts/smoke-test.sh` (use an account without two-step verification).

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

**Copy them off the server.** Set `BACKUP_REMOTE` in `deploy.env` and every backup is uploaded after it is made, the upload size is
checked, and copies older than `BACKUP_REMOTE_KEEP_DAYS` are removed from the destination. Any rclone destination works
(S3-compatible buckets such as Backblaze, Wasabi, Cloudflare R2 or AWS; SFTP; Google Drive; Dropbox; OneDrive; another server's folder).
`deploy.env.example` has a ready S3 example; for other types see https://rclone.org/docs/ and write the options as
`RCLONE_CONFIG_<NAME>_<OPTION>=value`. If the upload fails, the local backup is kept and the status turns to failed.

**Encrypt them.** Set `BACKUP_ENCRYPTION_PASSPHRASE` (`generate-secrets.sh` creates one) and every file is encrypted with AES-256
before it is stored or uploaded, so a stolen bucket or disk reveals nothing. Store the passphrase in a password manager:
without it the backups cannot be opened. Encrypted files end in `.enc`.

```sh
docker compose --env-file deploy.env logs backup               # shows "next run in ...s" and each result
docker compose --env-file deploy.env run --rm -e BACKUP_ONCE=1 backup   # take a backup right now
sh scripts/backup-status.sh                                    # OK only if the last backup worked and is under 26h old
sh scripts/restore.sh backups/db-YYYYMMDD-HHMMSS.sql.gz.enc    # replace live data (asks you to type RESTORE)
```

`backup-status.sh` exits non-zero when the last backup failed, is too old, or never ran. Run it from cron or point an uptime
monitor at it so a silent failure is noticed the same day. To restore from the off-server copy, download the file first
(for example `docker compose --env-file deploy.env run --rm --entrypoint rclone backup copy offsite:my-bucket/db-....sql.gz.enc /backups`),
then run `restore.sh` on it. A wrong passphrase or damaged file stops before anything is changed. Test a restore on a spare
database at least once a term.

Local development with SQLite: copy `backend/db.sqlite3` while the server is stopped. It is no longer tracked by git.

### Backups from the portals

- **Admin portal → Backups:** Back up now saves a ZIP of the school's records (one JSON file per table) on the server,
  optionally with uploaded files. The list shows each backup with Download and Delete. The newest `BACKUP_MAX_FILES`
  (default 30) are kept, and a second backup within 30 seconds is refused.
  Passwords, hashes, tokens, authenticator secrets and per-user preferences are never written, and accounts are saved
  without passwords. So this is a records backup: restore from the daily database backup after a failure.
- **Teacher portal → Backup:** downloads a ZIP of CSV files (students, marks, attendance, allocations) for that
  teacher's own classes and subjects only. No addresses, birth dates, contacts or fees.
- Archives live in `DJANGO_BACKUP_ROOT` (`/app/backups`, the `portal_backups` volume), outside the media folder, so nginx
  never serves them. They are only reachable through the signed-in admin endpoints below.

| Endpoint | Who | What |
|---|---|---|
| `GET /api/auth/backups/` | Admin | List saved backups |
| `POST /api/auth/backups/` | Admin | Make one (`{"include_files": true}` adds uploads) |
| `GET /api/auth/backups/<name>/` | Admin | Download |
| `DELETE /api/auth/backups/<name>/` | Admin | Delete |
| `GET /api/auth/backups/my-data/` | Teacher | Download own teaching data |

## 4. Dashboard data

The admin dashboard charts and events come from `GET /api/auth/dashboard/summary/` (admins only):

- Attendance trend: share of present and late marks per month, last 7 months.
- Average marks: mean percentage per subject from entered exam marks, top 8.
- Upcoming events: exams that have not ended, plus holidays and closures from the school calendar.

Teacher, student and accounts dashboards use `GET /api/auth/dashboard/mine/`, which returns the same charts limited to the
signed-in user's own records:

- **Teacher:** attendance for their classes, marks for the classes and subjects they teach.
- **Student:** their own attendance and marks. **Parent:** their children's. Both see marks only from exams whose results are published.
- **Accounts:** no academic charts, just the events calendar.

Empty data shows an empty state, never made-up numbers.

## 5. Dependencies and updates

- CI fails on any high or critical advisory in production npm packages (`scripts/audit-gate.mjs`) and on Python advisories (`pip-audit`).
  An advisory can be accepted only by adding it to the `ACCEPTED` list in `scripts/audit-gate.mjs` with a reason and a review date;
  the check fails again once that date passes. Today there is one: a zod memory-exhaustion advisory that does not apply to our forms.
- Dependabot opens weekly update pull requests. Merge them once CI is green.
- The frontend builds on Node 22 (Dockerfile and CI).
- nginx re-resolves the `backend` name every 10 seconds, so recreating or scaling backend containers needs no nginx reload.
- Refresh tokens rotate, so the browser shares one refresh call between requests that expire together; two tabs recover from each other's rotation.

## 6. Tests

- Backend: `cd backend && python manage.py test`
- Frontend: install the test tools once, then run them. CI does the same.
  ```sh
  npm install --no-save --no-package-lock vitest@2.1.9 jsdom@25.0.1 @testing-library/react@16.1.0 @testing-library/dom@10.4.0
  npm run test:ui
  ```

## 7. Fee payments (EcoCash, ZimSwitch and the bank)

Every route ends in the same place: a `Payment` row on the invoice. The student's account, the parent's view and the
Accounts portal all read those rows, so a payment shows everywhere within about 15 seconds of being recorded.

| How the parent pays | What credits it | Needs |
|---|---|---|
| EcoCash (portal) | The provider confirms the charge. The portal polls, and the `payments-worker` service also checks every 60 s, so it is credited even if the parent closes the browser. | `ECOCASH_*` in `deploy.env` |
| ZimSwitch card (portal) | Same as above, after the hosted checkout returns. The amount and currency are checked against the invoice. | `ZIMSWITCH_*` in `deploy.env` |
| Bank deposit or transfer | A bank credit matched by the **invoice number** (or student ID) in the bank reference. | Statement CSV import, or the bank feed below |

Bank deposits are never matched on guesswork. A deposit is credited automatically only when its reference names exactly one
invoice, the currency matches and the amount fits the balance. Everything else waits in **Accounts → Bank Deposits → Needs review**,
where Accounts picks the invoice. The bank's transaction id is unique, so re-importing a statement or a webhook retry never credits twice.

**Turning it on**
1. Put the merchant values in `deploy.env` (see `deploy.env.example`), then `docker compose --env-file deploy.env up -d`. The `payments-worker` service starts with the stack.
2. Ask EcoCash/your acquiring bank for the sandbox first and make one small test payment per method before going live.
3. For bank deposits, either upload the CSV statement from internet banking in Accounts → Bank Deposits, or, if your bank can push credits, give it
   `https://<your domain>/api/finance/bank-deposits/webhook/` and set `BANK_WEBHOOK_SECRET`. The bank signs the raw body with HMAC-SHA256 and sends it
   as `X-Bank-Signature`. Body: `{"transactions":[{"transaction_id","amount","currency","date","reference","payer_name"}]}`.

**Not verified here:** the EcoCash and ZimSwitch calls follow the adapters already in `backend/finance/gateways.py`, but they have never been run
against the live providers from this environment. Test with sandbox credentials before taking real money. Whether your bank offers a push feed is
the bank's decision; the CSV import works with any bank.

## 8. Student numbers

Every student has one student number (for example `AbleGodStudent00042`). It is issued automatically when the student is created,
by a counter that only moves forward, so:
- two students never share a number (case differences count as the same number);
- a number is never given to another child, even after the first student is deleted;
- the number cannot be edited (API, admin or code). Invoices, receipts, report cards, attendance and the parent portal all show it,
  and bank deposits are matched to the student by it.

On the first deploy of this change the migration numbers every student who had none and leaves existing numbers untouched. To check
at any time: `docker compose run --rm backend python manage.py audit_student_numbers --dry-run` (drop `--dry-run` to issue missing numbers).

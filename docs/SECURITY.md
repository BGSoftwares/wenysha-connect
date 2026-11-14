# Security guide

How sign-in, sessions, uploads and the network edge are protected, and what an
operator must configure. Applies to the Django API (`backend/`) and the nginx
front end (`nginx.conf`).

## Architecture

```
browser ──HTTPS──> nginx (TLS, security headers, rate limit, load balancer)
                     ├── static React app
                     ├── /media/  public gallery files only
                     └── /api/ ──> backend replicas (gunicorn, non-root) ──> MySQL
                                          └──────────────> Redis (shared state)
```

Login is stateless (JWT), so any backend replica can serve any request and no
sticky sessions are needed. Everything that must be shared between replicas
(rate-limit counters, account lockouts, MFA challenges, cached profiles) lives
in **Redis**. Without `REDIS_URL` each worker keeps its own counters and the
limits silently multiply, so Redis is required for any multi-worker deployment.

## Sign-in flow

1. `POST /api/auth/login/` with email/username + password.
2. Checks, in order: per-IP throttle → per-account lockout → password (Argon2id).
   An unknown user costs the same time as a wrong password.
3. No MFA on the account: returns `{access, refresh, user}`.
4. MFA on the account: returns `{mfa_required, mfa_token, mfa_method, expires_in}`.
   Submit `POST /api/auth/mfa/verify/` with `{mfa_token, code}` to receive tokens.
   `code` is an authenticator code, an emailed code, or a one-time backup code.
5. Use `Authorization: Bearer <access>` afterwards. Tokens are refreshed at
   `POST /api/auth/token/refresh/`; sign-out calls `POST /api/auth/logout/`.

## Layers

| Layer | What it does | Setting |
|-------|--------------|---------|
| Password hashing | Argon2id; legacy hashes are upgraded transparently at next login | `PASSWORD_HASHERS` |
| nginx rate limit | 30 req/min per IP on login, MFA verify and resend | `limit_req_zone` in `nginx.conf` |
| Django IP throttle | Login 20/min, MFA 10/min, sign-up 10/hour per IP | `LOGIN_THROTTLE_RATE`, `MFA_THROTTLE_RATE`, `SIGNUP_THROTTLE_RATE` |
| Account lockout | 5 failures in 5 minutes locks the account for 15 minutes | `core/throttling.py` |
| Access token | Short lived (default 15 min) | `JWT_ACCESS_MINUTES` |
| Refresh token | 7 days, rotated on use, old one blacklisted; revoked on password change | `JWT_REFRESH_DAYS` |
| MFA | Authenticator app (TOTP, RFC 6238) or email code; replay protected | see below |
| Caching | Profile/role lookups cached; **password checks are never cached** | `REDIS_URL` |

Client IPs are taken from nginx's `X-Forwarded-For`, which nginx overwrites so
clients cannot forge it. Keep `NUM_PROXIES=1` behind the bundled nginx. If you
add a CDN or another proxy in front, set it accordingly and configure nginx
`set_real_ip_from`, or every user will share one IP bucket (or be spoofable).

## Multi-factor authentication

- Users enrol under their profile (students and staff) via **Two-step
  verification**: scan or type the setup key into an authenticator app, confirm a
  code, then **save the 8 one-time backup codes** (shown once).
- `MFA_REQUIRED_ROLES` (default `Admin`) forces those roles to enrol. Until they
  do, their token only opens the MFA setup screen (`mfa_setup_required`).
- Authenticator secrets are encrypted at rest (Fernet). Set a dedicated
  `MFA_ENCRYPTION_KEY`; if unset it is derived from `DJANGO_SECRET_KEY`, and
  rotating the secret key then resets everyone's MFA.
- **Locked-out user** (lost phone and backup codes): an administrator runs
  `python manage.py reset_mfa <username-or-email>`; the user signs in with their password
  and enrols again.

## Uploads

Every upload field goes through `core/upload_validation.py`: an extension
allowlist **and** a check that the file's first bytes match that type. The
browser's Content-Type is never trusted. SVG and HTML are rejected everywhere.
Files served by Django carry `nosniff` and a sandboxing CSP.

| Kind | Allowed |
|------|---------|
| Gallery / hero | JPG, PNG, GIF, WebP, MP4/M4V/MOV/WebM |
| Learning materials | PDF, Office files, CSV, TXT, ZIP, images, video |
| Assignments / submissions | Documents, ZIP, images (incl. HEIC) |
| Attendance excuses | JPG, PNG, PDF (max 8 MB) |
| Library books | PDF, EPUB, DOCX |

**Private files are not public.** Only `gallery/` under `/media/` is served
directly. Excuse attachments, library books, learning materials, assignments
and submissions are downloaded through authenticated, access-scoped API
endpoints (`.../attachment/`, `.../file/`); nginx returns 404 for those folders.
Clients must download them with the bearer token (`downloadAuthenticatedFile` in
`src/lib/api.ts`), not a plain link.

## Network edge (nginx)

- HTTP→HTTPS redirect, TLS 1.2/1.3, HSTS, `nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy`, `server_tokens off`.
- **CSP is Report-Only.** Browse every page with the browser console open,
  add any blocked origin you legitimately use to the policy (for example your
  Supabase project), then rename `Content-Security-Policy-Report-Only` to
  `Content-Security-Policy` to enforce.
- nginx resolves `backend` at start-up. After scaling or recreating backend
  containers: `docker compose exec frontend nginx -s reload`.
- Backend containers run as an unprivileged user (uid 10001). A pre-existing
  media volume owned by root must be fixed once:
  `docker compose run --rm --user root backend chown -R 10001:10001 /app/media`.

## Access control

Role-scoped querysets and write checks are enforced server-side: students see
their own records, parents their linked children, teachers their classes,
accounts the finance data, admins everything. Staff contact details (phone,
staff ID) are returned only to admins and to the teacher themselves. Tests in
`backend/core/tests/` cover the permission matrix, authentication, uploads and
private-file access.

## Deployment checklist

1. Copy `deploy.env.example` to `deploy.env` and fill every value; keep it out of git.
2. Generate `DJANGO_SECRET_KEY` (50+ chars), a strong `MYSQL_PASSWORD`, and an
   alphanumeric `REDIS_PASSWORD`. Never reuse values that were ever committed.
3. `docker compose --env-file deploy.env up --build -d` (migrations run first).
4. Admins: sign in and complete two-step verification setup; store backup codes.
5. Watch the browser console for CSP reports, then enforce the policy.
6. Back up the MySQL database and the `media_data` volume.

## Tests and CI

```sh
cd backend
USE_SQLITE=True python manage.py test        # PowerShell: $env:USE_SQLITE="True"
```

GitHub Actions (`.github/workflows/ci.yml`) runs the backend tests, a missing
migration check, the frontend type check and build, `pip-audit`/`npm audit`
(informational), and fails if a real `.env` file is committed. Dependabot opens
weekly update PRs.

## Known limitations / roadmap

- Tokens are stored in `localStorage`, so an XSS bug could read them. Moving the
  refresh token to an HttpOnly cookie is the next hardening step; the enforced
  CSP reduces the risk meanwhile.
- Secrets that were committed in the past stay in git history. Rotate them.
- Email-code MFA depends on working SMTP settings.

## Reporting a vulnerability

Report privately to the school's system administrator; do not open a public issue.

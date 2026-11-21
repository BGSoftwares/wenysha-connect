# Go-live checklist

Follow this top to bottom the first time the portal goes on the internet. Each step says how you know it worked.
The long reference for every setting is [OPERATIONS.md](OPERATIONS.md); this page is the short route through it.

## 0. What you need before you start

| You need | Notes |
|---|---|
| A **domain name** | For example `portal.yourschool.ac.zw`. You must be able to add a DNS record for it. |
| A **Linux server** with a public IP | Ubuntu 22.04 or newer, at least 2 CPU and 4 GB memory, 40 GB disk. Ports 80 and 443 open. |
| A **MySQL database** | MySQL 8 on the same server or a managed one. The Docker stack does not include MySQL; it connects to the one you name in `deploy.env`. |
| About 2 hours | Most of it is waiting for DNS and the first build. |

## 1. Point the domain at the server

At your domain registrar add an **A record**: name `portal` (or whatever you chose), value = the server's public IP.
*Check:* `ping portal.yourschool.ac.zw` shows the server's IP (can take up to a few hours).

## 2. Prepare the server

```sh
sudo apt update && sudo apt install -y git docker.io docker-compose-v2 certbot
sudo systemctl enable --now docker
git clone https://github.com/BGSoftwares/wenysha-connect.git
cd wenysha-connect
```

Create the database and a user for it in MySQL (database `able_god_college`, user `able_god_college_user`, with a strong password),
and make sure the server can reach MySQL on port 3306.

## 3. Get the HTTPS certificate (free, Let's Encrypt)

```sh
sudo certbot certonly --standalone -d portal.yourschool.ac.zw
sudo mkdir -p /opt/ablegod/certs
sudo cp -L /etc/letsencrypt/live/portal.yourschool.ac.zw/fullchain.pem /etc/letsencrypt/live/portal.yourschool.ac.zw/privkey.pem /opt/ablegod/certs/
```

Certificates last 90 days. Renewal copies the new files and restarts the site; set it up once:

```sh
sudo tee /etc/letsencrypt/renewal-hooks/deploy/ablegod.sh >/dev/null <<'HOOK'
#!/bin/sh
cp -L /etc/letsencrypt/live/portal.yourschool.ac.zw/fullchain.pem /etc/letsencrypt/live/portal.yourschool.ac.zw/privkey.pem /opt/ablegod/certs/
cd /path/to/wenysha-connect && docker compose --env-file deploy.env restart frontend
HOOK
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/ablegod.sh
```

(Replace `/path/to/wenysha-connect` with the real folder.) *Check:* `sudo certbot renew --dry-run` succeeds.

## 4. Configure and start

```sh
sh scripts/generate-secrets.sh        # creates deploy.env with fresh random secrets
nano deploy.env                       # set DOMAIN, TLS_CERT_DIR=/opt/ablegod/certs, the MYSQL_* values, BACKUP_REMOTE
bash scripts/preflight.sh             # must finish with nothing left to fix
docker compose --env-file deploy.env up --build -d
docker compose --env-file deploy.env ps
sh scripts/smoke-test.sh https://portal.yourschool.ac.zw
```

*Check:* `migrate` shows `exited (0)`, the other services are running or healthy, the smoke test passes, and
`https://portal.yourschool.ac.zw` opens the home page with a padlock.

## 5. Create the first administrator

```sh
docker compose --env-file deploy.env run --rm backend python manage.py createsuperuser
```

Sign in at `/auth` with it, then create teacher, accounts and other staff accounts from the admin dashboard
(User Accounts & Roles). Never share the administrator account. If any account still has a starter password:

```sh
docker compose --env-file deploy.env run --rm backend python manage.py rotate_default_passwords
```

## 6. Backups that survive the server

Set `BACKUP_REMOTE` (an off-server bucket or folder) and `BACKUP_ENCRYPTION_PASSPHRASE` in `deploy.env`, keep the passphrase in a
password manager, then:

```sh
docker compose --env-file deploy.env run --rm -e BACKUP_ONCE=1 backup
sh scripts/backup-status.sh
```

*Check:* the status says OK and the file is in the off-server location. Practise one restore on a spare database before you rely on it
(see OPERATIONS.md section 3).

## 7. Turn on fee payments, one method at a time

Put each provider's values in `deploy.env` (Paynow, EcoCash, ZimSwitch) and run
`docker compose --env-file deploy.env up -d`. For Paynow, also set `https://portal.yourschool.ac.zw/api/finance/paynow/result/` as the
result URL in your Paynow integration. Make **one small real or test payment per method** and confirm it appears on the invoice
and in Accounts. These live providers have not been tested from the development environment, so this step matters.

## 8. Publish the Android and computer apps

1. GitHub, Settings, Secrets and variables, Actions, Variables: add `APP_URL` = `https://portal.yourschool.ac.zw` (no trailing slash).
2. GitHub, Actions tab: run **Android app**, then **Desktop app** (Run workflow). Wait for green ticks.
3. Open the portal, click **Get the app**, and download the Android file to check it. iPhone users use Safari, Share, Add to Home Screen.

## 9. First-day checks

- [ ] Sign in as admin, teacher, accounts, a student and a parent: each lands on its own dashboard and **Sign Out** returns to the sign-in page.
- [ ] Add a test student; the student number is issued automatically.
- [ ] Enter a mark, publish a report card, open it as the parent.
- [ ] Record a bank deposit in Accounts and confirm it shows on the student's fees.
- [ ] `sh scripts/backup-status.sh` says OK tomorrow morning.
- [ ] Put an uptime monitor on `https://portal.yourschool.ac.zw/` so you hear about an outage first.

## Updating later

```sh
cd wenysha-connect && git pull
docker compose --env-file deploy.env up --build -d
sh scripts/smoke-test.sh https://portal.yourschool.ac.zw
```

Take a backup first (`BACKUP_ONCE=1`, step 6). The database migrations run automatically as part of `up`.
If an update goes wrong, `git checkout` the previous version, run the same `up --build -d`, and restore the backup only if data was damaged.

#!/bin/sh
# Create deploy.env from deploy.env.example with fresh random secrets.
# Existing deploy.env is kept as deploy.env.old so nothing is lost. Run: sh scripts/generate-secrets.sh
set -eu
[ -f deploy.env.example ] || { echo "Run this from the folder that holds deploy.env.example" >&2; exit 1; }
rand() { python3 -c "import secrets,string;print(''.join(secrets.choice(string.ascii_letters+string.digits) for _ in range($1)))"; }
[ -f deploy.env ] && cp deploy.env deploy.env.old && echo "Kept the previous file as deploy.env.old"
sed \
  -e "s|^DJANGO_SECRET_KEY=.*|DJANGO_SECRET_KEY=$(rand 64)|" \
  -e "s|^REDIS_PASSWORD=.*|REDIS_PASSWORD=$(rand 32)|" \
  -e "s|^MFA_ENCRYPTION_KEY=.*|MFA_ENCRYPTION_KEY=$(python3 -c 'import base64,os;print(base64.urlsafe_b64encode(os.urandom(32)).decode())')|" \
  deploy.env.example > deploy.env
chmod 600 deploy.env
echo "Wrote deploy.env. Still edit DOMAIN, TLS_CERT_DIR and the MYSQL_* values."
echo "Set the MySQL password in MySQL itself first, then paste it as MYSQL_PASSWORD."

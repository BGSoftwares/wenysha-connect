#!/bin/bash
# Check deploy.env and the server BEFORE `docker compose up`. Prints what to fix; exits 1 if anything blocks a deploy.
#   bash scripts/preflight.sh [deploy.env]
ENV_FILE="${1:-deploy.env}"
fails=0; warns=0
ok()   { echo "  ok    $*"; }
fail() { echo "  FAIL  $*"; fails=$((fails+1)); }
warn() { echo "  warn  $*"; warns=$((warns+1)); }

[ -f "$ENV_FILE" ] || { echo "FAIL  $ENV_FILE not found. Run: sh scripts/generate-secrets.sh"; exit 1; }
set -a; . "./$ENV_FILE"; set +a

echo "Settings in $ENV_FILE"
for v in DOMAIN TLS_CERT_DIR DJANGO_SECRET_KEY MYSQL_HOST MYSQL_DATABASE MYSQL_USER MYSQL_PASSWORD REDIS_PASSWORD; do
  val="${!v:-}"
  if [ -z "$val" ]; then fail "$v is empty"
  elif echo "$val" | grep -qiE 'replace-with|example\.org|192\.0\.2\.'; then fail "$v still has the example value"
  else ok "$v is set"; fi
done
[ "${#DJANGO_SECRET_KEY}" -ge 50 ] && ok "DJANGO_SECRET_KEY is long enough" || fail "DJANGO_SECRET_KEY must be at least 50 characters"
echo "${REDIS_PASSWORD:-}" | grep -qE '^[A-Za-z0-9]{16,}$' && ok "REDIS_PASSWORD is letters and digits, 16+ long" || fail "REDIS_PASSWORD must be 16+ letters and digits only (it sits inside a URL)"
[ -n "${MFA_ENCRYPTION_KEY:-}" ] && ok "MFA_ENCRYPTION_KEY is set" || warn "MFA_ENCRYPTION_KEY is empty: rotating DJANGO_SECRET_KEY later will reset everyone's authenticator app"

echo "TLS certificate"
cert="${TLS_CERT_DIR:-}/fullchain.pem"; key="${TLS_CERT_DIR:-}/privkey.pem"
if [ -f "$cert" ] && [ -f "$key" ]; then
  ok "fullchain.pem and privkey.pem found"
  if command -v openssl >/dev/null; then
    openssl x509 -checkend 1209600 -noout -in "$cert" >/dev/null 2>&1 && ok "certificate is valid for at least 14 more days" || fail "certificate expires within 14 days or is unreadable"
    [ "$(openssl x509 -noout -pubkey -in "$cert" 2>/dev/null | openssl md5)" = "$(openssl pkey -pubout -in "$key" 2>/dev/null | openssl md5)" ] && ok "certificate matches the private key" || fail "certificate and private key do not match"
  fi
else
  fail "$cert and/or $key missing"
fi

echo "Database"
if timeout 5 bash -c "exec 3<>/dev/tcp/${MYSQL_HOST:-x}/${MYSQL_PORT:-3306}" 2>/dev/null; then ok "MySQL answers at ${MYSQL_HOST}:${MYSQL_PORT:-3306}"; else fail "cannot reach MySQL at ${MYSQL_HOST}:${MYSQL_PORT:-3306} (host, port, firewall or bind-address)"; fi

echo "Backups"
if [ -n "${BACKUP_REMOTE:-}" ]; then ok "off-server copy goes to ${BACKUP_REMOTE%%:*}"; else warn "BACKUP_REMOTE is empty: backups stay on this server and are lost with it"; fi
[ -n "${BACKUP_ENCRYPTION_PASSPHRASE:-}" ] && ok "backups will be encrypted" || warn "BACKUP_ENCRYPTION_PASSPHRASE is empty: backups will not be encrypted"

echo "Docker"
if command -v docker >/dev/null && docker compose version >/dev/null 2>&1; then
  docker compose --env-file "$ENV_FILE" config --quiet 2>/tmp/preflight-compose.err && ok "docker compose file is valid" || { fail "docker compose config: $(head -n 3 /tmp/preflight-compose.err)"; }
else
  fail "docker compose is not installed"
fi
for port in 80 443; do
  if (ss -ltn 2>/dev/null || netstat -ltn 2>/dev/null) | grep -qE "[:.]$port\s"; then warn "port $port is already in use (fine if it is this stack running)"; fi
done

echo
if [ "$fails" -gt 0 ]; then echo "$fails problem(s) block the deploy, $warns warning(s)."; exit 1; fi
echo "Ready to deploy ($warns warning(s))."

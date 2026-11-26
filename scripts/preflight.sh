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
if [ -n "${MFA_ENCRYPTION_KEY:-}" ]; then
  ok "MFA_ENCRYPTION_KEY is set"
else
  fail "MFA_ENCRYPTION_KEY is empty: required to preserve authenticator apps when DJANGO_SECRET_KEY is rotated"
fi

for role in admin accounts teacher; do
  ok "MFA is required for $role accounts by the production baseline"
done

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
case "${BACKUP_REMOTE:-}" in
  *:*)
    remote_name="${BACKUP_REMOTE%%:*}"
    case "$remote_name" in
      ''|*[!a-zA-Z0-9_]*) fail "rclone remote name must contain only letters, numbers and underscores" ;;
      *)
        remote_config_name="$(printf '%s' "$remote_name" | tr '[:lower:]' '[:upper:]')"
        remote_type_var="RCLONE_CONFIG_${remote_config_name}_TYPE"
        remote_type="$(printenv "$remote_type_var" 2>/dev/null || true)"
        if [ -n "$remote_type" ]; then
          remote_type_lower="$(printf '%s' "$remote_type" | tr '[:upper:]' '[:lower:]')"
          if [ "$remote_type_lower" = "local" ]; then
            if [ "${ALLOW_LOCAL_BACKUP_REMOTE:-0}" = "1" ]; then
              warn "local backup remote explicitly allowed for CI only"
            else
              fail "BACKUP_REMOTE uses the local rclone backend, which is not off-site"
            fi
          else
            ok "encrypted backups will use configured rclone remote $remote_name ($remote_type)"
          fi
        else
          fail "$remote_type_var is missing: configure the BACKUP_REMOTE rclone remote"
        fi
        ;;
    esac
    ;;
  '') fail "BACKUP_REMOTE is empty: configure a named off-site rclone remote" ;;
  *) fail "BACKUP_REMOTE must use a named rclone remote (remote:path), not a local folder" ;;
esac
if [ -z "${BACKUP_ENCRYPTION_PASSPHRASE:-}" ]; then
  fail "BACKUP_ENCRYPTION_PASSPHRASE is empty"
elif [ "${#BACKUP_ENCRYPTION_PASSPHRASE}" -lt 32 ]; then
  fail "BACKUP_ENCRYPTION_PASSPHRASE must be at least 32 characters"
else
  ok "backups will be encrypted with a 32+ character passphrase"
fi

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

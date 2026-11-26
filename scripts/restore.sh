#!/bin/sh
# Restore a database backup (.sql.gz, or .sql.gz.enc made with BACKUP_ENCRYPTION_PASSPHRASE):
#   sh scripts/restore.sh backups/db-20261115-020000.sql.gz.enc [deploy.env]
# Run from the folder that holds docker-compose.yml. This REPLACES the current data.
set -eu
file="${1:?Usage: restore.sh <backups/db-....sql.gz[.enc]> [deployment-env-file]}"
env_file="${2:-deploy.env}"
[ -f "$file" ] || { echo "No such file: $file" >&2; exit 1; }
[ -f "$env_file" ] || { echo "No such deployment env file: $env_file" >&2; exit 1; }
printf 'This overwrites the database configured in %s with %s. Type RESTORE to continue: ' "$env_file" "$file"
read -r answer
[ "$answer" = "RESTORE" ] || { echo "Cancelled."; exit 1; }
case "$file" in
  *.enc) decode='openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_ENCRYPTION_PASSPHRASE | gunzip' ;;
  *)     decode='gunzip' ;;
esac
# Decode to a file first: a wrong passphrase or damaged file must stop here, not load an empty dump.
cat "$file" | docker compose --env-file "$env_file" run --rm -T --no-deps --entrypoint sh backup -c \
  "$decode > /tmp/restore.sql && [ -s /tmp/restore.sql ] && MYSQL_PWD=\"\$MYSQL_PASSWORD\" mysql --host=\"\$MYSQL_HOST\" --port=\"\${MYSQL_PORT:-3306}\" --user=\"\$MYSQL_USER\" \"\$MYSQL_DATABASE\" < /tmp/restore.sql" \
  || { echo "Restore FAILED: the file could not be read (wrong passphrase, damaged file, or database error). Nothing was changed if this happened while decoding." >&2; exit 1; }
echo "Restore finished."

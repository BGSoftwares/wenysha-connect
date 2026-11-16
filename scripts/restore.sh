#!/bin/sh
# Restore a database backup (.sql.gz, or .sql.gz.enc made with BACKUP_ENCRYPTION_PASSPHRASE):
#   sh scripts/restore.sh backups/db-20261115-020000.sql.gz.enc
# Run from the folder that holds docker-compose.yml. This REPLACES the current data.
set -eu
file="${1:?Usage: restore.sh <backups/db-....sql.gz[.enc]>}"
[ -f "$file" ] || { echo "No such file: $file" >&2; exit 1; }
printf 'This overwrites the live database with %s. Type RESTORE to continue: ' "$file"
read -r answer
[ "$answer" = "RESTORE" ] || { echo "Cancelled."; exit 1; }
case "$file" in
  *.enc) decode='openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_ENCRYPTION_PASSPHRASE | gunzip' ;;
  *)     decode='gunzip' ;;
esac
# Decode to a file first: a wrong passphrase or damaged file must stop here, not load an empty dump.
cat "$file" | docker compose --env-file deploy.env run --rm -T --no-deps --entrypoint sh backup -c \
  "$decode > /tmp/restore.sql && [ -s /tmp/restore.sql ] && MYSQL_PWD=\"\$MYSQL_PASSWORD\" mysql --host=\"\$MYSQL_HOST\" --port=\"\${MYSQL_PORT:-3306}\" --user=\"\$MYSQL_USER\" \"\$MYSQL_DATABASE\" < /tmp/restore.sql" \
  || { echo "Restore FAILED: the file could not be read (wrong passphrase, damaged file, or database error). Nothing was changed if this happened while decoding." >&2; exit 1; }
echo "Restore finished."

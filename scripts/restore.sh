#!/bin/sh
# Restore a database backup:  ./scripts/restore.sh backups/db-20261115-020000.sql.gz
# Run from the folder that holds docker-compose.yml. This REPLACES the current data.
set -eu
file="${1:?Usage: restore.sh <backups/db-....sql.gz>}"
[ -f "$file" ] || { echo "No such file: $file" >&2; exit 1; }
printf 'This overwrites the live database with %s. Type RESTORE to continue: ' "$file"
read -r answer
[ "$answer" = "RESTORE" ] || { echo "Cancelled."; exit 1; }
gunzip -c "$file" | docker compose --env-file deploy.env run --rm -T --no-deps --entrypoint sh backup -c \
  'MYSQL_PWD="$MYSQL_PASSWORD" mysql --host="$MYSQL_HOST" --port="${MYSQL_PORT:-3306}" --user="$MYSQL_USER" "$MYSQL_DATABASE"'
echo "Restore finished."

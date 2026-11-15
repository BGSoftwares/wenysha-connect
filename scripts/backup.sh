#!/bin/sh
# Daily backup of the database (mysqldump) and uploaded media.
#   BACKUP_HOUR      hour (UTC, 0-23) to run each day         default 2
#   BACKUP_KEEP_DAYS days of backups to keep                  default 14
#   BACKUP_ONCE=1    run one backup now and exit (for testing or a cron job)
set -eu

DIR=/backups
HOUR="${BACKUP_HOUR:-2}"
KEEP="${BACKUP_KEEP_DAYS:-14}"

run_backup() {
  stamp="$(date -u +%Y%m%d-%H%M%S)"
  mkdir -p "$DIR"
  db_tmp="$DIR/.db-$stamp.sql.gz.part"
  media_tmp="$DIR/.media-$stamp.tar.gz.part"

  echo "[backup] $stamp database $MYSQL_DATABASE on $MYSQL_HOST"
  sql_tmp="$DIR/.db-$stamp.sql.part"
  # Dump to a plain file first so a failed mysqldump is noticed (a pipe would hide its exit code).
  if ! MYSQL_PWD="$MYSQL_PASSWORD" mysqldump \
    --host="$MYSQL_HOST" --port="${MYSQL_PORT:-3306}" --user="$MYSQL_USER" \
    --single-transaction --no-tablespaces --routines --default-character-set=utf8mb4 \
    "$MYSQL_DATABASE" > "$sql_tmp"; then
    echo "[backup] mysqldump failed, keeping old backups" >&2; rm -f "$sql_tmp"; return 1
  fi
  [ "$(wc -c < "$sql_tmp")" -gt 200 ] || { echo "[backup] database dump is empty, keeping old backups" >&2; rm -f "$sql_tmp"; return 1; }
  gzip -9 < "$sql_tmp" > "$db_tmp" && rm -f "$sql_tmp"
  mv "$db_tmp" "$DIR/db-$stamp.sql.gz"

  if [ -d /media ]; then
    tar -czf "$media_tmp" -C /media . && mv "$media_tmp" "$DIR/media-$stamp.tar.gz"
  fi

  find "$DIR" -maxdepth 1 -type f \( -name 'db-*.sql.gz' -o -name 'media-*.tar.gz' \) -mtime +"$KEEP" -delete
  echo "[backup] done: $(ls "$DIR" | grep -c '^db-') database backup(s) kept"
}

if [ "${BACKUP_ONCE:-0}" = "1" ]; then run_backup; exit $?; fi

while true; do
  now="$(date -u +%s)"
  next="$(date -u -d "today ${HOUR}:00" +%s)"
  [ "$next" -gt "$now" ] || next="$(date -u -d "tomorrow ${HOUR}:00" +%s)"
  echo "[backup] next run in $((next - now))s"
  sleep "$((next - now))"
  run_backup || echo "[backup] FAILED - will try again tomorrow" >&2
done

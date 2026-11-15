#!/bin/sh
# Daily backup of the database (mysqldump) and uploaded media, optionally encrypted and copied off the server.
#   BACKUP_HOUR                  hour (UTC, 0-23) to run each day              default 2
#   BACKUP_KEEP_DAYS             days of backups kept on this server           default 14
#   BACKUP_ENCRYPTION_PASSPHRASE encrypt every file (AES-256) before it is stored or uploaded
#   BACKUP_REMOTE                rclone destination, e.g. offsite:my-bucket/school  (empty = keep on this server only)
#   BACKUP_REMOTE_KEEP_DAYS      days of backups kept at the destination         default 30
#   BACKUP_ONCE=1                run one backup now and exit
# The destination is configured with RCLONE_CONFIG_<NAME>_* variables (see docs/OPERATIONS.md), or is a plain folder path.
set -eu

DIR="${BACKUP_DIR_IN_CONTAINER:-/backups}"
MEDIA="${BACKUP_MEDIA_DIR:-/media}"
HOUR="${BACKUP_HOUR:-2}"
KEEP="${BACKUP_KEEP_DAYS:-14}"
REMOTE="${BACKUP_REMOTE:-}"
REMOTE_KEEP="${BACKUP_REMOTE_KEEP_DAYS:-30}"
PASS="${BACKUP_ENCRYPTION_PASSPHRASE:-}"

status() { # status <ok|failed> <message>
  mkdir -p "$DIR"
  printf '%s %s %s\n' "$1" "$(date -u +%s)" "$2" > "$DIR/LAST_STATUS"
}

seal() { # seal <file>: encrypt when a passphrase is set; prints the final file name
  if [ -n "$PASS" ]; then
    BACKUP_ENCRYPTION_PASSPHRASE="$PASS" openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt \
      -pass env:BACKUP_ENCRYPTION_PASSPHRASE -in "$1" -out "$1.enc" && rm -f "$1"
    echo "$1.enc"
  else
    echo "$1"
  fi
}

upload() { # upload <file>: copy to the remote and confirm the size matches
  file="$1"; name="$(basename "$file")"
  rclone copyto "$file" "${REMOTE%/}/$name" --retries 3 --low-level-retries 5 --quiet
  local_size="$(wc -c < "$file" | tr -d ' ')"
  remote_size="$(rclone lsf --format s --files-only --include "$name" "$REMOTE" | head -n 1 | tr -d ' \r')"
  [ "$remote_size" = "$local_size" ] || { echo "[backup] upload check failed for $name (local $local_size, remote ${remote_size:-missing})" >&2; return 1; }
  echo "[backup] copied $name off-server ($local_size bytes)"
}

run_backup() {
  stamp="$(date -u +%Y%m%d-%H%M%S)"
  mkdir -p "$DIR"
  sql_tmp="$DIR/.db-$stamp.sql.part"
  db_tmp="$DIR/.db-$stamp.sql.gz.part"
  media_tmp="$DIR/.media-$stamp.tar.gz.part"
  made=""

  echo "[backup] $stamp database $MYSQL_DATABASE on $MYSQL_HOST"
  # Dump to a plain file first so a failed mysqldump is noticed (a pipe would hide its exit code).
  if ! MYSQL_PWD="$MYSQL_PASSWORD" mysqldump \
    --host="$MYSQL_HOST" --port="${MYSQL_PORT:-3306}" --user="$MYSQL_USER" \
    --single-transaction --no-tablespaces --routines --default-character-set=utf8mb4 \
    "$MYSQL_DATABASE" > "$sql_tmp"; then
    echo "[backup] mysqldump failed, keeping old backups" >&2; rm -f "$sql_tmp"
    status failed "mysqldump failed"; return 1
  fi
  if [ "$(wc -c < "$sql_tmp")" -le 200 ]; then
    echo "[backup] database dump is empty, keeping old backups" >&2; rm -f "$sql_tmp"
    status failed "empty dump"; return 1
  fi
  gzip -9 < "$sql_tmp" > "$db_tmp" && rm -f "$sql_tmp"
  mv "$db_tmp" "$DIR/db-$stamp.sql.gz"
  made="$(seal "$DIR/db-$stamp.sql.gz")"

  if [ -d "$MEDIA" ]; then
    tar -czf "$media_tmp" -C "$MEDIA" . && mv "$media_tmp" "$DIR/media-$stamp.tar.gz"
    made="$made $(seal "$DIR/media-$stamp.tar.gz")"
  fi

  offsite="skipped"
  if [ -n "$REMOTE" ]; then
    offsite="yes"
    for f in $made; do
      upload "$f" || { offsite="FAILED"; }
    done
    rclone delete "$REMOTE" --min-age "${REMOTE_KEEP}d" --include 'db-*' --include 'media-*' --quiet \
      || echo "[backup] could not remove old off-server backups" >&2
  fi

  find "$DIR" -maxdepth 1 -type f \( -name 'db-*' -o -name 'media-*' \) -mtime +"$KEEP" -delete
  echo "[backup] done: $(ls "$DIR" | grep -c '^db-') database backup(s) kept, off-server: $offsite, encrypted: $([ -n "$PASS" ] && echo yes || echo no)"
  if [ "$offsite" = "FAILED" ]; then status failed "off-server copy failed (local backup kept)"; return 1; fi
  status ok "db-$stamp offsite=$offsite"
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

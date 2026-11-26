#!/bin/sh
# Restore a media archive (.tar.gz or .tar.gz.enc) into the shared media volume.
#   sh scripts/restore-media.sh backups/media-....tar.gz.enc [deployment-env-file]
set -eu
file="${1:?Usage: restore-media.sh <backups/media-....tar.gz[.enc]> [deployment-env-file]}"
env_file="${2:-deploy.env}"
[ -f "$file" ] || { echo "No such file: $file" >&2; exit 1; }
[ -f "$env_file" ] || { echo "No such deployment env file: $env_file" >&2; exit 1; }

case "$file" in
  *.tar.gz.enc) decode='openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_ENCRYPTION_PASSPHRASE | gunzip' ;;
  *.tar.gz)     decode='gunzip' ;;
  *) echo "Expected a .tar.gz or .tar.gz.enc media archive" >&2; exit 1 ;;
esac

printf 'This replaces all files in the shared media volume using %s. Type RESTORE to continue: ' "$env_file"
read -r answer
[ "$answer" = "RESTORE" ] || { echo "Cancelled."; exit 1; }

# The Python restore helper validates every member and stages the whole archive before replacing files.
cat "$file" | docker compose --env-file "$env_file" --profile maintenance run --build --rm -T --no-deps --entrypoint sh media-restore -c \
  "$decode | python -m core.restore_media" \
  || { echo "Media restore failed. The existing media is kept if validation or extraction failed." >&2; exit 1; }

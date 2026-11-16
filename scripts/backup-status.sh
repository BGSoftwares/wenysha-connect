#!/bin/sh
# Exit 0 only if the last backup succeeded and is recent. Use it from cron or an uptime monitor.
#   sh scripts/backup-status.sh [backup folder] [max age in hours]      defaults: ./backups 26
dir="${1:-${BACKUP_DIR:-./backups}}"
max_hours="${2:-26}"
file="$dir/LAST_STATUS"
[ -f "$file" ] || { echo "NO BACKUP RECORD in $dir (has the backup service run yet?)"; exit 2; }
read -r state stamp detail < "$file"
age_hours=$(( ( $(date -u +%s) - stamp ) / 3600 ))
if [ "$state" != "ok" ]; then echo "LAST BACKUP FAILED ${age_hours}h ago: $detail"; exit 1; fi
if [ "$age_hours" -gt "$max_hours" ]; then echo "LAST BACKUP IS TOO OLD: ${age_hours}h (limit ${max_hours}h)"; exit 1; fi
echo "OK: last backup ${age_hours}h ago ($detail)"

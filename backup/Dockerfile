# MySQL client (matching the server's auth plugins) + rclone for off-server copies + openssl for encryption.
FROM rclone/rclone:1.68.2 AS rclone

FROM mysql:8.0
COPY --from=rclone /usr/local/bin/rclone /usr/local/bin/rclone
RUN (command -v microdnf >/dev/null && microdnf install -y openssl tar gzip findutils && microdnf clean all) \
    || (command -v dnf >/dev/null && dnf install -y openssl tar gzip findutils && dnf clean all) \
    || true
COPY backup.sh /scripts/backup.sh
ENTRYPOINT ["sh", "/scripts/backup.sh"]

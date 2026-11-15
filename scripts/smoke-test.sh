#!/bin/sh
# Check a running deployment end to end. Prints PASS/FAIL per check and exits non-zero if any fail.
#   sh scripts/smoke-test.sh https://school.example.org
# Optional: SMOKE_USER and SMOKE_PASS (an account WITHOUT two-step verification) also test a real sign-in.
# Set SMOKE_INSECURE=1 to accept a self-signed certificate. Set SMOKE_HTTP_URL to also test the http -> https redirect.
BASE="${1:?Usage: smoke-test.sh https://your-domain}"
BASE="${BASE%/}"
CURL="curl -sS --max-time 15"
[ "${SMOKE_INSECURE:-0}" = "1" ] && CURL="$CURL -k"
fails=0
pass() { echo "  PASS  $1"; }
fail() { echo "  FAIL  $1"; fails=$((fails+1)); }
check() { # check <description> <expected-http-code-regex> <curl args...>
  desc="$1"; want="$2"; shift 2
  code="$($CURL -o /dev/null -w '%{http_code}' "$@" 2>/dev/null)"
  echo "$code" | grep -qE "^($want)$" && pass "$desc ($code)" || fail "$desc (got ${code:-no response}, wanted $want)"
}

echo "Smoke test: $BASE"
check "home page loads" 200 "$BASE/"
check "a client-side route falls back to the app" 200 "$BASE/auth"

health="$($CURL "$BASE/api/health/" 2>/dev/null)"
echo "$health" | grep -q '"status": *"ok"' && pass "API health reports ok" || fail "API health: ${health:-no response}"
echo "$health" | grep -q '"database": *"ok"' && pass "database connection ok" || fail "database connection not ok"

headers="$($CURL -D - -o /dev/null "$BASE/" 2>/dev/null | tr -d '\r')"
for h in "x-content-type-options: nosniff" "x-frame-options: DENY" "strict-transport-security"; do
  echo "$headers" | grep -qi "$h" && pass "header $h" || fail "missing header $h"
done

check "wrong password is refused, not a server error" '400|401' -X POST -H 'Content-Type: application/json' \
  -d '{"email":"smoke-nobody","password":"wrong-password-123"}' "$BASE/api/auth/login/"
check "protected data needs sign-in" 401 "$BASE/api/school/students/"
check "backups are not downloadable without sign-in" '401|403' "$BASE/api/auth/backups/"
check "private media folders are blocked" 404 "$BASE/media/library/anything.pdf"

if [ -n "${SMOKE_HTTP_URL:-}" ]; then
  code="$(curl -sS --max-time 15 -o /dev/null -w '%{http_code}' "$SMOKE_HTTP_URL/" 2>/dev/null)"
  [ "$code" = "301" ] && pass "http redirects to https (301)" || fail "http redirect (got $code, wanted 301)"
fi

if [ -n "${SMOKE_USER:-}" ] && [ -n "${SMOKE_PASS:-}" ]; then
  login="$($CURL -X POST -H 'Content-Type: application/json' -d "{\"email\":\"$SMOKE_USER\",\"password\":\"$SMOKE_PASS\"}" "$BASE/api/auth/login/" 2>/dev/null)"
  token="$(echo "$login" | sed -n 's/.*"access": *"\([^"]*\)".*/\1/p')"
  if [ -n "$token" ]; then
    pass "sign-in works for $SMOKE_USER"
    check "signed-in request succeeds" 200 -H "Authorization: Bearer $token" "$BASE/api/auth/me/"
  else
    fail "sign-in failed for $SMOKE_USER: $(echo "$login" | head -c 160)"
  fi
fi

echo
[ "$fails" -eq 0 ] && echo "All checks passed." || echo "$fails check(s) failed."
exit "$fails"

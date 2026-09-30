#!/usr/bin/env bash
# Publish muneeb-ahmadch.github.io: lint every tracked file for contact details and secrets, cache-bust, push,
# and wait until GitHub Pages serves the new files byte-identical. Usage: ./publish-site.sh [--dry-run] [--client NAME]...
set -euo pipefail
cd "$(dirname "$0")"
DRY=0; CLIENTS=()
while [ $# -gt 0 ]; do case "$1" in --dry-run) DRY=1;; --client) CLIENTS+=("$2"); shift;; *) echo "unknown arg $1"; exit 2;; esac; shift; done
SITE="https://muneeb-ahmadch.github.io"

[ "$(git config user.email)" = "173696938+muneeb-ahmadch@users.noreply.github.com" ] || { echo "REFUSED: git identity is not the noreply address"; exit 1; }

FILES="$(git ls-files --cached --others --exclude-standard | grep -vE '^(redteam/runs/|eval/runs/)' || true)"
fail=0
check() { # label, regex
  local hits; hits="$(printf '%s\n' "$FILES" | tr '\n' '\0' | xargs -0 grep -nIE -- "$2" 2>/dev/null | grep -v 'publish-site.sh' | cut -c1-170 || true)"
  if [ -n "$hits" ]; then echo "LINT FAIL [$1]:"; echo "$hits" | sed 's/^/    /'; fail=1; fi
}
check "email address"   '[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.(com|net|org|io|pk|dev|me|co)\b'
check "mailto"          'mailto:'
check "phone number"    '\+92[ -]?[0-9]{3}|\b03[0-9]{2}[ -]?[0-9]{7}\b|\+[0-9]{1,3}[ (-]*[0-9]{3}[ )-]*[0-9]{3}[ -]?[0-9]{4}'
check "contact link"    'linkedin\.com/in/|wa\.me/|t\.me/[a-z]|calendly\.com/|zoom\.us/j/|meet\.google\.com/[a-z]|loom\.com/share'
check "own email handle" 'muneebahmad\.ch'
check "portfolio site"  'github\.io/llm-engineering-portfolio'
check "secret/key"      'sk-ant-|sk-[A-Za-z0-9_-]{20,}|gsk_[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_|AKIA[0-9A-Z]{16}|0x4AAAA[A-Za-z0-9_-]{20,}'
for c in "${CLIENTS[@]+"${CLIENTS[@]}"}"; do check "client: $c" "$(printf '%s' "$c" | sed 's/[.[\*^$()+?{}|]/\\&/g')"; done
git ls-files --error-unmatch worker/.dev.vars >/dev/null 2>&1 && { echo "LINT FAIL: worker/.dev.vars is tracked"; fail=1; }
grep -q "WORKER_URL: ''" assets/config.js && echo "note: WORKER_URL is empty, the chat will answer from notes only"
[ $fail -eq 0 ] || { echo "REFUSED: nothing was published."; exit 1; }
echo "lint: clean ($(printf '%s\n' "$FILES" | wc -l | tr -d ' ') files)"
[ $DRY -eq 1 ] && { echo "dry run: stopping before commit"; exit 0; }

# cache-bust the page's own css/js
for f in assets/site.css assets/app.js; do
  h="$(shasum "$f" | cut -c1-8)"
  sed -i '' -E "s#(${f})(\?v=[0-9a-f]+)?\"#\1?v=${h}\"#g" index.html
done
git add -A
git commit -q -m "Publish $(date -u +%Y-%m-%dT%H:%MZ)" || echo "nothing new to commit"
git push -q origin main
for i in $(seq 1 36); do
  ok=1
  for f in index.html assets/app.js assets/config.js kb/index.json; do
    curl -fsS "$SITE/$f?cb=$RANDOM$i" -o /tmp/pub.$$ 2>/dev/null && cmp -s /tmp/pub.$$ "$f" || { ok=0; break; }
  done
  [ $ok -eq 1 ] && { rm -f /tmp/pub.$$; echo "LIVE: $SITE/"; exit 0; }
  sleep 10
done
echo "NOT CONFIRMED after 6 minutes: check the Pages build before sharing the link"; exit 1

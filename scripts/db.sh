#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'USAGE'
Usage:
  scripts/db.sh <target> query "<SQL>"   [--write]
  scripts/db.sh <target> file <path.sql> [--write]
  scripts/db.sh <target> check

Targets: local, supabase (reads .env.db.<target> in repo root)
Remote targets run read-only unless --write is given.
USAGE
  exit 2
}

[ $# -ge 2 ] || usage

target=$1
mode=$2
shift 2

repo_root=$(cd "$(dirname "$0")/.." && pwd)
env_file="$repo_root/.env.db.$target"

case "$target" in
  local | supabase) ;;
  *) echo "error: unknown target '$target'" >&2; usage ;;
esac

[ -r "$env_file" ] || {
  echo "error: .env.db.$target not found. Copy .env.db.example and fill it in." >&2
  exit 1
}

env_value() {
  local line
  line=$(grep -E "^$1=" "$env_file" | tail -n 1 || true)
  line=${line#*=}
  line=${line%\"}
  line=${line#\"}
  line=${line%\'}
  line=${line#\'}
  printf '%s' "$line"
}

require() {
  local v
  v=$(env_value "$1")
  [ -n "$v" ] || { echo "error: $1 missing in .env.db.$target" >&2; exit 1; }
  printf '%s' "$v"
}

PGHOST=$(require DB_HOST)
PGPORT=$(env_value DB_PORT)
PGUSER=$(require DB_USER)
PGPASSWORD=$(require DB_PASSWORD)
PGDATABASE=$(env_value DB_NAME)
PGSSLMODE=$(env_value DB_SSLMODE)
export PGHOST PGUSER PGPASSWORD
export PGPORT=${PGPORT:-5432}
export PGDATABASE=${PGDATABASE:-postgres}
export PGSSLMODE=${PGSSLMODE:-prefer}
export PGCONNECT_TIMEOUT=10

write=0
args=()
for a in "$@"; do
  case "$a" in
    --write) write=1 ;;
    *) args+=("$a") ;;
  esac
done

read_only=1
[ "$target" = local ] && read_only=0
[ "$write" = 1 ] && read_only=0

psql_base=(psql --no-psqlrc -v ON_ERROR_STOP=1 --single-transaction)
# SET TRANSACTION must be the first statement; --single-transaction keeps it pooler-safe
[ "$read_only" = 1 ] && psql_base+=(-c "SET TRANSACTION READ ONLY")

case "$mode" in
  query)
    [ ${#args[@]} -eq 1 ] || usage
    exec "${psql_base[@]}" -c "${args[0]}"
    ;;
  file)
    [ ${#args[@]} -eq 1 ] || usage
    [ -r "${args[0]}" ] || { echo "error: cannot read ${args[0]}" >&2; exit 1; }
    exec "${psql_base[@]}" -f "${args[0]}"
    ;;
  check)
    exec "${psql_base[@]}" -tA -c "SELECT current_user || ' @ ' || current_database() || ' (' || split_part(version(), ' ', 2) || ')'"
    ;;
  *)
    usage
    ;;
esac

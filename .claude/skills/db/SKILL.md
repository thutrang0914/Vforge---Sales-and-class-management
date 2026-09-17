---
name: db
description: Query the v-management Postgres database (local or Supabase) without seeing credentials. Use when the user asks to inspect data, run SQL, check schema/RLS, apply a .sql file from supabase/, or debug data issues.
---

# DB access

All database access goes through `scripts/db.sh`. The script reads credentials from
`.env.db.<target>` and passes them to `psql` through environment variables.

## Hard rules

- NEVER read, cat, grep, source, or print `.env`, `.env.local`, `.env.db.local`, `.env.db.supabase`.
- NEVER put a password or connection string in a command, file, or reply.
- NEVER run `env`, `printenv`, or `set` in a way that could dump `PG*` variables.
- If a credential is missing or wrong, tell the user which key to fix in which file. Do not try to find it.
- Writes to `supabase` need `--write` and explicit user approval for that exact SQL first.

## Targets

| Target     | File               | Default mode |
|------------|--------------------|--------------|
| `local`    | `.env.db.local`    | read-write   |
| `supabase` | `.env.db.supabase` | read-only    |

Keys: `DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME DB_SSLMODE` (see `.env.db.example`).

## Commands

```bash
scripts/db.sh local check
scripts/db.sh supabase query "SELECT count(*) FROM leads"
scripts/db.sh supabase query "\d+ leads"
scripts/db.sh local file supabase/schema.sql
scripts/db.sh supabase file supabase/cleanup_sample_data.sql --write
```

Every run is one transaction (`--single-transaction`, `ON_ERROR_STOP=1`): a failing
statement rolls back the whole run. Read-only mode starts with `SET TRANSACTION READ ONLY`,
so any write fails with `cannot execute ... in a read-only transaction`.

`CREATE INDEX CONCURRENTLY`, `VACUUM`, and similar cannot run inside a transaction and
will fail through this script. Ask the user to run those by hand.

## Setup (user does this, not Claude)

```bash
cp .env.db.example .env.db.local
cp .env.db.example .env.db.supabase
# fill in values in an editor
scripts/db.sh local check
scripts/db.sh supabase check
```

## Errors

| Message | Meaning |
|---------|---------|
| `.env.db.<target> not found` | user has not created the file |
| `<KEY> missing in .env.db.<target>` | user must fill that key |
| `password authentication failed` | wrong `DB_USER`/`DB_PASSWORD` |
| `read-only transaction` | add `--write` after user approval |

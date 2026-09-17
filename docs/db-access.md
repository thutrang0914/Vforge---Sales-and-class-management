# Database access

`scripts/db.sh` runs SQL against the local or Supabase Postgres database. Credentials live in
gitignored plain-text env files that only the script reads. Claude Code uses the same script
through the `db` skill, so it can query the database without ever seeing a password.

## How it works

```
.env.db.local / .env.db.supabase   (gitignored, you fill in)
        |
scripts/db.sh <target> ...         reads DB_* keys, exports PG* env vars, never prints them
        |
psql --no-psqlrc --single-transaction -v ON_ERROR_STOP=1
```

Claude Code is kept away from the credentials in two ways:

- `.claude/skills/db/SKILL.md` tells Claude to use only `scripts/db.sh` and never open the env files.
- `.claude/settings.json` denies `Read` on `.env`, `.env.local`, `.env.db.local`, `.env.db.supabase`.

## Requirements

- `psql` on your `PATH` (`brew install libpq` or `brew install postgresql`)

## Setup

```bash
cp .env.db.example .env.db.local
cp .env.db.example .env.db.supabase
```

Fill in both files in your editor:

| Key           | Required | Default    | Notes                                  |
|---------------|----------|------------|----------------------------------------|
| `DB_HOST`     | yes      |            |                                        |
| `DB_PORT`     | no       | `5432`     |                                        |
| `DB_USER`     | yes      |            | Supabase pooler: `postgres.<project-ref>` |
| `DB_PASSWORD` | yes      |            | quotes are optional                    |
| `DB_NAME`     | no       | `postgres` |                                        |
| `DB_SSLMODE`  | no       | `prefer`   | use `require` for Supabase             |

For Supabase, open **Dashboard > Connect** and copy the values from **Session pooler** or
**Direct connection**.

Check both connections:

```bash
scripts/db.sh local check
scripts/db.sh supabase check
# <user> @ <database> (<server version>)
```

## Usage

```bash
scripts/db.sh <target> query "<SQL>"   [--write]
scripts/db.sh <target> file <path.sql> [--write]
scripts/db.sh <target> check
```

| Target     | Env file           | Default mode |
|------------|--------------------|--------------|
| `local`    | `.env.db.local`    | read-write   |
| `supabase` | `.env.db.supabase` | read-only    |

Examples:

```bash
scripts/db.sh supabase query "SELECT count(*) FROM leads"
scripts/db.sh supabase query "\d+ leads"
scripts/db.sh local file supabase/schema.sql
scripts/db.sh supabase file supabase/cleanup_sample_data.sql --write
```

### Behavior

- Every run is a single transaction. If any statement fails, the whole run is rolled back.
- Supabase runs start with `SET TRANSACTION READ ONLY`. Writes fail with
  `cannot execute ... in a read-only transaction` unless you pass `--write`.
- Statements that cannot run inside a transaction (`CREATE INDEX CONCURRENTLY`, `VACUUM`,
  `CREATE DATABASE`) fail through this script. Run them with `psql` directly.

## Using it from Claude Code

Ask in plain words, for example "how many leads per status on supabase?". Claude loads the
`db` skill and runs `scripts/db.sh`. It asks you before any `--write` on Supabase.

## Troubleshooting

| Message                                | Fix                                         |
|----------------------------------------|---------------------------------------------|
| `.env.db.<target> not found`           | create the file from `.env.db.example`      |
| `<KEY> missing in .env.db.<target>`    | fill in that key                            |
| `password authentication failed`       | check `DB_USER` and `DB_PASSWORD`           |
| `connection ... timeout expired`       | check `DB_HOST`/`DB_PORT`, network, pooler  |
| `read-only transaction`                | add `--write` if the write is intended      |
| `unknown target`                       | use `local` or `supabase`                   |

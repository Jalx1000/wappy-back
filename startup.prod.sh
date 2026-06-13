#!/usr/bin/env bash
set -e

echo "[prod] Running migrations…"
# Railway pasa env vars directamente al proceso — no necesitamos env-cmd.
# Invocamos typeorm-ts-node-commonjs directamente.
npx --yes ts-node -r tsconfig-paths/register \
  ./node_modules/typeorm/cli.js \
  --dataSource=src/database/data-source.ts \
  migration:run

echo "[prod] Starting API…"
exec node dist/main

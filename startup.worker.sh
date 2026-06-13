#!/usr/bin/env bash
set -e

# El worker no corre migrations (las hace el servicio api). Solo arranca.
echo "[worker] Starting BullMQ worker…"
exec node dist/worker

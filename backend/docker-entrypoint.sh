#!/bin/sh
set -e

# Migrasi TIDAK lagi otomatis saat boot. Jalankan manual supaya deploy tidak
# pernah mengubah skema tanpa disengaja:
#
#   docker compose -f docker-compose.prod.yml run --rm gokilbgt /app/app migrate
#
# Butuh otomatis lagi (mis. staging yang sekali pakai)? Set RUN_MIGRATIONS=1.
#
# Catatan lama yang tetap berlaku: JANGAN makemigrations di sini.
# Auto-generate saat boot menghasilkan migrasi tanpa DEFAULT/CASCADE yang
# berulang kali merusak prod (FK duplikat, kolom NOT NULL gagal). Setiap
# perubahan model wajib disertai file migrasi di backend/migrations/.
if [ "$RUN_MIGRATIONS" = "1" ]; then
  echo "[entrypoint] RUN_MIGRATIONS=1 — running migrations..."
  /app/app migrate
else
  echo "[entrypoint] migrations disabled (set RUN_MIGRATIONS=1 to enable)"
fi

echo "[entrypoint] starting server..."
exec /app/app serve

-- +migrate Up
-- Warna divisi untuk chip & legend kalender: nama token CSS (`division-1`..`division-6`).
-- Kosong = otomatis (dibagi berurutan oleh frontend dari daftar divisi).
ALTER TABLE division ADD COLUMN IF NOT EXISTS color VARCHAR(20) NOT NULL DEFAULT '';

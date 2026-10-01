-- +migrate Up
-- Master data kategori izin (mis. Sakit, Izin) + penghubung ke pengajuan izin.
-- Dua kategori awal diseed supaya pengajuan lama tetap punya kategori.
CREATE TABLE IF NOT EXISTS permission_category (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO permission_category (name, description)
SELECT 'Sakit', 'Tidak dapat hadir karena sakit (bukti: surat/foto keterangan)'
WHERE NOT EXISTS (SELECT 1 FROM permission_category WHERE name = 'Sakit');

INSERT INTO permission_category (name, description)
SELECT 'Izin', 'Tidak dapat hadir karena keperluan lain'
WHERE NOT EXISTS (SELECT 1 FROM permission_category WHERE name = 'Izin');

ALTER TABLE permission_request
    ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES permission_category(id);

-- Pengajuan lama (sebelum ada kategori) dianggap 'Izin'.
UPDATE permission_request
SET category_id = (SELECT id FROM permission_category WHERE name = 'Izin' ORDER BY id LIMIT 1)
WHERE category_id IS NULL;

ALTER TABLE permission_request ALTER COLUMN category_id SET NOT NULL;

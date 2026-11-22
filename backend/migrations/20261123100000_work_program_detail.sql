-- +migrate Up
-- Program kerja & agenda: slug (halaman detail), kategori, status, divisi,
-- tanggal, lokasi, dan tuan rumah.
ALTER TABLE work_program ADD COLUMN IF NOT EXISTS slug VARCHAR(180);
ALTER TABLE work_program ADD COLUMN IF NOT EXISTS category VARCHAR(30) NOT NULL DEFAULT 'program_kerja';
ALTER TABLE work_program ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'upcoming';
ALTER TABLE work_program ADD COLUMN IF NOT EXISTS division_id BIGINT REFERENCES division(id) ON DELETE SET NULL;
ALTER TABLE work_program ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE work_program ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE work_program ADD COLUMN IF NOT EXISTS location VARCHAR(200) NOT NULL DEFAULT '';
ALTER TABLE work_program ADD COLUMN IF NOT EXISTS host VARCHAR(200) NOT NULL DEFAULT '';

-- Backfill slug dari name; fallback 'program' bila kosong setelah dibersihkan.
UPDATE work_program
SET slug = COALESCE(NULLIF(LEFT(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(name), '[^a-z0-9]+', '-', 'g')), 170), ''), 'program')
WHERE slug IS NULL;

-- Dedupe: baris dengan slug kembar (selain id terkecil) dapat akhiran -<id>.
UPDATE work_program w
SET slug = w.slug || '-' || w.id
WHERE EXISTS (SELECT 1 FROM work_program o WHERE o.slug = w.slug AND o.id < w.id);

ALTER TABLE work_program ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_work_program_slug ON work_program(slug);
CREATE INDEX IF NOT EXISTS idx_work_program_division_id ON work_program(division_id);

-- +migrate Down
DROP INDEX IF EXISTS idx_work_program_division_id;
DROP INDEX IF EXISTS idx_work_program_slug;
ALTER TABLE work_program DROP COLUMN IF EXISTS host;
ALTER TABLE work_program DROP COLUMN IF EXISTS location;
ALTER TABLE work_program DROP COLUMN IF EXISTS end_date;
ALTER TABLE work_program DROP COLUMN IF EXISTS start_date;
ALTER TABLE work_program DROP COLUMN IF EXISTS division_id;
ALTER TABLE work_program DROP COLUMN IF EXISTS status;
ALTER TABLE work_program DROP COLUMN IF EXISTS category;
ALTER TABLE work_program DROP COLUMN IF EXISTS slug;

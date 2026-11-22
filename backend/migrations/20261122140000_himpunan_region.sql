-- +migrate Up
-- Daerah (1-6) himpunan; 0 = belum ditentukan.
ALTER TABLE himpunan ADD COLUMN IF NOT EXISTS region SMALLINT NOT NULL DEFAULT 0;

UPDATE himpunan SET region = 1 WHERE region = 0 AND city IN ('Pekalongan', 'Tegal', 'Brebes', 'Batang');
UPDATE himpunan SET region = 2 WHERE region = 0 AND city IN ('Cilacap', 'Purwokerto', 'Purbalingga');
UPDATE himpunan SET region = 3 WHERE region = 0 AND city IN ('Semarang', 'Ungaran', 'Kendal', 'Salatiga');
UPDATE himpunan SET region = 4 WHERE region = 0 AND city IN ('Kebumen', 'Magelang', 'Purworejo', 'Wonosobo', 'Banjarnegara');
UPDATE himpunan SET region = 5 WHERE region = 0 AND city IN ('Blora', 'Jepara', 'Kudus');
UPDATE himpunan SET region = 6 WHERE region = 0 AND city IN ('Surakarta', 'Boyolali');

-- +migrate Down
ALTER TABLE himpunan DROP COLUMN IF EXISTS region;

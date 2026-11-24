-- +migrate Up
-- Karya sekarang punya sampai 5 foto, bukan satu. Tabel terpisah mengikuti pola
-- announcement_attachment: CASCADE, jadi menghapus karya ikut menghapus barisnya.
CREATE TABLE IF NOT EXISTS karya_image (
    id BIGSERIAL PRIMARY KEY,
    karya_id BIGINT NOT NULL REFERENCES karya(id) ON DELETE CASCADE,
    url VARCHAR(512) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_karya_image_karya ON karya_image(karya_id, sort_order);

-- Pindahkan foto lama (maks satu per karya) ke tabel baru, urutan pertama.
INSERT INTO karya_image (karya_id, url, sort_order)
SELECT id, image_url, 0 FROM karya WHERE image_url <> '';

ALTER TABLE karya DROP COLUMN IF EXISTS image_url;

-- +migrate Down
ALTER TABLE karya ADD COLUMN IF NOT EXISTS image_url VARCHAR(512) NOT NULL DEFAULT '';

UPDATE karya k
SET image_url = img.url
FROM (
    SELECT DISTINCT ON (karya_id) karya_id, url
    FROM karya_image ORDER BY karya_id, sort_order, id
) img
WHERE img.karya_id = k.id;

DROP TABLE IF EXISTS karya_image;
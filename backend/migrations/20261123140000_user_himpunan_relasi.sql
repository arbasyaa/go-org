-- +migrate Up
-- Asal himpunan pengurus jadi RELASI ke tabel himpunan, bukan teks bebas.
--
-- Alasannya: `user.asal_himpunan` diisi manual saat impor, jadi ejaannya
-- berbeda-beda ("HIMATIF UMNU" vs "HIMATIF UMNU Kebumen") dan rename himpunan
-- di /admin/himpunan tidak ikut ke landing. Kolom relasi membuat satu sumber
-- kebenaran.
--
-- `asal_himpunan` (teks) TIDAK dihapus: masih dipakai sebagai cadangan untuk
-- nilai lama yang tidak ketemu di daftar himpunan, dan CSV impor masih
-- mengisinya. Relasi diisi hanya bila teksnya cocok persis (tanpa beda huruf
-- besar/spasi) dengan `himpunan.name` atau `himpunan.short_label`; sisanya
-- dibiarkan NULL supaya admin memilih sendiri di /admin/users — menebak
-- kemiripan nama berisiko menautkan orang ke himpunan yang salah.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS himpunan_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_himpunan_id_fkey') THEN
    ALTER TABLE "user"
      ADD CONSTRAINT user_himpunan_id_fkey
      FOREIGN KEY (himpunan_id) REFERENCES himpunan(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_himpunan_id ON "user" (himpunan_id);

UPDATE "user" u
SET himpunan_id = h.id
FROM himpunan h
WHERE u.himpunan_id IS NULL
  AND u.asal_himpunan <> ''
  AND lower(trim(u.asal_himpunan)) IN (lower(trim(h.name)), lower(trim(h.short_label)));

-- +migrate Down
DROP INDEX IF EXISTS idx_user_himpunan_id;
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS user_himpunan_id_fkey;
ALTER TABLE "user" DROP COLUMN IF EXISTS himpunan_id;

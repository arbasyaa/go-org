-- =============================================================================
-- Bersihkan akun & data lama production, pertahankan data dari migrasi
-- 20261105120000_officials_accounts.sql.
--
-- DIPERTAHANKAN
--   * Akun pengurus migrasi: email '%@permikomnasjateng.or.id' (57 akun).
--   * Akun ber-role sistem (Admin) — agar tetap bisa login & mengelola.
--   * Divisi 7 BPW 26/27 + divisi apa pun yang dipakai akun yang dipertahankan.
--   * Role sistem + role yang dipakai akun yang dipertahankan.
-- DIHAPUS
--   * Semua akun lain. Data pribadinya ikut terhapus (CASCADE): absensi,
--     pengajuan izin, penugasan event, push subscription.
--     Konten organisasi (event, pengumuman, surat, berita, file, log) TETAP ada;
--     kolom pembuatnya menjadi NULL (FK SET NULL).
--   * Divisi lain. Referensi ke divisi itu dibereskan dulu:
--     event.division_id & announcement.target_division_id -> NULL,
--     recruitment_submission yang memilih divisi itu -> dihapus,
--     target divisi event/rekrutmen -> ikut terhapus (CASCADE).
--   * Role non-sistem yang tidak dipakai akun yang dipertahankan, KECUALI role
--     struktur BPW (Koordinator/Wakil/Sekretaris Wilayah, Bendahara, Kepala/
--     Sekretaris Divisi, Anggota).
--
-- CARA PAKAI (di server, dari folder berisi docker-compose.prod.yml):
--   0) BACKUP DULU:
--      docker compose -f docker-compose.prod.yml exec -T db \
--        sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > backup-$(date +%F-%H%M).dump
--   1) Uji coba (semua perubahan di-ROLLBACK, hanya menampilkan ringkasan):
--      docker compose -f docker-compose.prod.yml exec -T db \
--        sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1' < cleanup-legacy-data.sql
--   2) Bila ringkasan sudah benar, jalankan sungguhan:
--      docker compose -f docker-compose.prod.yml exec -T db \
--        sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -v confirm=1' < cleanup-legacy-data.sql
--   Restore bila perlu: pg_restore --clean --if-exists --no-owner -d <db> backup-....dump
-- =============================================================================

\set QUIET on
BEGIN;

CREATE TEMP TABLE keep_user ON COMMIT DROP AS
SELECT u.id FROM "user" u
LEFT JOIN role r ON r.id = u.role_id
WHERE u.email ILIKE '%@permikomnasjateng.or.id' OR r.is_system;

CREATE TEMP TABLE del_user ON COMMIT DROP AS
SELECT id FROM "user" WHERE id NOT IN (SELECT id FROM keep_user);

CREATE TEMP TABLE keep_division ON COMMIT DROP AS
SELECT id FROM division
WHERE name IN ('Pengurus Harian', 'PSDM', 'Medkominfo', 'IPTEK', 'KWU', 'PR', 'Koordinator Daerah')
UNION
SELECT division_id FROM "user" WHERE id IN (SELECT id FROM keep_user) AND division_id IS NOT NULL;

CREATE TEMP TABLE del_division ON COMMIT DROP AS
SELECT id FROM division WHERE id NOT IN (SELECT id FROM keep_division);

CREATE TEMP TABLE del_role ON COMMIT DROP AS
SELECT r.id FROM role r
WHERE NOT r.is_system
  -- Role struktur BPW (dari migrasi) tetap disimpan walau belum dipakai siapa pun.
  AND r.name NOT IN ('Koordinator Wilayah', 'Wakil Koordinator Wilayah', 'Sekretaris Wilayah',
                     'Bendahara', 'Bendahara Wilayah', 'Kepala Divisi', 'Sekretaris Divisi', 'Anggota')
  AND r.id NOT IN (SELECT role_id FROM "user" WHERE id IN (SELECT id FROM keep_user) AND role_id IS NOT NULL);

\set QUIET off
\echo '=== PRATINJAU ==='
SELECT 'akun dipertahankan' AS item, count(*) FROM keep_user
UNION ALL SELECT 'akun DIHAPUS', count(*) FROM del_user
UNION ALL SELECT 'divisi dipertahankan', count(*) FROM keep_division
UNION ALL SELECT 'divisi DIHAPUS', count(*) FROM del_division
UNION ALL SELECT 'role DIHAPUS', count(*) FROM del_role
UNION ALL SELECT 'absensi ikut terhapus', count(*) FROM attendance WHERE user_id IN (SELECT id FROM del_user)
UNION ALL SELECT 'pengajuan izin ikut terhapus', count(*) FROM permission_request WHERE user_id IN (SELECT id FROM del_user)
UNION ALL SELECT 'event yang divisinya dikosongkan', count(*) FROM event WHERE division_id IN (SELECT id FROM del_division)
UNION ALL SELECT 'submission rekrutmen dihapus', count(*) FROM recruitment_submission WHERE division_interest_id IN (SELECT id FROM del_division);

\echo '--- akun yang DIPERTAHANKAN tapi BUKAN dari migrasi (harus hanya admin):'
SELECT u.id, u.username, u.email, r.name AS role FROM "user" u JOIN role r ON r.id = u.role_id
WHERE u.id IN (SELECT id FROM keep_user) AND u.email NOT ILIKE '%@permikomnasjateng.or.id';
\echo '--- divisi DIHAPUS:'
SELECT id, name FROM division WHERE id IN (SELECT id FROM del_division) ORDER BY name;
\echo '--- role DIHAPUS:'
SELECT id, name FROM role WHERE id IN (SELECT id FROM del_role) ORDER BY name;
\echo '--- contoh akun DIHAPUS (maks 30):'
SELECT id, username, email, full_name FROM "user" WHERE id IN (SELECT id FROM del_user) ORDER BY id LIMIT 30;

-- Pengaman: batalkan bila tidak ada satu pun akun migrasi (salah database).
DO $$
BEGIN
  IF (SELECT count(*) FROM "user" WHERE email ILIKE '%@permikomnasjateng.or.id') = 0 THEN
    RAISE EXCEPTION 'Tidak ada akun migrasi (@permikomnasjateng.or.id) — dibatalkan.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM keep_user k JOIN "user" u ON u.id = k.id JOIN role r ON r.id = u.role_id WHERE r.is_system) THEN
    RAISE EXCEPTION 'Tidak ada akun Admin yang tersisa — dibatalkan.';
  END IF;
END $$;

-- ---------------------------------------------------------------- eksekusi
\set QUIET on
DELETE FROM "user" WHERE id IN (SELECT id FROM del_user);

UPDATE event SET division_id = NULL WHERE division_id IN (SELECT id FROM del_division);
UPDATE announcement SET target_division_id = NULL WHERE target_division_id IN (SELECT id FROM del_division);
DELETE FROM recruitment_submission WHERE division_interest_id IN (SELECT id FROM del_division);
DELETE FROM division WHERE id IN (SELECT id FROM del_division);

DELETE FROM role WHERE id IN (SELECT id FROM del_role);
\set QUIET off

\echo '=== SETELAH (di dalam transaksi) ==='
SELECT 'akun' AS item, count(*) FROM "user"
UNION ALL SELECT 'divisi', count(*) FROM division
UNION ALL SELECT 'role', count(*) FROM role;

\if :{?confirm}
  COMMIT;
  \echo '>>> COMMIT: perubahan DISIMPAN.'
\else
  ROLLBACK;
  \echo '>>> UJI COBA: semua perubahan di-ROLLBACK. Jalankan ulang dengan -v confirm=1 untuk menyimpan.'
\endif

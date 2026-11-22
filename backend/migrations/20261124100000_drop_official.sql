-- +migrate Up
-- Tabel `official` dihapus: isinya duplikat penuh dari tabel `user`
-- (full_name/jabatan/asal_himpunan/division_id). Duplikat itu membuat landing
-- tetap menampilkan orang yang akunnya sudah dihapus, jadi sumbernya
-- disatukan ke `user` dan endpoint /public/officials membaca dari sana.
-- Idempoten: aman dijalankan pada DB yang tidak pernah punya tabel ini.
DELETE FROM role_permission
WHERE permission_id IN (SELECT id FROM permission WHERE code = 'official.manage');
DELETE FROM permission WHERE code = 'official.manage';
DROP TABLE IF EXISTS official;

-- +migrate Down
-- Tidak bisa dipulihkan: data pengurus sekarang hidup di tabel `user`.
SELECT 1;

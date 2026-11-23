-- +migrate Up
-- Hapus kolom `user.jabatan`: satu sumber kebenaran untuk jabatan = `role.name`.
--
-- Sebelumnya jabatan disimpan dua kali (role + kolom teks `jabatan`), dan tiap
-- kali admin mengubah salah satunya, tampilan di landing bisa berbeda dari
-- maksudnya. Yang tidak bisa diwakili role hanya NOMOR pada "Koordinator
-- Daerah 1..6" — itu sekarang jadi role sendiri, sehingga nomornya ikut
-- terbaca di RBAC dan di landing tanpa kolom tambahan.
--
-- Nomor urut lain ("Bendahara Wilayah 1/2", "Sekretaris Wilayah 2") sengaja
-- tidak dijadikan role terpisah: dua orang memegang jabatan yang sama.

-- 1. Role koordinator per daerah.
INSERT INTO role (name, description, is_system)
SELECT 'Koordinator Daerah ' || n, 'Koordinator Daerah ' || n || ' BPW 26/27', FALSE
FROM generate_series(1, 6) AS n
WHERE NOT EXISTS (SELECT 1 FROM role r WHERE r.name = 'Koordinator Daerah ' || n);

-- 2. Permission disamakan dengan role Anggota (itulah role koordinator sebelum
--    migrasi ini: jabatan "Koordinator Daerah N" + role "Anggota").
INSERT INTO role_permission (role_id, permission_id)
SELECT koor.id, rp.permission_id
FROM role koor
JOIN role anggota ON anggota.name = 'Anggota'
JOIN role_permission rp ON rp.role_id = anggota.id
WHERE koor.name IN (
  'Koordinator Daerah 1', 'Koordinator Daerah 2', 'Koordinator Daerah 3',
  'Koordinator Daerah 4', 'Koordinator Daerah 5', 'Koordinator Daerah 6'
)
AND NOT EXISTS (
  SELECT 1 FROM role_permission x WHERE x.role_id = koor.id AND x.permission_id = rp.permission_id
);

-- 3. Pindahkan pemegang jabatan ke role yang sesuai, berdasarkan teks jabatan.
UPDATE "user" u
SET role_id = r.id
FROM role r
WHERE r.name IN (
    'Koordinator Daerah 1', 'Koordinator Daerah 2', 'Koordinator Daerah 3',
    'Koordinator Daerah 4', 'Koordinator Daerah 5', 'Koordinator Daerah 6'
  )
  AND u.jabatan = r.name;

-- 4. Buang kolom yang sekarang jadi duplikat.
ALTER TABLE "user" DROP COLUMN IF EXISTS jabatan;

-- +migrate Down
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS jabatan varchar(100) NOT NULL DEFAULT '';

-- Isi ulang teks jabatan dari role (best effort): nomor urut Bendahara/Sekretaris
-- tidak bisa dipulihkan, dan role struktural lain memakai nama role apa adanya.
UPDATE "user" u
SET jabatan = CASE WHEN r.name = 'Anggota' THEN '' ELSE r.name END
FROM role r
WHERE u.role_id = r.id;

DELETE FROM role WHERE name IN (
  'Koordinator Daerah 1', 'Koordinator Daerah 2', 'Koordinator Daerah 3',
  'Koordinator Daerah 4', 'Koordinator Daerah 5', 'Koordinator Daerah 6'
) AND NOT EXISTS (SELECT 1 FROM "user" u WHERE u.role_id = role.id);
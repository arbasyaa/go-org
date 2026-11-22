-- +migrate Up
-- Seed ulang divisi + role + permission pengurus BPW 26/27.
--
-- Dibuat karena divisi/role di DB produksi dihapus manual lewat /admin, dan
-- migrasi 20261105120000 tidak bisa dijalankan ulang (sudah tercatat selesai).
-- Idempoten: semua pakai WHERE NOT EXISTS, aman dijalankan berkali-kali.
--
-- Role mengikuti JABATAN. Bendahara memakai nama "Bendahara Wilayah" (bukan
-- "Bendahara") karena itulah yang dipakai migrasi 20261105120000 saat
-- menautkan akun bendahara, dan seeder "Bendahara" tidak pernah jalan di DB
-- yang tabel user-nya sudah terisi.

-- 1. Divisi (7).
INSERT INTO division (name, description, color)
SELECT v.name, v.description, v.color FROM (VALUES
  ('Pengurus Harian', 'Divisi Pengurus Harian BPW 26/27', 'division-1'),
  ('PSDM', 'Divisi PSDM BPW 26/27', 'division-2'),
  ('Medkominfo', 'Divisi Medkominfo BPW 26/27', 'division-3'),
  ('IPTEK', 'Divisi IPTEK BPW 26/27', 'division-4'),
  ('KWU', 'Divisi KWU BPW 26/27', 'division-5'),
  ('PR', 'Divisi PR BPW 26/27', 'division-6'),
  ('Koordinator Daerah', 'Divisi Koordinator Daerah BPW 26/27', 'division-7')
) AS v(name, description, color)
WHERE NOT EXISTS (SELECT 1 FROM division d WHERE d.name = v.name);

-- 2. Role (7 jabatan).
INSERT INTO role (name, description, is_system)
SELECT v.name, v.description, FALSE FROM (VALUES
  ('Koordinator Wilayah', 'Memimpin wilayah: melihat semua event, membuat & mengubah event, menyetujui izin'),
  ('Wakil Koordinator Wilayah', 'Mendampingi koordinator wilayah'),
  ('Sekretaris Wilayah', 'Administrasi: surat, pengumuman, data anggota'),
  ('Bendahara Wilayah', 'Keuangan: transaksi, kategori, dompet'),
  ('Kepala Divisi', 'Mengelola event dan izin divisinya'),
  ('Sekretaris Divisi', 'Administrasi divisi'),
  ('Anggota', 'Akses dasar anggota')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM role r WHERE r.name = v.name);

-- 3. Permission per role. Sama persis dengan 20261105120000, ditambah
--    finance.* untuk Bendahara Wilayah (setara seed role "Bendahara").
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r CROSS JOIN permission p
WHERE r.name = 'Koordinator Wilayah' AND p.code IN ('events.view', 'events.view_all', 'events.create', 'events.edit', 'events.delete', 'attendance.approve', 'attendance.approve_own', 'attendance.submit', 'permission.submit', 'permission.categories.manage', 'divisions.view', 'users.view', 'announcement.create', 'letters.view', 'letters.manage', 'violations.view', 'violations.manage', 'invitations.view', 'invitations.manage', 'recruitment.manage', 'view.activity')
  AND NOT EXISTS (SELECT 1 FROM role_permission rp WHERE rp.role_id = r.id AND rp.permission_id = p.id);
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r CROSS JOIN permission p
WHERE r.name = 'Wakil Koordinator Wilayah' AND p.code IN ('events.view', 'events.view_all', 'events.create', 'events.edit', 'attendance.approve', 'attendance.approve_own', 'attendance.submit', 'permission.submit', 'divisions.view', 'users.view', 'announcement.create', 'letters.view', 'violations.view', 'invitations.view', 'invitations.manage')
  AND NOT EXISTS (SELECT 1 FROM role_permission rp WHERE rp.role_id = r.id AND rp.permission_id = p.id);
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r CROSS JOIN permission p
WHERE r.name = 'Sekretaris Wilayah' AND p.code IN ('events.view', 'events.view_all', 'events.create', 'events.edit', 'attendance.submit', 'permission.submit', 'divisions.view', 'users.view', 'users.create', 'users.edit', 'users.import', 'announcement.create', 'letters.view', 'letters.manage', 'violations.view', 'invitations.view', 'invitations.manage')
  AND NOT EXISTS (SELECT 1 FROM role_permission rp WHERE rp.role_id = r.id AND rp.permission_id = p.id);
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r CROSS JOIN permission p
WHERE r.name = 'Bendahara Wilayah' AND (p.code IN ('divisions.view', 'events.view', 'invitations.view') OR p.code LIKE 'finance.%')
  AND NOT EXISTS (SELECT 1 FROM role_permission rp WHERE rp.role_id = r.id AND rp.permission_id = p.id);
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r CROSS JOIN permission p
WHERE r.name = 'Kepala Divisi' AND p.code IN ('events.view', 'events.create', 'events.edit', 'attendance.approve_own', 'attendance.submit', 'permission.submit', 'divisions.view', 'announcement.create', 'invitations.view')
  AND NOT EXISTS (SELECT 1 FROM role_permission rp WHERE rp.role_id = r.id AND rp.permission_id = p.id);
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r CROSS JOIN permission p
WHERE r.name = 'Sekretaris Divisi' AND p.code IN ('events.view', 'events.create', 'events.edit', 'attendance.submit', 'permission.submit', 'divisions.view', 'invitations.view')
  AND NOT EXISTS (SELECT 1 FROM role_permission rp WHERE rp.role_id = r.id AND rp.permission_id = p.id);
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r CROSS JOIN permission p
WHERE r.name = 'Anggota' AND p.code IN ('events.view', 'attendance.submit', 'permission.submit', 'divisions.view', 'invitations.view')
  AND NOT EXISTS (SELECT 1 FROM role_permission rp WHERE rp.role_id = r.id AND rp.permission_id = p.id);

-- +migrate Down
-- Sengaja tidak menghapus apa pun: role/divisi mungkin sudah dipakai user.
SELECT 1;

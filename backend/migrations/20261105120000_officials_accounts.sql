-- +migrate Up
-- Akun pengurus BPW periode 26/27 (sumber: frontend/lib/landing/content.ts).
--
-- Semua akun memakai password awal yang SAMA dan harus diganti pengurus.
-- Hash bcrypt di bawah = hasil auth.HashPassword("changeme123").
-- Role dibuat per JABATAN (bukan per divisi); divisi tetap di kolom division_id.
-- Idempoten: ON CONFLICT / NOT EXISTS, jadi aman dijalankan ulang.

-- 1. Divisi (7) + warna chip kalender.
INSERT INTO division (name, description, color)
SELECT 'Pengurus Harian', 'Divisi Pengurus Harian BPW 26/27', 'division-1'
WHERE NOT EXISTS (SELECT 1 FROM division WHERE name = 'Pengurus Harian');
INSERT INTO division (name, description, color)
SELECT 'PSDM', 'Divisi PSDM BPW 26/27', 'division-2'
WHERE NOT EXISTS (SELECT 1 FROM division WHERE name = 'PSDM');
INSERT INTO division (name, description, color)
SELECT 'Medkominfo', 'Divisi Medkominfo BPW 26/27', 'division-3'
WHERE NOT EXISTS (SELECT 1 FROM division WHERE name = 'Medkominfo');
INSERT INTO division (name, description, color)
SELECT 'IPTEK', 'Divisi IPTEK BPW 26/27', 'division-4'
WHERE NOT EXISTS (SELECT 1 FROM division WHERE name = 'IPTEK');
INSERT INTO division (name, description, color)
SELECT 'KWU', 'Divisi KWU BPW 26/27', 'division-5'
WHERE NOT EXISTS (SELECT 1 FROM division WHERE name = 'KWU');
INSERT INTO division (name, description, color)
SELECT 'PR', 'Divisi PR BPW 26/27', 'division-6'
WHERE NOT EXISTS (SELECT 1 FROM division WHERE name = 'PR');
INSERT INTO division (name, description, color)
SELECT 'Koordinator Daerah', 'Divisi Koordinator Daerah BPW 26/27', 'division-7'
WHERE NOT EXISTS (SELECT 1 FROM division WHERE name = 'Koordinator Daerah');

-- 2. Role per jabatan.
INSERT INTO role (name, description, is_system)
SELECT 'Koordinator Wilayah', 'Memimpin wilayah: melihat semua event, membuat & mengubah event, menyetujui izin', FALSE
WHERE NOT EXISTS (SELECT 1 FROM role WHERE name = 'Koordinator Wilayah');
INSERT INTO role (name, description, is_system)
SELECT 'Wakil Koordinator Wilayah', 'Mendampingi koordinator wilayah', FALSE
WHERE NOT EXISTS (SELECT 1 FROM role WHERE name = 'Wakil Koordinator Wilayah');
INSERT INTO role (name, description, is_system)
SELECT 'Sekretaris Wilayah', 'Administrasi: surat, pengumuman, data anggota', FALSE
WHERE NOT EXISTS (SELECT 1 FROM role WHERE name = 'Sekretaris Wilayah');
INSERT INTO role (name, description, is_system)
SELECT 'Kepala Divisi', 'Mengelola event dan izin divisinya', FALSE
WHERE NOT EXISTS (SELECT 1 FROM role WHERE name = 'Kepala Divisi');
INSERT INTO role (name, description, is_system)
SELECT 'Sekretaris Divisi', 'Administrasi divisi', FALSE
WHERE NOT EXISTS (SELECT 1 FROM role WHERE name = 'Sekretaris Divisi');
INSERT INTO role (name, description, is_system)
SELECT 'Anggota', 'Akses dasar anggota', FALSE
WHERE NOT EXISTS (SELECT 1 FROM role WHERE name = 'Anggota');

-- 3. Permission tiap role.
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r CROSS JOIN permission p
WHERE r.name = 'Koordinator Wilayah' AND p.code IN ('events.view', 'events.view_all', 'events.create', 'events.edit', 'events.delete', 'attendance.approve', 'attendance.approve_own', 'attendance.submit', 'permission.submit', 'permission.categories.manage', 'divisions.view', 'users.view', 'announcement.create', 'letters.view', 'letters.manage', 'violations.view', 'violations.manage', 'invitations.view', 'invitations.manage', 'recruitment.manage', 'view.activity')
  AND NOT EXISTS (
    SELECT 1 FROM role_permission rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r CROSS JOIN permission p
WHERE r.name = 'Wakil Koordinator Wilayah' AND p.code IN ('events.view', 'events.view_all', 'events.create', 'events.edit', 'attendance.approve', 'attendance.approve_own', 'attendance.submit', 'permission.submit', 'divisions.view', 'users.view', 'announcement.create', 'letters.view', 'violations.view', 'invitations.view', 'invitations.manage')
  AND NOT EXISTS (
    SELECT 1 FROM role_permission rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r CROSS JOIN permission p
WHERE r.name = 'Sekretaris Wilayah' AND p.code IN ('events.view', 'events.view_all', 'events.create', 'events.edit', 'attendance.submit', 'permission.submit', 'divisions.view', 'users.view', 'users.create', 'users.edit', 'users.import', 'announcement.create', 'letters.view', 'letters.manage', 'violations.view', 'invitations.view', 'invitations.manage')
  AND NOT EXISTS (
    SELECT 1 FROM role_permission rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r CROSS JOIN permission p
WHERE r.name = 'Kepala Divisi' AND p.code IN ('events.view', 'events.create', 'events.edit', 'attendance.approve_own', 'attendance.submit', 'permission.submit', 'divisions.view', 'announcement.create', 'invitations.view')
  AND NOT EXISTS (
    SELECT 1 FROM role_permission rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r CROSS JOIN permission p
WHERE r.name = 'Sekretaris Divisi' AND p.code IN ('events.view', 'events.create', 'events.edit', 'attendance.submit', 'permission.submit', 'divisions.view', 'invitations.view')
  AND NOT EXISTS (
    SELECT 1 FROM role_permission rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r CROSS JOIN permission p
WHERE r.name = 'Anggota' AND p.code IN ('events.view', 'attendance.submit', 'permission.submit', 'divisions.view', 'invitations.view')
  AND NOT EXISTS (
    SELECT 1 FROM role_permission rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 4. Akun pengurus (57).
--    Password awal: changeme123 (bcrypt cost 10).
--    username = nama di-slug-kan; email = <username>@permikomnasjateng.or.id
--    status 'active' supaya bisa langsung login.

-- Pengurus Harian
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'ghani.al.fatah', 'ghani.al.fatah@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Ghani Al-Fatah', 'Koordinator Wilayah', 'HIMTI UNSIQ',
       (SELECT id FROM division WHERE name = 'Pengurus Harian'),
       (SELECT id FROM role WHERE name = 'Koordinator Wilayah'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'ghani.al.fatah');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'mukhammad.khisanul.labib', 'mukhammad.khisanul.labib@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Mukhammad Khisanul Labib', 'Wakil Koordinator Wilayah', 'HIMATIKA ITSNU Pekalongan',
       (SELECT id FROM division WHERE name = 'Pengurus Harian'),
       (SELECT id FROM role WHERE name = 'Wakil Koordinator Wilayah'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'mukhammad.khisanul.labib');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'arbasya.anandito', 'arbasya.anandito@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Arbasya Anandito', 'Sekretaris Wilayah 1', 'HIMATRIS PNC',
       (SELECT id FROM division WHERE name = 'Pengurus Harian'),
       (SELECT id FROM role WHERE name = 'Sekretaris Wilayah'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'arbasya.anandito');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'dapa', 'dapa@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Dapa', 'Sekretaris Wilayah 2', 'HMPTI Telkom University Purwokerto',
       (SELECT id FROM division WHERE name = 'Pengurus Harian'),
       (SELECT id FROM role WHERE name = 'Sekretaris Wilayah'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'dapa');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'ica.danisa', 'ica.danisa@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Ica Danisa', 'Bendahara Wilayah 1', 'HIMTI UNSIQ',
       (SELECT id FROM division WHERE name = 'Pengurus Harian'),
       (SELECT id FROM role WHERE name = 'Bendahara'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'ica.danisa');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'jamilun.nadif', 'jamilun.nadif@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Jamilun Nadif', 'Bendahara Wilayah 2', 'HIMATEKNO UMPWR',
       (SELECT id FROM division WHERE name = 'Pengurus Harian'),
       (SELECT id FROM role WHERE name = 'Bendahara'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'jamilun.nadif');

-- PSDM
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'seikha.najla', 'seikha.najla@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Seikha Najla', 'Kepala Divisi', 'HIMATEKNO UMPWR',
       (SELECT id FROM division WHERE name = 'PSDM'),
       (SELECT id FROM role WHERE name = 'Kepala Divisi'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'seikha.najla');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'rahmad.aris.setiawan', 'rahmad.aris.setiawan@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Rahmad Aris Setiawan', 'Sekretaris Divisi', 'HMJ-I STT Ronggolawe',
       (SELECT id FROM division WHERE name = 'PSDM'),
       (SELECT id FROM role WHERE name = 'Sekretaris Divisi'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'rahmad.aris.setiawan');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'faizal.abdila', 'faizal.abdila@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Faizal Abdila', 'Anggota Divisi', 'HIMATIF UMNU',
       (SELECT id FROM division WHERE name = 'PSDM'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'faizal.abdila');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'solahudin.al.ayubi', 'solahudin.al.ayubi@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Solahudin Al-Ayubi', 'Anggota Divisi', 'HMPSIF UNISNU',
       (SELECT id FROM division WHERE name = 'PSDM'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'solahudin.al.ayubi');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'apri.milandari.awiyama', 'apri.milandari.awiyama@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Apri Milandari Awiyama', 'Anggota Divisi', 'HIMA TEKOM UHN',
       (SELECT id FROM division WHERE name = 'PSDM'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'apri.milandari.awiyama');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'indra.hermawan', 'indra.hermawan@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Indra Hermawan', 'Anggota Divisi', 'HMIF UPS',
       (SELECT id FROM division WHERE name = 'PSDM'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'indra.hermawan');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'm.mundzir.adil.ardana', 'm.mundzir.adil.ardana@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'M. Mundzir Adil Ardana', 'Anggota Divisi', 'HIMATIF UMNU',
       (SELECT id FROM division WHERE name = 'PSDM'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'm.mundzir.adil.ardana');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'marta.safitri', 'marta.safitri@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Marta Safitri', 'Anggota Divisi', 'HMSE Telkom University Purwokerto',
       (SELECT id FROM division WHERE name = 'PSDM'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'marta.safitri');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'bima.andiansyah', 'bima.andiansyah@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Bima Andiansyah', 'Anggota Divisi', 'UIN Walisongo Semarang',
       (SELECT id FROM division WHERE name = 'PSDM'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'bima.andiansyah');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'fitriadita.hilal.majid', 'fitriadita.hilal.majid@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Fitriadita Hilal Majid', 'Anggota Divisi', 'HIMFORMA UPGRIS',
       (SELECT id FROM division WHERE name = 'PSDM'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'fitriadita.hilal.majid');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'm.rikza.alifika', 'm.rikza.alifika@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'M. Rikza Alifika', 'Anggota Divisi', 'UIN Walisongo Semarang',
       (SELECT id FROM division WHERE name = 'PSDM'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'm.rikza.alifika');

-- Medkominfo
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'm.qistil.mizan', 'm.qistil.mizan@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'M. Qistil Mizan', 'Kepala Divisi', 'HIMATIKA ITSNU Pekalongan',
       (SELECT id FROM division WHERE name = 'Medkominfo'),
       (SELECT id FROM role WHERE name = 'Kepala Divisi'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'm.qistil.mizan');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'anindya.yuna.chamda', 'anindya.yuna.chamda@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Anindya Yuna Chamda', 'Sekretaris Divisi', 'HIMATIKA ITSNU Pekalongan',
       (SELECT id FROM division WHERE name = 'Medkominfo'),
       (SELECT id FROM role WHERE name = 'Sekretaris Divisi'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'anindya.yuna.chamda');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'abdhe.rachmanzah', 'abdhe.rachmanzah@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Abdhe Rachmanzah', 'Anggota Divisi', 'HMTIKA STIMIK Tunas Bangsa Banjarnegara',
       (SELECT id FROM division WHERE name = 'Medkominfo'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'abdhe.rachmanzah');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'muchamad.danang.prastyo', 'muchamad.danang.prastyo@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Muchamad Danang Prastyo', 'Anggota Divisi', 'HIMANIFO UNIMMA',
       (SELECT id FROM division WHERE name = 'Medkominfo'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'muchamad.danang.prastyo');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'dhafin.rifki.bayu.santoso', 'dhafin.rifki.bayu.santoso@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Dhafin Rifki Bayu Santoso', 'Anggota Divisi', 'HMP MIKROPTIK UNS',
       (SELECT id FROM division WHERE name = 'Medkominfo'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'dhafin.rifki.bayu.santoso');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'muhammad.fakih', 'muhammad.fakih@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Muhammad Fakih', 'Anggota Divisi', 'HIMATIF UMPKU',
       (SELECT id FROM division WHERE name = 'Medkominfo'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'muhammad.fakih');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'didi.purnomo', 'didi.purnomo@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Didi Purnomo', 'Anggota Divisi', 'HMPS Informatika UIN Gusdur',
       (SELECT id FROM division WHERE name = 'Medkominfo'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'didi.purnomo');

-- IPTEK
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'bayu.prasetyo', 'bayu.prasetyo@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Bayu Prasetyo', 'Kepala Divisi', 'HIMATIV UHN',
       (SELECT id FROM division WHERE name = 'IPTEK'),
       (SELECT id FROM role WHERE name = 'Kepala Divisi'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'bayu.prasetyo');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'muhammad.alvin.hidayat', 'muhammad.alvin.hidayat@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Muhammad Alvin Hidayat', 'Sekretaris Divisi', 'GENETIKA POLSA',
       (SELECT id FROM division WHERE name = 'IPTEK'),
       (SELECT id FROM role WHERE name = 'Sekretaris Divisi'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'muhammad.alvin.hidayat');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'roya.firman.gani', 'roya.firman.gani@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Roya Firman Gani', 'Anggota Divisi', 'GENETIKA POLSA',
       (SELECT id FROM division WHERE name = 'IPTEK'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'roya.firman.gani');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'nanda.bagus.priambodo', 'nanda.bagus.priambodo@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Nanda Bagus Priambodo', 'Anggota Divisi', 'HMPTI Telkom University Purwokerto',
       (SELECT id FROM division WHERE name = 'IPTEK'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'nanda.bagus.priambodo');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'afif.abdurrohman.assidiq', 'afif.abdurrohman.assidiq@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Afif Abdurrohman Assidiq', 'Anggota Divisi', 'HIMAFOR UNIMUS',
       (SELECT id FROM division WHERE name = 'IPTEK'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'afif.abdurrohman.assidiq');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'lilis.nuraeni', 'lilis.nuraeni@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Lilis Nuraeni', 'Anggota Divisi', 'HIMA TI UNW',
       (SELECT id FROM division WHERE name = 'IPTEK'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'lilis.nuraeni');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'farel.adi.nugraha.prastya', 'farel.adi.nugraha.prastya@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Farel Adi Nugraha Prastya', 'Anggota Divisi', 'HM-TIF UNISSULA',
       (SELECT id FROM division WHERE name = 'IPTEK'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'farel.adi.nugraha.prastya');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'radita.putri.nuraini', 'radita.putri.nuraini@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Radita Putri Nuraini', 'Anggota Divisi', 'HMSE Telkom University Purwokerto',
       (SELECT id FROM division WHERE name = 'IPTEK'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'radita.putri.nuraini');

-- KWU
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'alhambra.fernando', 'alhambra.fernando@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Alhambra Fernando', 'Kepala Divisi', 'HIMATEKNO UMPWR',
       (SELECT id FROM division WHERE name = 'KWU'),
       (SELECT id FROM role WHERE name = 'Kepala Divisi'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'alhambra.fernando');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'quratu.ayun.defaren', 'quratu.ayun.defaren@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Quratu Ayun Defaren', 'Sekretaris Divisi', 'HMSE Telkom University Purwokerto',
       (SELECT id FROM division WHERE name = 'KWU'),
       (SELECT id FROM role WHERE name = 'Sekretaris Divisi'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'quratu.ayun.defaren');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'aprilia.sahara', 'aprilia.sahara@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Aprilia Sahara', 'Anggota Divisi', 'HIMATIKA ITSNU Pekalongan',
       (SELECT id FROM division WHERE name = 'KWU'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'aprilia.sahara');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'damanik.yohanes.geovan.ondova', 'damanik.yohanes.geovan.ondova@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Damanik, Yohanes Geovan Ondova', 'Anggota Divisi', 'HMPTI Telkom University Purwokerto',
       (SELECT id FROM division WHERE name = 'KWU'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'damanik.yohanes.geovan.ondova');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'rachmat.hermansyah', 'rachmat.hermansyah@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Rachmat Hermansyah', 'Anggota Divisi', 'HIMAFORTIC UNUGHA',
       (SELECT id FROM division WHERE name = 'KWU'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'rachmat.hermansyah');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'muchamad.fatchur.rachman', 'muchamad.fatchur.rachman@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Muchamad Fatchur Rachman', 'Anggota Divisi', 'HIMATIF UMPKU',
       (SELECT id FROM division WHERE name = 'KWU'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'muchamad.fatchur.rachman');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'herlina.zahra.nurhalisa', 'herlina.zahra.nurhalisa@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Herlina Zahra Nurhalisa', 'Anggota Divisi', 'HMJTI Unwahas',
       (SELECT id FROM division WHERE name = 'KWU'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'herlina.zahra.nurhalisa');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'luriyanti.novika.purnama.sari', 'luriyanti.novika.purnama.sari@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Luriyanti Novika Purnama Sari', 'Anggota Divisi', 'HIMFORMA UPGRIS',
       (SELECT id FROM division WHERE name = 'KWU'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'luriyanti.novika.purnama.sari');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'refian.nazar.malik', 'refian.nazar.malik@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Refian Nazar Malik', 'Anggota Divisi', 'HMTIKA STIMIK Tunas Bangsa Banjarnegara',
       (SELECT id FROM division WHERE name = 'KWU'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'refian.nazar.malik');

-- PR
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'afifatul.khusna', 'afifatul.khusna@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Afifatul Khusna', 'Kepala Divisi', 'HM-TIF UNISSULA',
       (SELECT id FROM division WHERE name = 'PR'),
       (SELECT id FROM role WHERE name = 'Kepala Divisi'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'afifatul.khusna');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'khadijah.nur.fatonah', 'khadijah.nur.fatonah@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Khadijah Nur Fatonah', 'Sekretaris Divisi', 'HIMA TI UNW',
       (SELECT id FROM division WHERE name = 'PR'),
       (SELECT id FROM role WHERE name = 'Sekretaris Divisi'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'khadijah.nur.fatonah');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'm.risqi.agung.pratama', 'm.risqi.agung.pratama@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'M. Risqi Agung Pratama', 'Anggota Divisi', 'HMPS Informatika UIN Gusdur',
       (SELECT id FROM division WHERE name = 'PR'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'm.risqi.agung.pratama');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'bisma.wahyu.eka.pratama', 'bisma.wahyu.eka.pratama@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Bisma Wahyu Eka Pratama', 'Anggota Divisi', 'HMJ-I STT Ronggolawe',
       (SELECT id FROM division WHERE name = 'PR'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'bisma.wahyu.eka.pratama');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'ahmad.dani.ajibal', 'ahmad.dani.ajibal@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Ahmad Dani Ajibal', 'Anggota Divisi', 'HIMTI UNSIQ',
       (SELECT id FROM division WHERE name = 'PR'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'ahmad.dani.ajibal');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'haydar.azka', 'haydar.azka@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Haydar Azka', 'Anggota Divisi', 'HIMATIF UMNU',
       (SELECT id FROM division WHERE name = 'PR'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'haydar.azka');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'durrotul.hidayatul.muna', 'durrotul.hidayatul.muna@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Durrotul Hidayatul Muna', 'Anggota Divisi', 'HMJTI Unwahas',
       (SELECT id FROM division WHERE name = 'PR'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'durrotul.hidayatul.muna');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'nuril.anwar', 'nuril.anwar@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Nuril Anwar', 'Anggota Divisi', 'HIMAFOR UNIMUS',
       (SELECT id FROM division WHERE name = 'PR'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'nuril.anwar');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'sintia.nur.mala.dewi', 'sintia.nur.mala.dewi@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Sintia Nur Mala Dewi', 'Anggota Divisi', 'HMPSIF UNISNU',
       (SELECT id FROM division WHERE name = 'PR'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'sintia.nur.mala.dewi');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'm.dzaky.harpy.pratama', 'm.dzaky.harpy.pratama@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'M. Dzaky Harpy Pratama', 'Anggota Divisi', 'UIN Walisongo Semarang',
       (SELECT id FROM division WHERE name = 'PR'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'm.dzaky.harpy.pratama');

-- Koordinator Daerah
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'achmad.fikr.mujahid', 'achmad.fikr.mujahid@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Achmad Fikr Mujahid', 'Koordinator Daerah 1', 'HIMATIV UHN',
       (SELECT id FROM division WHERE name = 'Koordinator Daerah'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'achmad.fikr.mujahid');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'cikal.chrestella.cora', 'cikal.chrestella.cora@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Cikal Chrestella Cora', 'Koordinator Daerah 2', 'HMSE Telkom University Purwokerto',
       (SELECT id FROM division WHERE name = 'Koordinator Daerah'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'cikal.chrestella.cora');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'nabilla.ananta', 'nabilla.ananta@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Nabilla Ananta', 'Koordinator Daerah 3', 'HIMFORMA UPGRIS',
       (SELECT id FROM division WHERE name = 'Koordinator Daerah'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'nabilla.ananta');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'riska.damayanti', 'riska.damayanti@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Riska Damayanti', 'Koordinator Daerah 4', 'HMTIKA STIMIK Tunas Bangsa Banjarnegara',
       (SELECT id FROM division WHERE name = 'Koordinator Daerah'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'riska.damayanti');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'arsya.fitrotul.firdaus', 'arsya.fitrotul.firdaus@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Arsya Fitrotul Firdaus', 'Koordinator Daerah 5', 'HIMA Pro TI Universitas Muria Kudus',
       (SELECT id FROM division WHERE name = 'Koordinator Daerah'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'arsya.fitrotul.firdaus');
INSERT INTO "user" (username, email, password_hash, full_name, jabatan, asal_himpunan, division_id, role_id, status)
SELECT 'galang.nur.seto', 'galang.nur.seto@permikomnasjateng.or.id', '$2a$10$CDVQuUteOWr5trF4isTYYesLrn/fNDDXrJi1tPhK5mNYCDAypOiNK', 'Galang Nur Seto', 'Koordinator Daerah 6', 'HMP MIKROPTIK UNS',
       (SELECT id FROM division WHERE name = 'Koordinator Daerah'),
       (SELECT id FROM role WHERE name = 'Anggota'),
       'active'
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'galang.nur.seto');

-- +migrate Down
-- Hapus akun pengurus + role + divisi yang dibuat migrasi ini.
DELETE FROM "user" WHERE email LIKE '%@permikomnasjateng.or.id';
DELETE FROM role_permission WHERE role_id IN (SELECT id FROM role WHERE name = 'Koordinator Wilayah');
DELETE FROM role WHERE name = 'Koordinator Wilayah';
DELETE FROM role_permission WHERE role_id IN (SELECT id FROM role WHERE name = 'Wakil Koordinator Wilayah');
DELETE FROM role WHERE name = 'Wakil Koordinator Wilayah';
DELETE FROM role_permission WHERE role_id IN (SELECT id FROM role WHERE name = 'Sekretaris Wilayah');
DELETE FROM role WHERE name = 'Sekretaris Wilayah';
DELETE FROM role_permission WHERE role_id IN (SELECT id FROM role WHERE name = 'Kepala Divisi');
DELETE FROM role WHERE name = 'Kepala Divisi';
DELETE FROM role_permission WHERE role_id IN (SELECT id FROM role WHERE name = 'Sekretaris Divisi');
DELETE FROM role WHERE name = 'Sekretaris Divisi';
DELETE FROM role_permission WHERE role_id IN (SELECT id FROM role WHERE name = 'Anggota');
DELETE FROM role WHERE name = 'Anggota';
DELETE FROM division WHERE name IN (SELECT DISTINCT name FROM (VALUES ('Pengurus Harian'), ('PSDM'), ('Medkominfo'), ('IPTEK'), ('KWU'), ('PR'), ('Koordinator Daerah')) AS t(name));

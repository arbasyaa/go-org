-- +migrate Up
-- Himpunan anggota + program kerja (dikelola admin) dan toggle section landing page.
CREATE TABLE IF NOT EXISTS himpunan (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    short_label VARCHAR(60) NOT NULL DEFAULT '',
    institution VARCHAR(200) NOT NULL DEFAULT '',
    city VARCHAR(100) NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    email VARCHAR(150) NOT NULL DEFAULT '',
    logo_url VARCHAR(512) NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_himpunan_active_sort ON himpunan(is_active, sort_order);

CREATE TABLE IF NOT EXISTS work_program (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    cadence VARCHAR(50) NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_program_active_sort ON work_program(is_active, sort_order);

-- JSON object string: key section -> bool. Kosong / key hilang = tampil.
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS landing_sections TEXT NOT NULL DEFAULT '';

INSERT INTO permission (code, module, description, created_at, updated_at) VALUES
('himpunan.manage', 'himpunan', 'Mengelola himpunan anggota', NOW(), NOW()),
('work_program.manage', 'work_program', 'Mengelola program kerja', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.is_system = TRUE
  AND p.code IN ('himpunan.manage', 'work_program.manage')
ON CONFLICT DO NOTHING;

-- Seed data (hanya bila tabel masih kosong, agar idempotent dan tidak menimpa edit admin).
INSERT INTO himpunan (name, short_label, institution, city, address, email, logo_url, is_active, sort_order, created_at, updated_at)
SELECT * FROM (VALUES
('HIMA ILKOM UNNES', '', 'Universitas Negeri Semarang', 'Semarang', 'Gd. PKM FMIPA UNNES Kampus Sekaran, Semarang 50229', 'himailkomunnes@gmail.com', '/assets/himpunan/01.webp', TRUE, 1, NOW(), NOW()),
('HMTI UDINUS', '', 'Universitas Dian Nuswantoro', 'Semarang', 'Gedung D Lantai 1 Universitas Dian Nuswantoro, Jalan Nakula 1 No. 5-11, Semarang', 'hmti.udinus@gmail.com', '/assets/himpunan/02.webp', TRUE, 2, NOW(), NOW()),
('HMDTI', 'HMDTI UDINUS', 'Universitas Dian Nuswantoro', 'Semarang', 'Gedung D.4.18 Universitas Dian Nuswantoro, Jalan Nakula 1 No. 5-11, Semarang', 'hmdti.dinus@gmail.com', '/assets/himpunan/03.webp', TRUE, 3, NOW(), NOW()),
('HMJTI', 'HMJTI UNWAHAS', 'Universitas Wahid Hasyim', 'Semarang', 'Jl. Gunungpati Raya No. 15, Nongkosawit, Kec. Gn. Pati, Kota Semarang, Jawa Tengah 50224', '', '/assets/himpunan/04.webp', TRUE, 4, NOW(), NOW()),
('HIMA TI UNW', '', 'Universitas Ngudi Waluyo', 'Ungaran', 'Gedung Graha Kridha Cendekia Universitas Ngudi Waluyo, Jl. Diponegoro No. 186, Mijen, Gedanganak, Kec. Ungaran Timur, Semarang 50512', 'himati.unw@gmail.com', '/assets/himpunan/05.webp', TRUE, 5, NOW(), NOW()),
('HIMFORMA UPGRIS', '', 'Universitas PGRI Semarang', 'Semarang', 'Gedung PKM Lt. 1, Jalan Lontar No. 1, Sidodadi Timur, Semarang', 'himainformatika@upgris.ac.id', '/assets/himpunan/06.webp', TRUE, 6, NOW(), NOW()),
('HM-TIF UNISSULA', '', 'Universitas Sultan Agung', 'Semarang', 'Gedung FTI UNISSULA, Jl. Raya Kaligawe, Terboyo Kulon, Kec. Genuk, Kota Semarang, Jawa Tengah 50112', 'hmj.informatika@unissula.ac.id', '/assets/himpunan/07.webp', TRUE, 7, NOW(), NOW()),
('HMPS-TI UNISBANK', '', 'Universitas Stikubank Semarang', 'Semarang', 'Jalan Kendeng V, Bendan Ngisor, Semarang, UNISBANK Kampus Kendeng', 'hmpsti.unisbanksmg@gmail.com', '/assets/himpunan/08.webp', TRUE, 8, NOW(), NOW()),
('HMIF UNDIP', '', 'Universitas Diponegoro', 'Semarang', 'Gedung E Lantai 3, Kampus FSM UNDIP, Jalan Prof. Soedarto, S.H., Tembalang, Semarang 50275', 'hm@if.undip.ac.id', '/assets/himpunan/09.webp', TRUE, 9, NOW(), NOW()),
('HIMASKOM UNDIP', '', 'Universitas Diponegoro', 'Semarang', 'Ruang D301, Lt. 3 Gedung Kuliah Bersama, Jl. Prof. Soedarto, Universitas Diponegoro, Semarang', 'himaskom@himaskom.undip.ac.id', '/assets/himpunan/10.webp', TRUE, 10, NOW(), NOW()),
('HIMAFOR UNIMUS', '', 'Universitas Muhammadiyah Semarang', 'Semarang', 'Jalan Kedungmundu No. 18, Kedungmundu, Kec. Tembalang, Kota Semarang', 'himafor21@gmail.com', '/assets/himpunan/11.webp', TRUE, 11, NOW(), NOW()),
('HIMATIF UMS', '', 'Universitas Muhammadiyah Surakarta', 'Surakarta', 'Gedung J Lantai 3 Sayap Utara FIKOM Universitas Muhammadiyah Surakarta, Surakarta', 'himatif@ums.ac.id', '/assets/himpunan/12.webp', TRUE, 12, NOW(), NOW()),
('HIMASTER UNS', '', 'Universitas Sebelas Maret', 'Surakarta', 'Gedung A, Lt. 1 FMIPA UNS, Jalan Ir. Sutami 36 A Kentingan, Surakarta 57126', 'himaster.mipa@gmail.com', '/assets/himpunan/13.webp', TRUE, 13, NOW(), NOW()),
('MIKROPTIK UNS', '', 'Universitas Sebelas Maret', 'Surakarta', 'Jalan Ahmad Yani No. 200, Pabelan, Kartasura', 'mikroptik@fkip.uns.ac.id', '/assets/himpunan/14.webp', TRUE, 14, NOW(), NOW()),
('EMAILKOMP UNS', '', 'Universitas Sebelas Maret', 'Surakarta', 'Gedung A, Lt. 1 FMIPA UNS, Jalan Ir. Sutami 36 A Kentingan, Surakarta 57126', 'emailkomp.mipa@uns.ac.id', '/assets/himpunan/15.webp', TRUE, 15, NOW(), NOW()),
('HMP S1 TI UKSW', '', 'Universitas Kristen Satya Wacana', 'Salatiga', 'FTI Universitas Kristen Satya Wacana, Blotongan, Salatiga 50715', 'fti.hmp.s1.ti@adm.uksw.edu', '/assets/himpunan/16.webp', TRUE, 16, NOW(), NOW()),
('HIMAPRO-TI UMK', '', 'Universitas Muria Kudus', 'Kudus', 'Gedung I Lantai 1 UMK, Jalan Gondang Manis, PO BOX 53, Bae, Kudus', 'himapro-ti@umk.ac.id', '/assets/himpunan/17.webp', TRUE, 17, NOW(), NOW()),
('HMPSIF UNISNU', '', 'Universitas Islam Nahdlatul Ulama', 'Jepara', 'UNISNU, Jalan Taman Siswa (Pekeng), Tahunan, Jepara', 'hmpsif@unisnu.ac.id', '/assets/himpunan/18.webp', TRUE, 18, NOW(), NOW()),
('HIMTI UNSIQ', '', 'Universitas Sains Al-Qur''an Wonosobo', 'Wonosobo', 'Lantai Dasar Gedung FASTIKOM, UNSIQ, Wonosobo', 'himtifastikom@gmail.com', '/assets/himpunan/19.webp', TRUE, 19, NOW(), NOW()),
('HMIF UNSOED', '', 'Universitas Jenderal Soedirman', 'Purbalingga', 'Gedung UKM Kampus FT UNSOED, Jalan Mayjend Soengkono Km. 5, Blater, Purbalingga', 'soedirmatif@gmail.com', '/assets/himpunan/20.webp', TRUE, 20, NOW(), NOW()),
('HMTI UMP', '', 'Universitas Muhammadiyah Purwokerto', 'Purwokerto', 'Mabes HMPS FTS UMP, Kampus 1, Jalan Raya Dukuhwaluh, Purwokerto 53182, Jawa Tengah', 'hmti@ump.ac.id', '/assets/himpunan/21.webp', TRUE, 21, NOW(), NOW()),
('HMIF', 'HMIF TELKOM PWT', 'Telkom University Purwokerto', 'Purwokerto', 'Jalan D.I. Panjaitan No. 123, Purwokerto, Jawa Tengah', 'hmif@ittelkom-pwt.ac.id', '/assets/himpunan/22.webp', TRUE, 22, NOW(), NOW()),
('HIMATEKNO UMPR', '', 'Universitas Muhammadiyah Purworejo', 'Purworejo', '', 'himatekno@gmail.com', '/assets/himpunan/23.webp', TRUE, 23, NOW(), NOW()),
('HMJ TI UINWS', '', 'Universitas Islam Negeri Walisongo Semarang', 'Semarang', 'Jalan Ngepos 3, RT/RW 01/01, Kel. Jerakah, Tugu, Semarang, Jawa Tengah', 'uinws.ti@gmail.com', '/assets/himpunan/24.webp', TRUE, 24, NOW(), NOW()),
('HIMANIFO UNIMMA', '', 'Universitas Muhammadiyah Magelang', 'Magelang', 'Kampus 2 UMM, Jalan Mayjend Bambang Soegeng Km. 5, Mertoyudan, Magelang', 'himanifoummgl@gmail.com', '/assets/himpunan/25.webp', TRUE, 25, NOW(), NOW()),
('GENETIKA', 'GENETIKA POLSA', 'Politeknik Sawunggalih Aji', 'Purworejo', 'Jalan Wismo Aji No. 8, Kutoarjo, Purworejo, Jawa Tengah 54251', '', '/assets/himpunan/26.webp', TRUE, 26, NOW(), NOW()),
('HMTI UMUS BREBES', '', 'Universitas Muhadi Setiabudi Brebes', 'Brebes', 'Jalan Pangeran Diponegoro Km. 2, Pesantunan, Wanasari, Brebes, Jawa Tengah 52221', 'umus.hmti@gmail.com', '/assets/himpunan/27.webp', TRUE, 27, NOW(), NOW()),
('HMTI UNISS', '', 'Universitas Slamet Sri', 'Batang', 'Jalan Raya Candi, Gondangsari, Clapar, Subah, Batang, Jawa Tengah 51262', '', '', TRUE, 28, NOW(), NOW()),
('HMTK PHB Tegal', '', 'Politeknik Harapan Bersama Tegal', 'Tegal', 'Jalan Mataram No. 9 (Belakang Terminal), Pesurungan Lor, Kota Tegal', 'himaprodikomputer@gmail.com', '/assets/himpunan/29.webp', TRUE, 29, NOW(), NOW()),
('HMTI PHB Tegal', '', 'Politeknik Harapan Bersama Tegal', 'Tegal', 'Jalan Dewi Sartika No. 71, Pesurungan Kidul, Kec. Tegal Barat, Kota Tegal', 'hmpinformatika@gmail.com', '/assets/himpunan/30.webp', TRUE, 30, NOW(), NOW()),
('HIMATRIS PNC', '', 'Politeknik Negeri Cilacap', 'Cilacap', 'Jalan Dokter Soetomo No. 1, Karangcengis, Sidakaya, Cilacap Selatan, Cilacap, Jawa Tengah 53212', 'himatris@pnc.ac.id', '/assets/himpunan/31.webp', TRUE, 31, NOW(), NOW()),
('HMTI SCU', '', 'Universitas Katolik Soegijapranata Semarang', 'Semarang', 'Jalan Pawiyatan Luhur IV/1, Bendan Duwur, Gajahmungkur, Semarang, Jawa Tengah 50234', 'hmti@unika.ac.id', '/assets/himpunan/32.webp', TRUE, 32, NOW(), NOW()),
('HIMATIF Universitas Sahid Surakarta', 'HIMATIF USS', 'Universitas Sahid Surakarta', 'Surakarta', 'Jalan Adi Sucipto No. 54, Jajar, Surakarta', 'himatifuss@gmail.com', '/assets/himpunan/33.webp', TRUE, 33, NOW(), NOW()),
('HMPTI Universitas Duta Bangsa Surakarta', 'HMPTI UDB', 'Universitas Duta Bangsa Surakarta', 'Surakarta', 'Jalan Bhayangkara No. 55-57, Surakarta', 'hmpti@fikom.udb.ac.id', '/assets/himpunan/34.webp', TRUE, 34, NOW(), NOW()),
('HIMTI BIPA', '', 'STMIK Bina Patria Magelang', 'Magelang', 'Jalan Raden Saleh No. 2, Potrobangsan, Magelang Utara, Kota Magelang, Jawa Tengah', 'himtibipaa@gmail.com', '/assets/himpunan/35.webp', TRUE, 35, NOW(), NOW()),
('HIMAFORTIC UNUGHA', '', 'Universitas Nahdlatul Ulama Al Ghazali Cilacap', 'Cilacap', 'Jalan Kemerdekaan Barat No. 17, Gligir, Kesugihan Kidul, Kesugihan, Cilacap, Jawa Tengah', 'himafortic@unugha.id', '/assets/himpunan/36.webp', TRUE, 36, NOW(), NOW()),
('HIMATIF UMNU Kebumen', '', 'Universitas Ma''arif Nahdlatul Ulama Kebumen', 'Kebumen', 'Kampus Pusat UMNU Kebumen, Jl. Kusuma No. 75, Wonoyoso, Bumirejo, Kebumen, Jawa Tengah', 'himatifumnukebumen@gmail.com', '/assets/himpunan/37.webp', TRUE, 37, NOW(), NOW()),
('HMSE IT Telkom', '', 'Telkom University Purwokerto', 'Purwokerto', 'Jalan D.I. Panjaitan No. 128, Purwokerto, Jawa Tengah', 'hmse@ittelkom-pwt.ac.id', '/assets/himpunan/38.webp', TRUE, 38, NOW(), NOW()),
('HMP', 'HMP UBY', 'Universitas Boyolali', 'Boyolali', 'Jalan Pandanaran 405, Boyolali, Jawa Tengah', 'himatek@gmail.com', '/assets/himpunan/39.webp', TRUE, 39, NOW(), NOW()),
('HMPI', 'HMPI PERADABAN', 'Universitas Peradaban', 'Brebes', 'Jalan Raya Pagojengan Km. 03, Paguyangan, Brebes, Jawa Tengah 52276', '', '/assets/himpunan/40.webp', TRUE, 40, NOW(), NOW()),
('HMJ-I', 'HMJ-I STT RONGGOLAWE', 'STT Ronggolawe', 'Blora', 'Jalan Kampus Ronggolawe No. 1, Blok B Mentul, Cepu, Blora, Jawa Tengah', 'informatikasttr@gmail.com', '/assets/himpunan/41.webp', TRUE, 41, NOW(), NOW()),
('HMPS Informatika', 'HMPS IF UIN SAIZU', 'UIN Saizu Purwokerto', 'Purwokerto', 'Jl. A. Yani No. 40A, Karanganjing, Purwanegara, Kec. Purwokerto Utara, Kabupaten Banyumas, Jawa Tengah 53126', 'hmpsinformatikauinsaizu@gmail.com', '/assets/himpunan/42.webp', TRUE, 42, NOW(), NOW()),
('HIMATIKA', 'HIMATIKA ITSNU', 'ITSNU Pekalongan', 'Pekalongan', 'Jl. Karangdowo No. 9, Kemoren, Karangdowo, Kec. Kedungwuni, Kabupaten Pekalongan, Jawa Tengah 51173', 'himatikaitsnupkl@gmail.com', '/assets/himpunan/43.webp', TRUE, 43, NOW(), NOW()),
('HIMTIF', 'HIMTIF UNISS', 'Universitas Slamet Sri', 'Kendal', 'Jl. Raya Soekarno-Hatta Km. 03, Gondoarum, Jambearum, Kec. Patebon, Kabupaten Kendal, Jawa Tengah', 'hmjti001@gmail.com', '/assets/himpunan/44.webp', TRUE, 44, NOW(), NOW()),
('HMPS Informatika', 'HMPS IF AMIKOM PWT', 'Universitas Amikom Purwokerto', 'Purwokerto', 'Jl. Letjend. Pol. Soemarto, Watumas, Purwokerto', 'hmps_if@amikompurwokerto.ac.id', '/assets/himpunan/45.webp', TRUE, 45, NOW(), NOW())
) AS seed(name, short_label, institution, city, address, email, logo_url, is_active, sort_order, created_at, updated_at)
WHERE NOT EXISTS (SELECT 1 FROM himpunan);

INSERT INTO work_program (name, description, cadence, is_active, sort_order, created_at, updated_at)
SELECT * FROM (VALUES
('Kongres Wilayah', 'Musyawarah tertinggi antar-himpunan: evaluasi periode, arah gerakan, dan pemilihan Badan Pengurus Wilayah.', 'Tahunan', TRUE, 1, NOW(), NOW()),
('Seminar dan Kajian Teknologi', 'Pembicara dari industri dan akademisi membahas tren teknologi terkini untuk mahasiswa seluruh Jawa Tengah.', 'Semesteran', TRUE, 2, NOW(), NOW()),
('Kompetisi Antar-Kampus', 'Panggung lomba pemrograman, keamanan, dan inovasi digital yang mempertemukan talenta dari tiap himpunan anggota.', 'Tahunan', TRUE, 3, NOW(), NOW()),
('Pelatihan dan Sertifikasi', 'Kelas intensif dan program sertifikasi bersama mitra untuk memperkuat kesiapan kerja anggota.', 'Berkelanjutan', TRUE, 4, NOW(), NOW()),
('Kolaborasi Riset', 'Wadah kolaborasi riset dan pengabdian antar-himpunan lintas kampus dalam satu wilayah.', 'Per periode', TRUE, 5, NOW(), NOW())
) AS seed(name, description, cadence, is_active, sort_order, created_at, updated_at)
WHERE NOT EXISTS (SELECT 1 FROM work_program);

-- +migrate Down
DELETE FROM role_permission
WHERE permission_id IN (SELECT id FROM permission WHERE code IN ('himpunan.manage', 'work_program.manage'));
DELETE FROM permission WHERE code IN ('himpunan.manage', 'work_program.manage');
ALTER TABLE organization_settings DROP COLUMN IF EXISTS landing_sections;
DROP TABLE IF EXISTS work_program;
DROP TABLE IF EXISTS himpunan;

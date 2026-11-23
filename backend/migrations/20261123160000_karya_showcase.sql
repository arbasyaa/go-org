-- +migrate Up
-- Karya: showcase repositori anggota. Pengajuan tanpa login, dikurasi admin.
-- Desain: docs/superpowers/specs/2026-11-23-karya-showcase-design.md
CREATE TABLE IF NOT EXISTS karya (
    id BIGSERIAL PRIMARY KEY,
    -- ID pelacakan untuk pengirim tanpa akun, mis. KRY-7F3K9Q. Bukan nomor urut
    -- supaya status kiriman lain tidak bisa ditebak.
    code VARCHAR(16) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    author_name VARCHAR(150) NOT NULL,
    -- RESTRICT: karya tidak boleh kehilangan atribusi gara-gara himpunan dihapus.
    himpunan_id BIGINT NOT NULL REFERENCES himpunan(id) ON DELETE RESTRICT,
    repo_url VARCHAR(512) NOT NULL,
    -- Markdown mentah dari pengirim. HTML-nya dirender saat dibaca, tidak
    -- disimpan, supaya tidak ada dua sumber yang bisa berbeda.
    about_md TEXT NOT NULL DEFAULT '',
    image_url VARCHAR(512) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'review',
    review_note VARCHAR(500) NOT NULL DEFAULT '',
    published_at TIMESTAMPTZ,
    like_count INTEGER NOT NULL DEFAULT 0,
    -- Persetujuan S&K. Versi ikut disimpan supaya tahu teks mana yang disetujui.
    terms_version VARCHAR(20) NOT NULL DEFAULT '',
    terms_accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dipakai daftar publik dan pemilihan karya unggulan (like terbanyak dulu).
CREATE INDEX IF NOT EXISTS idx_karya_public ON karya(status, like_count DESC, id);
CREATE INDEX IF NOT EXISTS idx_karya_himpunan ON karya(himpunan_id);

CREATE TABLE IF NOT EXISTS karya_like (
    id BIGSERIAL PRIMARY KEY,
    karya_id BIGINT NOT NULL REFERENCES karya(id) ON DELETE CASCADE,
    -- sha256(id pengunjung ‖ ip). Hanya untuk deduplikasi; tidak pernah
    -- ditampilkan atau dikirim balik ke klien.
    visitor_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (karya_id, visitor_hash)
);

INSERT INTO permission (code, module, description, created_at, updated_at) VALUES
('karya.manage', 'karya', 'Mengurasi karya: menyetujui, menolak, menghapus', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Role Admin (system) memegang seluruh permission; role lain tidak diberi otomatis.
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.is_system = TRUE
  AND p.code = 'karya.manage'
ON CONFLICT DO NOTHING;

-- +migrate Down
DELETE FROM role_permission
WHERE permission_id IN (SELECT id FROM permission WHERE code = 'karya.manage');
DELETE FROM permission WHERE code = 'karya.manage';
DROP TABLE IF EXISTS karya_like;
DROP TABLE IF EXISTS karya;
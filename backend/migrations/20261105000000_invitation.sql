-- +migrate Up
-- Undangan masuk dari himpunan lain (form publik /undangan) + daftar penugasan
-- siapa yang berangkat. Satu undangan boleh dikonversi menjadi satu Event.
CREATE TABLE IF NOT EXISTS invitation (
    id BIGSERIAL PRIMARY KEY,
    organization_name VARCHAR(150) NOT NULL,
    event_name VARCHAR(200) NOT NULL,
    event_date DATE NOT NULL,
    attachment_url VARCHAR(512) NOT NULL DEFAULT '',
    attachment_name VARCHAR(255) NOT NULL DEFAULT '',
    attachment_size BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'submitted',
    -- NULL = belum dikonversi. ON DELETE SET NULL: menghapus Event tidak boleh
    -- menghapus riwayat undangannya (dan kolomnya harus nullable di model).
    event_id BIGINT REFERENCES event(id) ON DELETE SET NULL,
    submitted_ip VARCHAR(45) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitation_event_id ON invitation(event_id);
CREATE INDEX IF NOT EXISTS idx_invitation_status ON invitation(status);

CREATE TABLE IF NOT EXISTS invitation_assignee (
    id BIGSERIAL PRIMARY KEY,
    invitation_id BIGINT NOT NULL REFERENCES invitation(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    -- NULL = user mendaftarkan dirinya sendiri (self-assign anggota).
    assigned_by_id BIGINT REFERENCES "user"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Satu user hanya sekali per undangan; mencegah dobel saat tombol diklik ulang.
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitation_assignee_unique
    ON invitation_assignee(invitation_id, user_id);
CREATE INDEX IF NOT EXISTS idx_invitation_assignee_user_id
    ON invitation_assignee(user_id);

-- Permission baru untuk kotak masuk undangan. `invitations.view` membuka daftar
-- (anggota cukup ini untuk assign dirinya sendiri); `invitations.manage`
-- membuka assign orang lain, hapus undangan, dan konversi (plus events.create).
INSERT INTO permission (code, module, description, created_at, updated_at) VALUES
('invitations.view', 'invitations', 'Melihat undangan masuk dan mengunduh lampirannya', NOW(), NOW()),
('invitations.manage', 'invitations', 'Menugaskan peserta lain, menghapus, dan mengonversi undangan', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Role Admin memegang seluruh permission; role lain tidak diberi otomatis.
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.is_system = TRUE
  AND p.code IN ('invitations.view', 'invitations.manage')
ON CONFLICT DO NOTHING;

-- +migrate Down
DELETE FROM role_permission
WHERE permission_id IN (SELECT id FROM permission WHERE code LIKE 'invitations.%');
DELETE FROM permission WHERE code LIKE 'invitations.%';
DROP TABLE IF EXISTS invitation_assignee;
DROP TABLE IF EXISTS invitation;

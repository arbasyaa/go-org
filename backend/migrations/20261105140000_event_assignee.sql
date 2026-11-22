-- +migrate Up
-- Penugasan peserta pindah dari undangan ke event.
--
-- Alasan: yang menentukan "siapa yang berangkat" adalah eventnya, bukan surat
-- undangannya. Dengan begitu daftar peserta tampil di detail event dan tetap
-- berlaku walau undangan dihapus.
CREATE TABLE IF NOT EXISTS event_assignee (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES event(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    -- NULL = user mendaftarkan dirinya sendiri (self-assign anggota).
    assigned_by_id BIGINT REFERENCES "user"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Satu user hanya sekali per event; mencegah dobel saat tombol diklik ulang.
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_assignee_unique
    ON event_assignee(event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_event_assignee_user_id
    ON event_assignee(user_id);

-- Tabel lama dihapus: penugasan per undangan tidak dipakai lagi. Datanya
-- dipindahkan dulu ke event hasil konversi supaya tidak ada yang hilang
-- (saat migrasi ini dibuat tabelnya kosong, tapi tetap aman untuk server lain).
INSERT INTO event_assignee (event_id, user_id, assigned_by_id, created_at, updated_at)
SELECT i.event_id, a.user_id, a.assigned_by_id, a.created_at, a.updated_at
FROM invitation_assignee a
JOIN invitation i ON i.id = a.invitation_id
WHERE i.event_id IS NOT NULL
ON CONFLICT DO NOTHING;

DROP TABLE IF EXISTS invitation_assignee;

-- +migrate Down
CREATE TABLE IF NOT EXISTS invitation_assignee (
    id BIGSERIAL PRIMARY KEY,
    invitation_id BIGINT NOT NULL REFERENCES invitation(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    assigned_by_id BIGINT REFERENCES "user"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invitation_assignee_unique
    ON invitation_assignee(invitation_id, user_id);

INSERT INTO invitation_assignee (invitation_id, user_id, assigned_by_id, created_at, updated_at)
SELECT i.id, a.user_id, a.assigned_by_id, a.created_at, a.updated_at
FROM event_assignee a
JOIN invitation i ON i.event_id = a.event_id
ON CONFLICT DO NOTHING;

DROP TABLE IF EXISTS event_assignee;

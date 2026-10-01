-- +migrate Up
ALTER TABLE event
    ADD COLUMN IF NOT EXISTS link_url VARCHAR(500) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS audience VARCHAR(20) NOT NULL DEFAULT 'custom';

CREATE TABLE IF NOT EXISTS event_target_division (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES event(id) ON DELETE CASCADE,
    division_id BIGINT NOT NULL REFERENCES division(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_target_role (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES event(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Satu divisi/role hanya boleh muncul sekali per event.
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_target_division_unique
    ON event_target_division(event_id, division_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_target_role_unique
    ON event_target_role(event_id, role_id);

-- Resolusi audience memfilter user per kolom ini (lihat EventService.AudienceUserIDs).
CREATE INDEX IF NOT EXISTS idx_event_target_division_division_id ON event_target_division(division_id);
CREATE INDEX IF NOT EXISTS idx_event_target_role_role_id ON event_target_role(role_id);

-- Backfill event lama supaya cakupannya tidak berubah. Event dengan division_id
-- NULL dulu berarti "General" (semua divisi) -> audience 'all'.
UPDATE event SET audience = 'all' WHERE division_id IS NULL;

INSERT INTO event_target_division (event_id, division_id)
SELECT id, division_id FROM event
WHERE division_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM event_target_division t WHERE t.event_id = event.id
  );

-- +migrate Down
DROP TABLE IF EXISTS event_target_role;
DROP TABLE IF EXISTS event_target_division;
ALTER TABLE event DROP COLUMN IF EXISTS audience;
ALTER TABLE event DROP COLUMN IF EXISTS link_url;

-- +migrate Up
-- activity_log.user_id dibuat NOT NULL + ON DELETE SET NULL (tidak kompatibel):
-- hapus user gagal men-null-kan log, dan backup lama bisa berisi user_id yatim
-- yang menggagalkan restore (SQLSTATE 23503 activity_log_user_id_fkey).
ALTER TABLE activity_log ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_user_id_fkey;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE SET NULL;

-- +migrate Down
DELETE FROM activity_log WHERE user_id IS NULL;
ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_user_id_fkey;
ALTER TABLE activity_log ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE SET NULL;

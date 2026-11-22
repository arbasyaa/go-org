-- +migrate Up
-- Event hasil konversi undangan hanya punya TANGGAL (tanpa jam), karena form
-- publiknya cuma meminta tanggal berlangsung. Tanpa penanda ini, UI menampilkan
-- jam 07.00 (tengah malam UTC yang bergeser ke WIB) dan tanggal selesai
-- melompat ke hari berikutnya.
ALTER TABLE event ADD COLUMN IF NOT EXISTS all_day BOOLEAN NOT NULL DEFAULT FALSE;

-- Event lama hasil konversi undangan: ditandai all_day dan diselaraskan ke
-- tengah malam WIB, supaya tanggalnya tidak lagi bergeser.
UPDATE event e
SET all_day = TRUE,
    start_time = ((e.start_time AT TIME ZONE 'UTC')::date)::timestamp AT TIME ZONE 'Asia/Jakarta',
    end_time = (((e.start_time AT TIME ZONE 'UTC')::date)::timestamp + interval '1 day' - interval '1 second') AT TIME ZONE 'Asia/Jakarta'
WHERE EXISTS (SELECT 1 FROM invitation i WHERE i.event_id = e.id);

-- +migrate Down
ALTER TABLE event DROP COLUMN IF EXISTS all_day;

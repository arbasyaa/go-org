-- +migrate Up
-- Jabatan (Kepala/Sekretaris/Anggota Divisi) dan asal himpunan tidak punya kolom
-- di skema awal; keduanya dipakai impor data anggota BPW.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS jabatan varchar(100) NOT NULL DEFAULT '';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS asal_himpunan varchar(150) NOT NULL DEFAULT '';

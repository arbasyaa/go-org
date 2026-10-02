package services

import (
	"context"
	"os"
	"strings"
	"testing"

	"backend/models"

	"github.com/lrndwy/gokil/orm"
)

// Ganti nama role adalah jalur tulis pertama selain matrix permission. Guard
// nama kosong/duplikat + 404 di sini yang mencegah rename diam-diam gagal
// (dulu body map bebas juga bisa menulis kolom is_system).
func TestUpdateRoleRename(t *testing.T) {
	if os.Getenv("BACKUP_RESTORE_INTEGRATION") != "1" {
		t.Skip("set BACKUP_RESTORE_INTEGRATION=1 and GOKIL_DB_DSN to run (writes to DB)")
	}
	dsn := os.Getenv("GOKIL_DB_DSN")
	if dsn == "" {
		t.Skip("GOKIL_DB_DSN is empty")
	}
	db, err := orm.Connect("postgres", dsn, 2, 1)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()
	ctx := orm.WithDB(context.Background(), db)

	a, err := orm.Create(ctx, &models.Role{Name: "Uji Rename A", Description: "awal"})
	if err != nil {
		t.Fatalf("create role a: %v", err)
	}
	defer orm.DeleteByID[models.Role](ctx, a.ID)

	b, err := orm.Create(ctx, &models.Role{Name: "Uji Rename B"})
	if err != nil {
		t.Fatalf("create role b: %v", err)
	}
	defer orm.DeleteByID[models.Role](ctx, b.ID)

	updated, err := (RoleService{}).Update(ctx, a.ID, "Uji Rename A2", "diubah")
	if err != nil {
		t.Fatalf("rename harus berhasil: %v", err)
	}
	if updated.Name != "Uji Rename A2" || updated.Description != "diubah" {
		t.Fatalf("hasil rename salah: %+v", updated)
	}
	if updated.IsSystem {
		t.Fatal("rename tidak boleh ikut mengubah is_system")
	}

	if _, err := (RoleService{}).Update(ctx, a.ID, "  ", "x"); err == nil ||
		!strings.Contains(err.Error(), "wajib diisi") {
		t.Fatalf("nama kosong harus ditolak, got %v", err)
	}
	if _, err := (RoleService{}).Update(ctx, a.ID, "Uji Rename B", "x"); err == nil ||
		!strings.Contains(err.Error(), "sudah dipakai") {
		t.Fatalf("nama duplikat harus ditolak, got %v", err)
	}
	if _, err := (RoleService{}).Update(ctx, 0, "Uji Rename C", "x"); err != ErrNotFound {
		t.Fatalf("role tidak ada harus ErrNotFound, got %v", err)
	}
}
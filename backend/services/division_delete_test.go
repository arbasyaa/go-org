package services

import (
	"context"
	"os"
	"strings"
	"testing"

	"backend/models"

	"github.com/lrndwy/gokil/orm"
)

// Guard hapus divisi harus menolak divisi yang masih dipakai anggota: tanpa ini
// FK user_division_id_fkey melempar SQLSTATE 23503 dan route mengembalikan 500
// tanpa sebab yang bisa dibaca admin.
func TestDeleteDivisionBlockedByMembers(t *testing.T) {
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

	division, err := orm.Create(ctx, &models.Division{Name: "Uji Hapus", Description: "test"})
	if err != nil {
		t.Fatalf("create division: %v", err)
	}
	defer orm.DeleteByID[models.Division](ctx, division.ID)

	role, err := orm.Create(ctx, &models.Role{Name: "Uji Hapus Role"})
	if err != nil {
		t.Fatalf("create role: %v", err)
	}
	defer orm.DeleteByID[models.Role](ctx, role.ID)

	user, err := orm.Create(ctx, &models.User{
		Username: "uji.hapus.divisi", Email: "uji.hapus@test.local",
		FullName: "Uji Hapus", DivisionID: division.ID, RoleID: role.ID, Status: "active",
	})
	if err != nil {
		t.Fatalf("create user: %v", err)
	}
	defer orm.DeleteByID[models.User](ctx, user.ID)

	err = (DivisionService{}).Delete(ctx, division.ID)
	if err == nil {
		t.Fatal("divisi yang masih punya anggota harus ditolak")
	}
	if !strings.Contains(err.Error(), "masih dipakai oleh 1 anggota") {
		t.Fatalf("pesan harus menyebut jumlah anggota, got %q", err.Error())
	}
	// FK error mentah tidak boleh bocor ke admin.
	if strings.Contains(err.Error(), "SQLSTATE") {
		t.Fatalf("pesan tidak boleh menampilkan error SQL mentah: %q", err.Error())
	}

	// Setelah anggotanya keluar, divisi boleh dihapus.
	if err := (UserService{}).Delete(ctx, user.ID); err != nil {
		t.Fatalf("delete user: %v", err)
	}
	if err := (DivisionService{}).Delete(ctx, division.ID); err != nil {
		t.Fatalf("divisi tanpa anggota harus bisa dihapus: %v", err)
	}
}

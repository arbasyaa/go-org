package services

import (
	"context"
	"os"
	"testing"

	"backend/models"

	"github.com/lrndwy/gokil/orm"
)

// ListActive membaca pengurus dari tabel user, jadi menonaktifkan / menghapus
// akun harus langsung menghilangkan orang itu dari landing page. Jabatan diambil
// dari nama role (kolom `jabatan` sudah dihapus), dan role sistem (Admin) tidak
// dianggap pengurus.
func TestOfficialListActiveFromUsers(t *testing.T) {
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

	division, err := orm.Create(ctx, &models.Division{Name: "Uji Pengurus", Description: "test"})
	if err != nil {
		t.Fatalf("create division: %v", err)
	}
	defer orm.DeleteByID[models.Division](ctx, division.ID)

	role, err := orm.Create(ctx, &models.Role{Name: "Uji Pengurus Role"})
	if err != nil {
		t.Fatalf("create role: %v", err)
	}
	defer orm.DeleteByID[models.Role](ctx, role.ID)

	mkUser := func(suffix string, divID, roleID int64) *models.User {
		t.Helper()
		u, err := orm.Create(ctx, &models.User{
			Username: "uji.pengurus." + suffix, Email: "uji.pengurus." + suffix + "@test.local",
			FullName: "Uji " + suffix, AsalHimpunan: "HIMTI UNSIQ",
			DivisionID: divID, RoleID: roleID, Status: "active",
		})
		if err != nil {
			t.Fatalf("create user %s: %v", suffix, err)
		}
		t.Cleanup(func() { orm.DeleteByID[models.User](ctx, u.ID) })
		return u
	}

	systemRole, err := orm.Create(ctx, &models.Role{Name: "Uji Sistem Role", IsSystem: true})
	if err != nil {
		t.Fatalf("create system role: %v", err)
	}
	defer orm.DeleteByID[models.Role](ctx, systemRole.ID)

	pengurus := mkUser("pengurus", division.ID, role.ID)
	inactive := mkUser("nonaktif", division.ID, role.ID)
	if _, err := orm.UpdateByID[models.User](ctx, inactive.ID, map[string]any{"status": "deleted"}); err != nil {
		t.Fatalf("soft delete: %v", err)
	}
	akunSistem := mkUser("sistem", division.ID, systemRole.ID)

	find := func(list []OfficialView, id int64) *OfficialView {
		for i := range list {
			if list[i].ID == id {
				return &list[i]
			}
		}
		return nil
	}

	list, err := OfficialService{}.ListActive(ctx)
	if err != nil {
		t.Fatalf("ListActive: %v", err)
	}

	got := find(list, pengurus.ID)
	if got == nil {
		t.Fatal("pengurus aktif harus muncul di landing")
	}
	if got.Name != pengurus.FullName || got.Role != role.Name ||
		got.Origin != pengurus.AsalHimpunan || got.Division != division.Name {
		t.Errorf("field tidak terpetakan: %+v", got)
	}
	if find(list, inactive.ID) != nil {
		t.Error("user nonaktif masih muncul di landing")
	}
	if find(list, akunSistem.ID) != nil {
		t.Error("pemegang role sistem tidak boleh dianggap pengurus")
	}
}

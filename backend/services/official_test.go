package services

import (
	"context"
	"os"
	"testing"

	"backend/models"

	"github.com/lrndwy/gokil/orm"
)

// ListActive membaca pengurus dari tabel user, jadi menonaktifkan / menghapus
// akun harus langsung menghilangkan orang itu dari landing page.
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

	mkUser := func(suffix, jabatan string, divID int64) *models.User {
		t.Helper()
		u, err := orm.Create(ctx, &models.User{
			Username: "uji.pengurus." + suffix, Email: "uji.pengurus." + suffix + "@test.local",
			FullName: "Uji " + suffix, Jabatan: jabatan, AsalHimpunan: "HIMTI UNSIQ",
			DivisionID: divID, RoleID: role.ID, Status: "active",
		})
		if err != nil {
			t.Fatalf("create user %s: %v", suffix, err)
		}
		t.Cleanup(func() { orm.DeleteByID[models.User](ctx, u.ID) })
		return u
	}

	pengurus := mkUser("pengurus", "Kepala Divisi", division.ID)
	inactive := mkUser("nonaktif", "Anggota Divisi", division.ID)
	if _, err := orm.UpdateByID[models.User](ctx, inactive.ID, map[string]any{"status": "deleted"}); err != nil {
		t.Fatalf("soft delete: %v", err)
	}
	noJabatan := mkUser("tanpajabatan", "", division.ID)

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
	if got.Name != pengurus.FullName || got.Role != pengurus.Jabatan ||
		got.Origin != pengurus.AsalHimpunan || got.Division != division.Name {
		t.Errorf("field tidak terpetakan: %+v", got)
	}
	if find(list, inactive.ID) != nil {
		t.Error("user nonaktif masih muncul di landing")
	}
	if find(list, noJabatan.ID) != nil {
		t.Error("user tanpa jabatan tidak boleh dianggap pengurus")
	}
}

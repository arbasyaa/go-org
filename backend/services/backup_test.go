package services

import (
	"context"
	"encoding/json"
	"os"
	"strings"
	"testing"

	"github.com/lrndwy/gokil/orm"
)

func TestTruncateBackupTablesSQL(t *testing.T) {
	sql := truncateBackupTablesSQL()
	if !strings.HasPrefix(sql, "TRUNCATE ") {
		t.Fatalf("expected TRUNCATE prefix, got %q", sql)
	}
	if !strings.HasSuffix(sql, " CASCADE") {
		t.Fatalf("expected CASCADE suffix, got %q", sql)
	}
	if !strings.Contains(sql, `"user"`) {
		t.Fatalf("user table must be quoted, got %q", sql)
	}
	if strings.Contains(sql, "db_version") || strings.Contains(sql, "gokil_db_versions") {
		t.Fatalf("must not truncate migration tracking tables, got %q", sql)
	}
	for _, tbl := range backupTables {
		quoted := quoteIdent(tbl.Table)
		if !strings.Contains(sql, quoted) {
			t.Fatalf("missing table %s in %q", quoted, sql)
		}
	}
}

func TestRowInt64(t *testing.T) {
	t.Parallel()
	cases := []struct {
		name string
		row  map[string]any
		want int64
		ok   bool
	}{
		{"float64", map[string]any{"id": float64(7)}, 7, true},
		{"int64", map[string]any{"id": int64(3)}, 3, true},
		{"string", map[string]any{"id": "12"}, 12, true},
		{"json.Number", map[string]any{"id": json.Number("4")}, 4, true},
		{"zero", map[string]any{"id": float64(0)}, 0, false},
		{"nil", map[string]any{"id": nil}, 0, false},
		{"missing", map[string]any{}, 0, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, ok := rowInt64(tc.row, "id")
			if ok != tc.ok || got != tc.want {
				t.Fatalf("rowInt64 = (%d, %v), want (%d, %v)", got, ok, tc.want, tc.ok)
			}
		})
	}
}

func TestShouldSkipActivityLog(t *testing.T) {
	t.Parallel()
	users := collectRowIDs([]map[string]any{
		{"id": float64(1)},
		{"id": "2"},
	})
	if len(users) != 2 {
		t.Fatalf("collectRowIDs = %d, want 2", len(users))
	}

	cases := []struct {
		name string
		row  map[string]any
		skip bool
	}{
		{"user ada", map[string]any{"user_id": float64(1)}, false},
		{"user string ada", map[string]any{"user_id": "2"}, false},
		{"user yatim", map[string]any{"user_id": float64(99)}, true},
		{"user_id 0", map[string]any{"user_id": float64(0)}, true},
		{"user_id null", map[string]any{"user_id": nil}, false},
		{"tanpa user_id", map[string]any{"id": float64(1)}, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := shouldSkipActivityLog(tc.row, users); got != tc.skip {
				t.Fatalf("shouldSkipActivityLog = %v, want %v", got, tc.skip)
			}
		})
	}
}

func TestRestoreJSONPermissionCodeConflict(t *testing.T) {
	if os.Getenv("BACKUP_RESTORE_INTEGRATION") != "1" {
		t.Skip("set BACKUP_RESTORE_INTEGRATION=1 and GOKIL_DB_DSN to run (wipes backup tables)")
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

	if _, err := db.ExecContext(ctx,
		`INSERT INTO "permission" (id, code, module, description) VALUES (1, 'settings.manage', 'settings', 'seed')`); err != nil {
		t.Fatalf("seed conflicting permission: %v", err)
	}

	payload := map[string]json.RawMessage{
		"permissions": json.RawMessage(`[
			{"id": 5, "code": "settings.manage", "module": "settings", "description": "from backup"}
		]`),
	}
	stats, err := BackupService{}.RestoreJSON(ctx, payload)
	if err != nil {
		t.Fatalf("RestoreJSON: %v", err)
	}
	if stats["permissions"] != 1 {
		t.Fatalf("stats permissions = %d, want 1", stats["permissions"])
	}

	var id int64
	var code, desc string
	if err := db.QueryRowContext(ctx,
		`SELECT id, code, description FROM "permission" WHERE code = 'settings.manage'`).
		Scan(&id, &code, &desc); err != nil {
		t.Fatalf("query restored permission: %v", err)
	}
	if id != 5 {
		t.Fatalf("id = %d, want 5 (seed id=1 must be replaced)", id)
	}
	if desc != "from backup" {
		t.Fatalf("description = %q, want from backup", desc)
	}

	var n int
	if err := db.QueryRowContext(ctx, `SELECT COUNT(*) FROM "permission"`).Scan(&n); err != nil {
		t.Fatal(err)
	}
	if n != 1 {
		t.Fatalf("permission count = %d, want 1", n)
	}
}

func TestRestoreJSONOrphanActivityLogs(t *testing.T) {
	if os.Getenv("BACKUP_RESTORE_INTEGRATION") != "1" {
		t.Skip("set BACKUP_RESTORE_INTEGRATION=1 and GOKIL_DB_DSN to run (wipes backup tables)")
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

	payload := map[string]json.RawMessage{
		"roles": json.RawMessage(`[
			{"id": 1, "name": "Admin", "description": "", "is_system": true}
		]`),
		"divisions": json.RawMessage(`[
			{"id": 1, "name": "Umum", "description": ""}
		]`),
		"users": json.RawMessage(`[
			{"id": 1, "username": "admin", "email": "admin@example.com", "password_hash": "x",
			 "full_name": "Admin", "hometown": "", "phone": "", "avatar_url": "",
			 "division_id": 1, "role_id": 1, "status": "active"}
		]`),
		"activity_logs": json.RawMessage(`[
			{"id": 10, "user_id": 1, "action": "login", "resource_type": "auth", "resource_id": 1,
			 "description": "masuk", "ip_address": ""},
			{"id": 11, "user_id": 99, "action": "delete", "resource_type": "user", "resource_id": 99,
			 "description": "user sudah dihapus", "ip_address": ""}
		]`),
	}
	stats, err := BackupService{}.RestoreJSON(ctx, payload)
	if err != nil {
		t.Fatalf("RestoreJSON: %v", err)
	}
	if stats["users"] != 1 {
		t.Fatalf("stats users = %d, want 1", stats["users"])
	}
	if stats["activity_logs"] != 1 {
		t.Fatalf("stats activity_logs = %d, want 1 (orphan user_id=99 skipped)", stats["activity_logs"])
	}

	var n int
	if err := db.QueryRowContext(ctx, `SELECT COUNT(*) FROM activity_log`).Scan(&n); err != nil {
		t.Fatal(err)
	}
	if n != 1 {
		t.Fatalf("activity_log count = %d, want 1", n)
	}
	var userID int64
	if err := db.QueryRowContext(ctx, `SELECT user_id FROM activity_log WHERE id = 10`).Scan(&userID); err != nil {
		t.Fatal(err)
	}
	if userID != 1 {
		t.Fatalf("kept log user_id = %d, want 1", userID)
	}
}

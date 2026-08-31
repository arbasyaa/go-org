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

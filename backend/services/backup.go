package services

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/lrndwy/gokil/orm"
)

type BackupService struct{}

// backupTables memetakan key JSON di data.json ke nama tabel Postgres,
// terurut aman terhadap foreign key (parent lebih dulu).
var backupTables = []struct {
	Key   string
	Table string
}{
	{"permissions", "permission"},
	{"roles", "role"},
	{"role_permissions", "role_permission"},
	{"divisions", "division"},
	{"organization_settings", "organization_settings"},
	{"users", "user"},
	{"events", "event"},
	{"attendances", "attendance"},
	{"permission_requests", "permission_request"},
	{"violation_types", "violation_type"},
	{"violations", "violation"},
	{"recruitments", "recruitment"},
	{"recruitment_target_divisions", "recruitment_target_division"},
	{"recruitment_custom_fields", "recruitment_custom_field"},
	{"recruitment_submissions", "recruitment_submission"},
	{"letter_categories", "letter_category"},
	{"letter_templates", "letter_template"},
	{"letters", "letter"},
	{"announcements", "announcement"},
	{"announcement_attachments", "announcement_attachment"},
	{"finance_categories", "finance_category"},
	{"wallets", "wallet"},
	{"finance_transactions", "finance_transaction"},
	{"push_subscriptions", "push_subscription"},
	{"storage_folders", "storage_folder"},
	{"storage_files", "storage_file"},
	{"activity_logs", "activity_log"},
}

var identRe = regexp.MustCompile(`^[a-z_][a-z0-9_]*$`)

func quoteIdent(name string) string {
	return `"` + name + `"`
}

func truncateBackupTablesSQL() string {
	names := make([]string, len(backupTables))
	for i, t := range backupTables {
		names[i] = quoteIdent(t.Table)
	}
	return "TRUNCATE " + joinComma(names) + " CASCADE"
}

// ExportJSON membaca seluruh isi tabel via SELECT * sehingga semua kolom
// (termasuk password_hash yang di-hide dari JSON model) ikut ter-backup.
func (BackupService) ExportJSON(ctx context.Context) (map[string]any, error) {
	db := orm.DBFromContext(ctx)
	if db == nil {
		return nil, fmt.Errorf("no database in context")
	}
	payload := map[string]any{}
	for _, t := range backupTables {
		rows, err := db.QueryContext(ctx, fmt.Sprintf("SELECT * FROM %s ORDER BY id", quoteIdent(t.Table)))
		if err != nil {
			return nil, fmt.Errorf("%s: %w", t.Table, err)
		}
		cols, err := rows.Columns()
		if err != nil {
			rows.Close()
			return nil, fmt.Errorf("%s: %w", t.Table, err)
		}
		items := []map[string]any{}
		for rows.Next() {
			values := make([]any, len(cols))
			ptrs := make([]any, len(cols))
			for i := range values {
				ptrs[i] = &values[i]
			}
			if err := rows.Scan(ptrs...); err != nil {
				rows.Close()
				return nil, fmt.Errorf("%s: %w", t.Table, err)
			}
			row := map[string]any{}
			for i, col := range cols {
				switch v := values[i].(type) {
				case []byte:
					row[col] = string(v)
				default:
					row[col] = v
				}
			}
			items = append(items, row)
		}
		if err := rows.Err(); err != nil {
			rows.Close()
			return nil, fmt.Errorf("%s: %w", t.Table, err)
		}
		rows.Close()
		payload[t.Key] = items
	}
	return payload, nil
}

// CollectFileRefs memindai payload export dan mengembalikan pasangan
// key storage → URL untuk setiap kolom URL file (avatar, banner, selfie,
// lampiran, dsb.), apa pun provider storage-nya (lokal maupun S3/MinIO).
func (BackupService) CollectFileRefs(payload map[string]any) map[string]string {
	refs := map[string]string{}
	for _, tableData := range payload {
		rows, ok := tableData.([]map[string]any)
		if !ok {
			continue
		}
		for _, row := range rows {
			for col, val := range row {
				if col != "url" && !strings.HasSuffix(col, "_url") {
					continue
				}
				s, ok := val.(string)
				if !ok || s == "" || strings.HasPrefix(s, "data:") {
					continue
				}
				if key := StorageKeyFromURL(s); key != "" {
					refs[key] = s
				}
			}
		}
	}
	return refs
}

// StorageKeyFromURL menurunkan key storage dari URL yang tersimpan di DB.
// Format URL: "<base_url>/<key>" (local/S3 dengan base URL), "/storage/<key>"
// (local tanpa base URL), atau "https://<bucket>.s3.amazonaws.com/<key>".
func StorageKeyFromURL(url string) string {
	if base := strings.TrimSuffix(os.Getenv("GOKIL_STORAGE_BASE_URL"), "/"); base != "" {
		if strings.HasPrefix(url, base+"/") {
			return sanitizeStorageKey(strings.TrimPrefix(url, base+"/"))
		}
	}
	if strings.HasPrefix(url, "/storage/") {
		return sanitizeStorageKey(strings.TrimPrefix(url, "/storage/"))
	}
	if strings.HasPrefix(url, "http://") || strings.HasPrefix(url, "https://") {
		rest := url[strings.Index(url, "://")+3:]
		if slash := strings.Index(rest, "/"); slash >= 0 {
			path := rest[slash+1:]
			// Buang segmen bucket bila URL berbentuk <host>/<bucket>/<key>.
			if bucket := os.Getenv("GOKIL_STORAGE_BUCKET"); bucket != "" {
				path = strings.TrimPrefix(path, bucket+"/")
			}
			return sanitizeStorageKey(path)
		}
	}
	return ""
}

func sanitizeStorageKey(key string) string {
	key = strings.TrimPrefix(key, "/")
	if key == "" || strings.Contains(key, "..") {
		return ""
	}
	if i := strings.IndexAny(key, "?#"); i >= 0 {
		key = key[:i]
	}
	return key
}

// RestoreJSON mengganti seluruh isi tabel backup dengan data ZIP (TRUNCATE
// lalu INSERT) dalam satu transaksi, lalu menyinkronkan sequence tiap tabel
// agar insert berikutnya tidak bentrok dengan ID hasil restore.
func (BackupService) RestoreJSON(ctx context.Context, payload map[string]json.RawMessage) (map[string]int, error) {
	stats := map[string]int{}
	err := orm.WithTx(ctx, func(txCtx context.Context, tx *orm.Tx) error {
		if _, err := tx.ExecContext(txCtx, truncateBackupTablesSQL()); err != nil {
			return fmt.Errorf("truncate: %w", err)
		}
		userIDs := map[int64]struct{}{}
		for _, t := range backupTables {
			raw, ok := payload[t.Key]
			if !ok || len(raw) == 0 || string(raw) == "null" {
				continue
			}
			var items []map[string]any
			if err := json.Unmarshal(raw, &items); err != nil {
				return fmt.Errorf("%s: %w", t.Key, err)
			}
			if t.Table == "user" {
				userIDs = collectRowIDs(items)
			}
			inserted := 0
			for _, row := range items {
				if t.Table == "activity_log" && shouldSkipActivityLog(row, userIDs) {
					continue
				}
				if err := insertRow(txCtx, tx, t.Table, row); err != nil {
					return fmt.Errorf("%s: %w", t.Key, err)
				}
				inserted++
			}
			if inserted > 0 {
				if err := syncSequence(txCtx, tx, t.Table); err != nil {
					return fmt.Errorf("%s: %w", t.Key, err)
				}
			}
			stats[t.Key] = inserted
		}
		return nil
	})
	if err != nil {
		return stats, err
	}
	return stats, nil
}

// collectRowIDs mengambil id dari baris JSON hasil Unmarshal (angka JSON
// menjadi float64; backup lama bisa menyimpan id sebagai string).
func collectRowIDs(items []map[string]any) map[int64]struct{} {
	ids := make(map[int64]struct{}, len(items))
	for _, row := range items {
		if id, ok := rowInt64(row, "id"); ok && id > 0 {
			ids[id] = struct{}{}
		}
	}
	return ids
}

func rowInt64(row map[string]any, key string) (int64, bool) {
	v, ok := row[key]
	if !ok || v == nil {
		return 0, false
	}
	switch n := v.(type) {
	case int64:
		return n, true
	case int:
		return int64(n), true
	case int32:
		return int64(n), true
	case float64:
		if n != n || n < 1 {
			return 0, false
		}
		return int64(n), true
	case json.Number:
		i, err := n.Int64()
		return i, err == nil && i > 0
	case string:
		i, err := strconv.ParseInt(strings.TrimSpace(n), 10, 64)
		return i, err == nil && i > 0
	default:
		return 0, false
	}
}

// shouldSkipActivityLog menolak baris log yang merujuk user yang tidak ada
// di payload restore. Tanpa ini INSERT kena activity_log_user_id_fkey
// (SQLSTATE 23503) — biasanya sisa user yang sudah dihapus: skema lama
// user_id NOT NULL + ON DELETE SET NULL, jadi DELETE user gagal men-null-kan
// log dan/atau tabel dibuat ORM tanpa FK sehingga orphan tertinggal.
func shouldSkipActivityLog(row map[string]any, userIDs map[int64]struct{}) bool {
	v, ok := row["user_id"]
	if !ok || v == nil {
		return false
	}
	uid, parsed := rowInt64(row, "user_id")
	if !parsed || uid <= 0 {
		return true
	}
	_, exists := userIDs[uid]
	return !exists
}

func insertRow(ctx context.Context, tx *orm.Tx, table string, row map[string]any) error {
	if _, ok := row["id"]; !ok {
		return fmt.Errorf("row tanpa kolom id")
	}
	// Backup lama (berbasis JSON model) tidak menyertakan password_hash.
	if table == "user" {
		if _, ok := row["password_hash"]; !ok {
			row["password_hash"] = ""
		}
	}
	cols := make([]string, 0, len(row))
	for col := range row {
		if !identRe.MatchString(col) {
			return fmt.Errorf("kolom tidak valid: %q", col)
		}
		cols = append(cols, col)
	}
	sort.Strings(cols)

	colNames := make([]string, len(cols))
	placeholders := make([]string, len(cols))
	args := make([]any, len(cols))
	for i, col := range cols {
		colNames[i] = quoteIdent(col)
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = normalizeSQLValue(row[col])
	}

	query := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)",
		quoteIdent(table), joinComma(colNames), joinComma(placeholders))
	_, err := tx.ExecContext(ctx, query, args...)
	return err
}

// normalizeSQLValue menyiapkan nilai hasil json.Unmarshal agar bisa dikirim
// sebagai parameter SQL (objek/array JSON diserialisasi kembali ke string).
func normalizeSQLValue(v any) any {
	switch val := v.(type) {
	case map[string]any, []any:
		raw, err := json.Marshal(val)
		if err != nil {
			return nil
		}
		return string(raw)
	default:
		return v
	}
}

func syncSequence(ctx context.Context, tx *orm.Tx, table string) error {
	var maxID *int64
	if err := tx.QueryRowContext(ctx,
		fmt.Sprintf("SELECT MAX(id) FROM %s", quoteIdent(table))).Scan(&maxID); err != nil {
		return err
	}
	if maxID == nil || *maxID <= 0 {
		return nil
	}
	_, err := tx.ExecContext(ctx,
		"SELECT setval(pg_get_serial_sequence($1, 'id'), $2, true)",
		table, *maxID)
	return err
}

func joinComma(parts []string) string {
	out := ""
	for i, p := range parts {
		if i > 0 {
			out += ", "
		}
		out += p
	}
	return out
}

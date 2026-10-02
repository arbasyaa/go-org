package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"regexp"
	"strings"
	"time"

	"backend/internal/auth"
	"backend/internal/imageutil"
	"backend/internal/letterutil"
	"backend/internal/storageutil"
	"backend/internal/timeutil"
	"backend/models"

	"github.com/lrndwy/gokil/orm"
)

type SettingsService struct{}

func (SettingsService) GetPublic(ctx context.Context) (*models.OrganizationSettings, error) {
	s, err := orm.Objects[models.OrganizationSettings](ctx).First()
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (SettingsService) Get(ctx context.Context) (*models.OrganizationSettings, error) {
	return SettingsService{}.GetPublic(ctx)
}

func (SettingsService) Update(ctx context.Context, values map[string]any, logo, icon multipart.File, logoHdr, iconHdr *multipart.FileHeader) (*models.OrganizationSettings, error) {
	s, err := orm.Objects[models.OrganizationSettings](ctx).First()
	if err != nil {
		return nil, err
	}
	if logo != nil && logoHdr != nil {
		defer logo.Close()
		data, err := io.ReadAll(logo)
		if err != nil {
			return nil, err
		}
		key := storageutil.Key("settings", "logo"+ext(logoHdr.Filename))
		url, err := storageutil.Upload(ctx, key, data, logoHdr.Header.Get("Content-Type"))
		if err != nil {
			return nil, err
		}
		values["logo_url"] = url
	}
	if icon != nil && iconHdr != nil {
		defer icon.Close()
		data, err := io.ReadAll(icon)
		if err != nil {
			return nil, err
		}
		key := storageutil.Key("settings", "icon"+ext(iconHdr.Filename))
		url, err := storageutil.Upload(ctx, key, data, iconHdr.Header.Get("Content-Type"))
		if err != nil {
			return nil, err
		}
		values["icon_url"] = url
	}
	return orm.UpdateByID[models.OrganizationSettings](ctx, s.ID, values)
}

func ext(name string) string {
	if i := strings.LastIndex(name, "."); i >= 0 {
		return name[i:]
	}
	return ""
}

type AuthService struct{}

type LoginResult struct {
	Token string         `json:"token"`
	User  map[string]any `json:"user"`
}

func (AuthService) Login(ctx context.Context, username, password string) (*LoginResult, error) {
	u, err := orm.Objects[models.User](ctx).Filter("username", username).First()
	if err != nil {
		u, err = orm.Objects[models.User](ctx).Filter("email", username).First()
		if err != nil {
			return nil, fmt.Errorf("username atau password salah")
		}
	}
	if u.Status != "active" {
		return nil, fmt.Errorf("akun tidak aktif, hubungi admin")
	}
	if !auth.CheckPassword(u.PasswordHash, password) {
		return nil, fmt.Errorf("username atau password salah")
	}
	token, err := auth.IssueToken(u.ID)
	if err != nil {
		return nil, err
	}
	return &LoginResult{Token: token, User: userPayload(ctx, u)}, nil
}

func userPayload(ctx context.Context, u *models.User) map[string]any {
	out := map[string]any{
		"id": u.ID, "username": u.Username, "email": u.Email,
		"full_name": u.FullName, "avatar_url": u.AvatarURL,
		"division_id": u.DivisionID, "role_id": u.RoleID, "status": u.Status,
		"hometown": u.Hometown, "phone": u.Phone,
		"jabatan": u.Jabatan, "asal_himpunan": u.AsalHimpunan,
	}
	if u.BirthDate != nil {
		out["birth_date"] = u.BirthDate.Format("2006-01-02")
	}
	if role, err := orm.GetByID[models.Role](ctx, u.RoleID); err == nil {
		out["role"] = role.Name
	}
	if div, err := orm.GetByID[models.Division](ctx, u.DivisionID); err == nil {
		out["division"] = div.Name
	}
	return out
}

func (UserService) PublicView(ctx context.Context, u *models.User) map[string]any {
	return userPayload(ctx, u)
}

func (AuthService) Register(ctx context.Context, username, email, password, fullName string, divisionID int64) (*models.User, error) {
	settings, err := orm.Objects[models.OrganizationSettings](ctx).First()
	if err != nil {
		return nil, err
	}
	if !settings.AllowSelfRegister {
		return nil, fmt.Errorf("pendaftaran mandiri dinonaktifkan")
	}
	hash, err := auth.HashPassword(password)
	if err != nil {
		return nil, err
	}
	roles, err := orm.Objects[models.Role](ctx).Filter("is_system", false).All()
	if err != nil || len(roles) == 0 {
		return nil, fmt.Errorf("tidak ada role yang bisa dipakai untuk pendaftaran")
	}
	roleID := roles[0].ID
	for _, r := range roles {
		if r.Name == "Anggota" {
			roleID = r.ID
			break
		}
	}
	return orm.Create(ctx, &models.User{
		Username: username, Email: email, PasswordHash: hash,
		FullName: fullName, DivisionID: divisionID, RoleID: roleID, Status: "active",
	})
}

type UserService struct{}

// AudienceCatalog mengembalikan divisi + role beserta jumlah anggota tiap
// pilihan, dipakai form cakupan event supaya bisa menampilkan
// "Divisi PH (12 anggota)" tanpa hitungan per opsi di frontend.
func (UserService) AudienceCatalog(ctx context.Context) (map[string]any, error) {
	users, err := orm.Objects[models.User](ctx).Filter("status", "active").All()
	if err != nil {
		return nil, err
	}
	divisions, err := orm.Objects[models.Division](ctx).All()
	if err != nil {
		return nil, err
	}
	roles, err := orm.Objects[models.Role](ctx).All()
	if err != nil {
		return nil, err
	}
	divisionCounts := map[int64]int{}
	roleCounts := map[int64]int{}
	for _, u := range users {
		divisionCounts[u.DivisionID]++
		roleCounts[u.RoleID]++
	}
	divisionItems := make([]map[string]any, 0, len(divisions))
	for _, d := range divisions {
		divisionItems = append(divisionItems, map[string]any{
			"id": d.ID, "name": d.Name, "member_count": divisionCounts[d.ID],
		})
	}
	roleItems := make([]map[string]any, 0, len(roles))
	for _, r := range roles {
		roleItems = append(roleItems, map[string]any{
			"id": r.ID, "name": r.Name, "member_count": roleCounts[r.ID],
		})
	}
	return map[string]any{
		"divisions": divisionItems, "roles": roleItems, "member_count": len(users),
	}, nil
}

func (UserService) List(ctx context.Context, status string) ([]*models.User, error) {
	qs := orm.Objects[models.User](ctx)
	if status != "" {
		qs = qs.Filter("status", status)
	}
	return qs.OrderBy("-id").All()
}

func (UserService) ListPublic(ctx context.Context, status string) ([]map[string]any, error) {
	users, err := UserService{}.List(ctx, status)
	if err != nil {
		return nil, err
	}
	return enrichUsers(ctx, users), nil
}

func enrichUsers(ctx context.Context, users []*models.User) []map[string]any {
	divs, _ := orm.Objects[models.Division](ctx).All()
	roles, _ := orm.Objects[models.Role](ctx).All()
	divMap := map[int64]string{}
	for _, d := range divs {
		divMap[d.ID] = d.Name
	}
	roleMap := map[int64]string{}
	for _, r := range roles {
		roleMap[r.ID] = r.Name
	}
	out := make([]map[string]any, len(users))
	for i, u := range users {
		item := map[string]any{
			"id": u.ID, "username": u.Username, "email": u.Email,
			"full_name": u.FullName, "avatar_url": u.AvatarURL,
			"division_id": u.DivisionID, "role_id": u.RoleID, "status": u.Status,
			"created_at": u.CreatedAt, "updated_at": u.UpdatedAt,
			"phone": u.Phone, "hometown": u.Hometown,
			"jabatan": u.Jabatan, "asal_himpunan": u.AsalHimpunan,
		}
		if name, ok := divMap[u.DivisionID]; ok {
			item["division"] = name
		}
		if name, ok := roleMap[u.RoleID]; ok {
			item["role"] = name
		}
		if u.BirthDate != nil {
			item["birth_date"] = u.BirthDate.Format("2006-01-02")
		}
		out[i] = item
	}
	return out
}

func (UserService) Get(ctx context.Context, id int64) (*models.User, error) {
	return orm.GetByID[models.User](ctx, id)
}

func (UserService) Create(ctx context.Context, u *models.User, password string) (*models.User, error) {
	hash, err := auth.HashPassword(password)
	if err != nil {
		return nil, err
	}
	u.PasswordHash = hash
	u.Status = "active"
	return orm.Create(ctx, u)
}

func (UserService) Update(ctx context.Context, id int64, values map[string]any) (*models.User, error) {
	delete(values, "password_hash")
	return orm.UpdateByID[models.User](ctx, id, values)
}

func (UserService) Delete(ctx context.Context, id int64) error {
	_, err := orm.DeleteByID[models.User](ctx, id)
	return err
}

func (UserService) ChangePassword(ctx context.Context, id int64, newPassword string) error {
	hash, err := auth.HashPassword(newPassword)
	if err != nil {
		return err
	}
	_, err = orm.UpdateByID[models.User](ctx, id, map[string]any{"password_hash": hash})
	return err
}

func (UserService) UploadAvatar(ctx context.Context, id int64, file multipart.File, hdr *multipart.FileHeader) (string, error) {
	defer file.Close()
	data, err := io.ReadAll(file)
	if err != nil {
		return "", err
	}
	key := storageutil.Key("avatars", "avatar"+ext(hdr.Filename))
	url, err := storageutil.Upload(ctx, key, data, hdr.Header.Get("Content-Type"))
	if err != nil {
		return "", err
	}
	if _, err := orm.UpdateByID[models.User](ctx, id, map[string]any{"avatar_url": url}); err != nil {
		return "", err
	}
	return url, nil
}

func (UserService) ImportCSV(ctx context.Context, rows []map[string]string) (success int, failures []map[string]string) {
	for _, row := range rows {
		if strings.TrimSpace(row["username"]) == "" && strings.TrimSpace(row["email"]) == "" {
			continue // baris kosong sisa spreadsheet
		}
		divName := row["division"]
		divs, _ := orm.Objects[models.Division](ctx).Filter("name", divName).All()
		if len(divs) == 0 {
			failures = append(failures, map[string]string{"row": row["username"], "error": "divisi tidak ditemukan"})
			continue
		}
		roles, _ := orm.Objects[models.Role](ctx).Filter("name", row["role"]).All()
		if len(roles) == 0 {
			failures = append(failures, map[string]string{"row": row["username"], "error": "role tidak ditemukan"})
			continue
		}
		pwd := row["password"]
		if pwd == "" {
			pwd = "changeme123"
		}
		_, err := UserService{}.Create(ctx, &models.User{
			Username: row["username"], Email: row["email"], FullName: row["full_name"],
			DivisionID: divs[0].ID, RoleID: roles[0].ID, Phone: row["phone"],
			Hometown: row["hometown"], Jabatan: row["jabatan"], AsalHimpunan: row["asal_himpunan"],
		}, pwd)
		if err != nil {
			failures = append(failures, map[string]string{"row": row["username"], "error": err.Error()})
			continue
		}
		success++
	}
	return success, failures
}

type RoleService struct{}

func (RoleService) List(ctx context.Context) ([]*models.Role, error) {
	return orm.Objects[models.Role](ctx).OrderBy("name").All()
}

func (RoleService) ListPublic(ctx context.Context) ([]map[string]any, error) {
	roles, err := RoleService{}.List(ctx)
	if err != nil {
		return nil, err
	}
	users, err := orm.Objects[models.User](ctx).All()
	if err != nil {
		return nil, err
	}
	counts := map[int64]int{}
	for _, u := range users {
		if u.Status == "deleted" {
			continue
		}
		counts[u.RoleID]++
	}
	out := make([]map[string]any, len(roles))
	for i, r := range roles {
		out[i] = map[string]any{
			"id":          r.ID,
			"name":        r.Name,
			"description": r.Description,
			"is_system":   r.IsSystem,
			"created_at":  r.CreatedAt,
			"updated_at":  r.UpdatedAt,
			"user_count":  counts[r.ID],
		}
	}
	return out, nil
}

func (RoleService) Create(ctx context.Context, name, description string) (*models.Role, error) {
	return orm.Create(ctx, &models.Role{Name: name, Description: description})
}

// Update mengganti nama/deskripsi role. Kolom lain (is_system, id) tidak ikut
// bisa ditulis dari sini.
func (RoleService) Update(ctx context.Context, id int64, name, description string) (*models.Role, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, fmt.Errorf("nama role wajib diisi")
	}
	if _, err := orm.GetByID[models.Role](ctx, id); err != nil {
		return nil, ErrNotFound
	}
	same, err := orm.Objects[models.Role](ctx).Filter("name", name).All()
	if err != nil {
		return nil, err
	}
	for _, r := range same {
		if r.ID != id {
			return nil, fmt.Errorf("nama role %q sudah dipakai role lain", name)
		}
	}
	return orm.UpdateByID[models.Role](ctx, id, map[string]any{
		"name": name, "description": description,
	})
}

func (RoleService) Delete(ctx context.Context, id int64) error {
	if _, err := orm.GetByID[models.Role](ctx, id); err != nil {
		return ErrNotFound
	}
	count, err := orm.Objects[models.User](ctx).Filter("role_id", id).Count()
	if err != nil {
		return err
	}
	if count > 0 {
		return fmt.Errorf("role masih digunakan oleh %d anggota", count)
	}
	orm.Objects[models.RolePermission](ctx).Filter("role_id", id).Delete()
	_, err = orm.DeleteByID[models.Role](ctx, id)
	return err
}

func (RoleService) GetPermissions(ctx context.Context, roleID int64) ([]*models.Permission, []int64, error) {
	all, err := orm.Objects[models.Permission](ctx).OrderBy("module", "code").All()
	if err != nil {
		return nil, nil, err
	}
	rps, err := orm.Objects[models.RolePermission](ctx).Filter("role_id", roleID).All()
	if err != nil {
		return nil, nil, err
	}
	assigned := make([]int64, 0, len(rps))
	for _, rp := range rps {
		assigned = append(assigned, rp.PermissionID)
	}
	return all, assigned, nil
}

func (RoleService) ReplacePermissions(ctx context.Context, roleID int64, permissionIDs []int64) error {
	return orm.WithTx(ctx, func(txCtx context.Context, _ *orm.Tx) error {
		_, err := orm.Objects[models.RolePermission](txCtx).Filter("role_id", roleID).Delete()
		if err != nil {
			return err
		}
		for _, pid := range permissionIDs {
			if _, err := orm.Create(txCtx, &models.RolePermission{
				RoleID: roleID, PermissionID: pid,
			}); err != nil {
				return err
			}
		}
		return nil
	})
}

type DivisionService struct{}

func (DivisionService) List(ctx context.Context) ([]*models.Division, error) {
	return orm.Objects[models.Division](ctx).OrderBy("name").All()
}

// divisionColors membatasi warna divisi ke token CSS yang tersedia
// (--division-1..6). Nilai dari DB ikut masuk ke style, jadi input admin tidak
// boleh menyuntik nilai warna sembarang (juga melindungi kontras chip).
var divisionColors = map[string]bool{
	"":           true, // otomatis: dibagi berurutan oleh frontend
	"division-1": true,
	"division-2": true,
	"division-3": true,
	"division-4": true,
	"division-5": true,
	"division-6": true,
	"division-7": true,
	"division-8": true,
}

func (DivisionService) Create(ctx context.Context, name, description, color string) (*models.Division, error) {
	color = strings.TrimSpace(color)
	if !divisionColors[color] {
		return nil, fmt.Errorf("warna divisi tidak dikenal")
	}
	return orm.Create(ctx, &models.Division{Name: name, Description: description, Color: color})
}

func (DivisionService) Update(ctx context.Context, id int64, values map[string]any) (*models.Division, error) {
	if raw, ok := values["color"]; ok {
		color, _ := raw.(string)
		color = strings.TrimSpace(color)
		if !divisionColors[color] {
			return nil, fmt.Errorf("warna divisi tidak dikenal")
		}
		values["color"] = color
	}
	return orm.UpdateByID[models.Division](ctx, id, values)
}

func (DivisionService) Delete(ctx context.Context, id int64) error {
	// Tanpa guard ini, FK user/event/announcement melempar SQLSTATE 23503 yang
	// bocor jadi 500 tanpa sebab yang bisa dibaca admin.
	if _, err := orm.GetByID[models.Division](ctx, id); err != nil {
		return ErrNotFound
	}
	count, err := orm.Objects[models.User](ctx).Filter("division_id", id).Count()
	if err != nil {
		return err
	}
	if count > 0 {
		return fmt.Errorf("divisi masih dipakai oleh %d anggota. Pindahkan atau hapus anggotanya dahulu.", count)
	}
	_, err = orm.DeleteByID[models.Division](ctx, id)
	return err
}

type EventService struct{}

func computeEventStatus(start, end, now time.Time) string {
	if now.Before(start) {
		return "upcoming"
	}
	if now.After(end) {
		return "finished"
	}
	return "ongoing"
}

// endOfDay: event tanpa waktu selesai dianggap berakhir di penghujung hari
// mulainya, supaya status, izin, dan absensi tetap punya batas waktu.
func endOfDay(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), 23, 59, 59, 0, t.Location())
}

func (EventService) syncEventStatus(ctx context.Context, e *models.Event) (*models.Event, error) {
	if e.Status == "cancelled" {
		return e, nil
	}
	next := computeEventStatus(e.StartTime, e.EndTime, time.Now())
	if next == e.Status {
		return e, nil
	}
	return orm.UpdateByID[models.Event](ctx, e.ID, map[string]any{"status": next})
}

// ListVisible mengembalikan event yang cakupannya memuat user. Bukan peserta =
// tidak lihat sama sekali; events.view_all (mis. Kadiv) tetap lihat semua.
//
// Status tidak di-transisi di sini: dulu tiap GET ikut memuat semua event dan
// menulis UPDATE (write di jalur baca, makin berat saat data tumbuh). Cron
// `event_status_transition` (1 menit, run-on-start) yang menanganinya, dan
// GET /events/:id tetap menyinkronkan satu event saja.
func (EventService) ListVisible(ctx context.Context, user *auth.User, canViewAll bool) ([]*models.Event, error) {
	all, err := orm.Objects[models.Event](ctx).OrderBy("-start_time").All()
	if err != nil {
		return nil, err
	}
	if canViewAll {
		return all, nil
	}
	targets, err := loadTargetSets(ctx)
	if err != nil {
		return nil, err
	}
	u, err := orm.GetByID[models.User](ctx, user.ID)
	if err != nil {
		return nil, err
	}
	visible := make([]*models.Event, 0, len(all))
	for _, e := range all {
		if eventIncludesUser(e, targets, u) {
			visible = append(visible, e)
		}
	}
	return visible, nil
}

// eventIncludesUser: pengecekan cakupan dari data yang sudah dimuat, supaya
// daftar event tidak menembak query per event.
func eventIncludesUser(e *models.Event, targets targetSets, u *models.User) bool {
	if e.Audience == "all" {
		return true
	}
	for _, divisionID := range targets.divisions[e.ID] {
		if divisionID == u.DivisionID {
			return true
		}
	}
	for _, roleID := range targets.roles[e.ID] {
		if roleID == u.RoleID {
			return true
		}
	}
	return false
}

func (EventService) Get(ctx context.Context, id int64) (*models.Event, error) {
	e, err := orm.GetByID[models.Event](ctx, id)
	if err != nil {
		return nil, err
	}
	return (EventService{}).syncEventStatus(ctx, e)
}

// GetForUser melengkapi detail event dengan status absensi, status pengajuan
// izin, dan cakupan (peserta + penyelenggara). Non-peserta mendapat
// ErrForbidden supaya tidak bisa mengintip lewat URL — kecuali pembuat event,
// anggota divisi penyelenggara, dan pemegang events.view_all.
func (EventService) GetForUser(ctx context.Context, id int64, user *auth.User, canViewAll bool) (map[string]any, error) {
	e, err := (EventService{}).Get(ctx, id)
	if err != nil {
		return nil, err
	}
	self, err := orm.GetByID[models.User](ctx, user.ID)
	if err != nil {
		return nil, err
	}
	targets, err := loadTargetSets(ctx)
	if err != nil {
		return nil, err
	}
	isParticipant := eventIncludesUser(e, targets, self)
	if !canViewAll && !isParticipant {
		manageable, err := CanManageEvent(ctx, e, user)
		if err != nil {
			return nil, err
		}
		if !manageable {
			return nil, ErrForbidden
		}
	}
	raw, err := json.Marshal(e)
	if err != nil {
		return nil, err
	}
	out := map[string]any{}
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, err
	}
	out["target_division_ids"] = targets.divisions[e.ID]
	out["target_role_ids"] = targets.roles[e.ID]
	out["is_participant"] = isParticipant
	if e.DivisionID != nil {
		if d, err := orm.GetByID[models.Division](ctx, *e.DivisionID); err == nil && d != nil {
			out["division"] = map[string]any{"id": d.ID, "name": d.Name}
		}
	}
	if att, err := orm.Objects[models.Attendance](ctx).
		Filter("event_id", id).Filter("user_id", user.ID).First(); err == nil && att != nil {
		out["my_attendance_status"] = att.Status
	}
	if pr, err := orm.Objects[models.PermissionRequest](ctx).
		Filter("event_id", id).Filter("user_id", user.ID).OrderBy("-id").First(); err == nil && pr != nil {
		out["my_permission_request_status"] = pr.Status
	}
	return out, nil
}

func (EventService) Create(ctx context.Context, e *models.Event, divisionIDs, roleIDs []int64) (*models.Event, error) {
	if e.Audience == "" {
		e.Audience = "custom"
	}
	if err := validateAudience(e.Audience, divisionIDs, roleIDs); err != nil {
		return nil, err
	}
	if e.EndTime.IsZero() {
		e.EndTime = endOfDay(e.StartTime)
	}
	if e.Status != "cancelled" {
		e.Status = computeEventStatus(e.StartTime, e.EndTime, time.Now())
	}
	created, err := orm.Create(ctx, e)
	if err != nil {
		return nil, err
	}
	if created.Audience == "custom" {
		if err := SetEventTargets(ctx, created.ID, divisionIDs, roleIDs); err != nil {
			return nil, err
		}
	}
	return created, nil
}

func (EventService) Update(ctx context.Context, id int64, values map[string]any) (*models.Event, error) {
	existing, err := orm.GetByID[models.Event](ctx, id)
	if err != nil {
		return nil, err
	}
	start := existing.StartTime
	end := existing.EndTime
	if v, ok := values["start_time"]; ok {
		if t, ok := v.(time.Time); ok {
			start = t
		}
	}
	if v, ok := values["end_time"]; ok {
		if t, ok := v.(time.Time); ok {
			end = t
		}
	}
	if end.IsZero() {
		end = endOfDay(start)
		values["end_time"] = end
	}
	delete(values, "status")
	if existing.Status != "cancelled" {
		values["status"] = computeEventStatus(start, end, time.Now())
	}
	divisionIDs, hasDivisions := values["target_division_ids"].([]int64)
	roleIDs, hasRoles := values["target_role_ids"].([]int64)
	delete(values, "target_division_ids")
	delete(values, "target_role_ids")

	audienceName := existing.Audience
	if v, ok := values["audience"].(string); ok && v != "" {
		audienceName = v
	}
	if hasDivisions || hasRoles || audienceName != existing.Audience {
		if err := validateAudience(audienceName, divisionIDs, roleIDs); err != nil {
			return nil, err
		}
	}

	updated, err := orm.UpdateByID[models.Event](ctx, id, values)
	if err != nil {
		return nil, err
	}
	if hasDivisions || hasRoles {
		// Replace-all: form edit selalu mengirim daftar cakupan lengkap.
		if err := SetEventTargets(ctx, id, divisionIDs, roleIDs); err != nil {
			return nil, err
		}
	}
	return updated, nil
}

// Delete menghapus event beserta absensi dan pengajuan izinnya dalam satu
// transaksi — tidak bergantung pada ON DELETE CASCADE di level database.
func (EventService) Delete(ctx context.Context, id int64) error {
	return orm.WithTx(ctx, func(txCtx context.Context, _ *orm.Tx) error {
		if _, err := orm.Objects[models.EventTargetDivision](txCtx).
			Filter("event_id", id).Delete(); err != nil {
			return err
		}
		if _, err := orm.Objects[models.EventTargetRole](txCtx).
			Filter("event_id", id).Delete(); err != nil {
			return err
		}
		if _, err := orm.Objects[models.Attendance](txCtx).
			Filter("event_id", id).Delete(); err != nil {
			return err
		}
		if _, err := orm.Objects[models.PermissionRequest](txCtx).
			Filter("event_id", id).Delete(); err != nil {
			return err
		}
		_, err := orm.DeleteByID[models.Event](txCtx, id)
		return err
	})
}

func (EventService) TransitionStatuses(ctx context.Context) error {
	all, err := orm.Objects[models.Event](ctx).All()
	if err != nil {
		return err
	}
	now := time.Now()
	for _, e := range all {
		if e.Status == "cancelled" {
			continue
		}
		next := computeEventStatus(e.StartTime, e.EndTime, now)
		if next == e.Status {
			continue
		}
		if _, err := orm.UpdateByID[models.Event](ctx, e.ID, map[string]any{"status": next}); err != nil {
			return err
		}
	}
	return nil
}

// Recap menyusun rekap dari roster peserta event, bukan dari tabel attendance.
// Efeknya "Tidak Hadir" benar-benar terhitung — sebelumnya user yang tidak
// absen tidak muncul di rekap sama sekali (DESIGN §6.11).
func (EventService) Recap(ctx context.Context, eventID int64) (map[string]any, error) {
	event, err := orm.GetByID[models.Event](ctx, eventID)
	if err != nil {
		return nil, err
	}
	roster, err := (EventService{}).EventAudience(ctx, eventID)
	if err != nil {
		return nil, err
	}
	attendances, err := orm.Objects[models.Attendance](ctx).Filter("event_id", eventID).All()
	if err != nil {
		return nil, err
	}
	byUser := map[int64]*models.Attendance{}
	for _, a := range attendances {
		byUser[a.UserID] = a
	}

	counts := map[string]int{"present": 0, "permitted": 0, "absent": 0, "rejected": 0}
	rows := make([]map[string]any, 0, len(roster)+len(attendances))
	inRoster := make(map[int64]struct{}, len(roster))
	for _, u := range roster {
		inRoster[u.ID] = struct{}{}
		status := "absent"
		if a, ok := byUser[u.ID]; ok {
			status = a.Status
		}
		counts[status]++
		rows = append(rows, map[string]any{
			"user_id":   u.ID,
			"status":    status,
			"user":      map[string]any{"id": u.ID, "username": u.Username, "full_name": u.FullName, "avatar_url": u.AvatarURL},
			"full_name": u.FullName,
		})
	}
	// Sudah tercatat tapi di luar roster (mis. cakupan event diubah setelah
	// absen) tetap ikut tampil supaya tidak ada data yang tersembunyi.
	for _, a := range attendances {
		if _, ok := inRoster[a.UserID]; ok {
			continue
		}
		counts[a.Status]++
		rows = append(rows, enrichAttendances(ctx, []*models.Attendance{a})[0])
	}
	counts["total"] = len(rows)
	return map[string]any{
		"event": event, "attendances": rows, "summary": counts,
	}, nil
}

func enrichAttendances(ctx context.Context, attendances []*models.Attendance) []map[string]any {
	if len(attendances) == 0 {
		return []map[string]any{}
	}
	userIDs := make([]int64, 0, len(attendances))
	seen := map[int64]struct{}{}
	for _, a := range attendances {
		if _, ok := seen[a.UserID]; ok {
			continue
		}
		seen[a.UserID] = struct{}{}
		userIDs = append(userIDs, a.UserID)
	}
	userMap := map[int64]*models.User{}
	for _, uid := range userIDs {
		u, err := orm.GetByID[models.User](ctx, uid)
		if err == nil && u != nil {
			userMap[uid] = u
		}
	}
	out := make([]map[string]any, len(attendances))
	for i, a := range attendances {
		item := map[string]any{
			"id":            a.ID,
			"event_id":      a.EventID,
			"user_id":       a.UserID,
			"status":        a.Status,
			"selfie_url":    a.SelfieURL,
			"signature_url": a.SignatureURL,
			"checked_in_at": a.CheckedInAt,
		}
		if a.CheckedInAt != nil {
			item["attended_at"] = a.CheckedInAt
		}
		if u, ok := userMap[a.UserID]; ok {
			item["user"] = map[string]any{
				"id":         u.ID,
				"username":   u.Username,
				"email":      u.Email,
				"full_name":  u.FullName,
				"avatar_url": u.AvatarURL,
			}
			item["full_name"] = u.FullName
		}
		out[i] = item
	}
	return out
}

type AttendanceService struct{}

func (AttendanceService) Submit(ctx context.Context, eventID, userID int64, selfieData, signatureData string) (*models.Attendance, error) {
	event, err := orm.GetByID[models.Event](ctx, eventID)
	if err != nil {
		return nil, err
	}
	if event.Status != "ongoing" {
		return nil, fmt.Errorf("event sedang tidak berlangsung")
	}
	// Cakupan: hanya peserta event yang boleh tercatat, sekalipun tahu event_id.
	participant, err := IsEventParticipant(ctx, eventID, userID)
	if err != nil {
		return nil, err
	}
	if !participant {
		return nil, ErrForbidden
	}
	existing, err := orm.Objects[models.Attendance](ctx).
		Filter("event_id", eventID).Filter("user_id", userID).First()
	if err == nil && existing != nil {
		return nil, fmt.Errorf("anda sudah tercatat absen di event ini")
	}
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	// Sudah mengajukan izin (pending/disetujui) → tidak boleh absen lagi.
	pr, err := orm.Objects[models.PermissionRequest](ctx).
		Filter("event_id", eventID).Filter("user_id", userID).OrderBy("-id").First()
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if pr != nil && (pr.Status == "pending" || pr.Status == "approved") {
		return nil, fmt.Errorf("anda sudah mengajukan izin untuk event ini")
	}

	selfieBytes, selfieCT, err := decodeUpload(selfieData)
	if err != nil {
		return nil, fmt.Errorf("selfie tidak valid: %w", err)
	}
	sigBytes, sigCT, err := decodeUpload(signatureData)
	if err != nil {
		return nil, fmt.Errorf("tanda tangan tidak valid: %w", err)
	}

	selfieKey := storageutil.Key(fmt.Sprintf("attendance/selfies/%d", eventID), fmt.Sprintf("%d.jpg", userID))
	selfieURL, err := storageutil.Upload(ctx, selfieKey, selfieBytes, selfieCT)
	if err != nil {
		return nil, err
	}
	sigKey := storageutil.Key(fmt.Sprintf("attendance/signatures/%d", eventID), fmt.Sprintf("%d.png", userID))
	sigURL, err := storageutil.Upload(ctx, sigKey, sigBytes, sigCT)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	return orm.Create(ctx, &models.Attendance{
		EventID: eventID, UserID: userID, Status: "present",
		SelfieURL: selfieURL, SignatureURL: sigURL, CheckedInAt: &now,
	})
}

func (AttendanceService) GetMine(ctx context.Context, eventID, userID int64) (*models.Attendance, error) {
	return orm.Objects[models.Attendance](ctx).
		Filter("event_id", eventID).Filter("user_id", userID).First()
}

func decodeUpload(data string) ([]byte, string, error) {
	if strings.HasPrefix(data, "data:") {
		return storageutil.DecodeDataURL(data)
	}
	return []byte(data), "application/octet-stream", nil
}

// PermissionLeadTime: pengajuan izin ditutup 3 jam sebelum event mulai.
const PermissionLeadTime = 3 * time.Hour

// PermissionDeadline: batas akhir pengajuan izin untuk sebuah event.
func PermissionDeadline(start time.Time) time.Time {
	return start.Add(-PermissionLeadTime)
}

// PermissionClosed: true kalau pengajuan izin sudah tidak boleh dikirim.
// Termasuk saat event sudah berjalan (now pasti melewati start - 3 jam).
func PermissionClosed(start, now time.Time) bool {
	return now.After(PermissionDeadline(start))
}

type PermissionCategoryService struct{}

func (PermissionCategoryService) List(ctx context.Context) ([]*models.PermissionCategory, error) {
	return orm.Objects[models.PermissionCategory](ctx).OrderBy("name").All()
}

func (PermissionCategoryService) Create(ctx context.Context, name, description string) (*models.PermissionCategory, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, fmt.Errorf("nama kategori wajib diisi")
	}
	return orm.Create(ctx, &models.PermissionCategory{Name: name, Description: description})
}

func (PermissionCategoryService) Update(ctx context.Context, id int64, values map[string]any) (*models.PermissionCategory, error) {
	if raw, ok := values["name"]; ok {
		name, _ := raw.(string)
		name = strings.TrimSpace(name)
		if name == "" {
			return nil, fmt.Errorf("nama kategori wajib diisi")
		}
		values["name"] = name
	}
	return orm.UpdateByID[models.PermissionCategory](ctx, id, values)
}

// Delete menolak kategori yang masih dipakai pengajuan izin — tanpa guard ini
// foreign key `permission_request.category_id` bocor jadi 500.
func (PermissionCategoryService) Delete(ctx context.Context, id int64) error {
	if _, err := orm.GetByID[models.PermissionCategory](ctx, id); err != nil {
		return ErrNotFound
	}
	count, err := orm.Objects[models.PermissionRequest](ctx).Filter("category_id", id).Count()
	if err != nil {
		return err
	}
	if count > 0 {
		return fmt.Errorf("kategori masih dipakai oleh %d pengajuan izin", count)
	}
	_, err = orm.DeleteByID[models.PermissionCategory](ctx, id)
	return err
}

type PermissionRequestService struct{}

// Create menegakkan aturan pengajuan izin di server: event membuka izin, belum
// lewat batas H-3 jam, pengaju peserta, kategori valid, dan bukti gambar wajib
// (dikonversi ke WebP oleh imageutil sebelum disimpan).
func (PermissionRequestService) Create(ctx context.Context, eventID, userID, categoryID int64, reason, proofData string) (*models.PermissionRequest, error) {
	event, err := orm.GetByID[models.Event](ctx, eventID)
	if err != nil {
		return nil, err
	}
	if !event.AllowPermission {
		return nil, fmt.Errorf("event ini tidak membuka perizinan")
	}
	// Izin menempel pada absensi, jadi hanya berlaku sampai event selesai.
	if event.Status == "finished" || event.Status == "cancelled" {
		return nil, fmt.Errorf("event sudah selesai")
	}
	if PermissionClosed(event.StartTime, time.Now()) {
		return nil, fmt.Errorf("pengajuan izin ditutup %d jam sebelum event mulai", int(PermissionLeadTime.Hours()))
	}
	if _, err := orm.GetByID[models.PermissionCategory](ctx, categoryID); err != nil {
		return nil, fmt.Errorf("kategori izin tidak ditemukan")
	}
	participant, err := IsEventParticipant(ctx, eventID, userID)
	if err != nil {
		return nil, err
	}
	if !participant {
		return nil, ErrForbidden
	}
	// Sudah tercatat hadir/izin di event ini → tidak boleh mengajukan izin lagi.
	att, err := orm.Objects[models.Attendance](ctx).
		Filter("event_id", eventID).Filter("user_id", userID).First()
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if att != nil && (att.Status == "present" || att.Status == "permitted") {
		return nil, fmt.Errorf("anda sudah tercatat di event ini")
	}
	// Pengajuan sebelumnya yang masih pending/disetujui tidak boleh diduplikasi;
	// pengajuan yang ditolak boleh diajukan ulang.
	prev, err := orm.Objects[models.PermissionRequest](ctx).
		Filter("event_id", eventID).Filter("user_id", userID).OrderBy("-id").First()
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if prev != nil && (prev.Status == "pending" || prev.Status == "approved") {
		return nil, fmt.Errorf("pengajuan izin anda sudah tercatat untuk event ini")
	}
	// Bukti wajib: gambar apa pun dari klien dinormalkan ke WebP lebih dulu,
	// jadi yang tersimpan di storage selalu image/webp.
	raw, _, err := decodeUpload(proofData)
	if err != nil {
		return nil, fmt.Errorf("bukti gambar wajib diunggah")
	}
	compressed, err := imageutil.WebP(raw)
	if err != nil {
		return nil, err
	}
	key := storageutil.Key("permissions/proofs", fmt.Sprintf("%d-%d.webp", eventID, userID))
	proofURL, err := storageutil.Upload(ctx, key, compressed, "image/webp")
	if err != nil {
		return nil, err
	}
	return orm.Create(ctx, &models.PermissionRequest{
		EventID: eventID, UserID: userID, CategoryID: categoryID,
		Reason: strings.TrimSpace(reason), ProofURL: proofURL, Status: "pending",
	})
}

// manageableEventIDs: event yang boleh direview user ini — buatan sendiri atau
// milik divisinya (divisi penyelenggara). Satu query event lalu difilter di
// memori, mengikuti pola resolusi cakupan event yang lain.
func manageableEventIDs(ctx context.Context, user *auth.User) (map[int64]bool, error) {
	divisionID, err := userDivisionID(ctx, user.ID)
	if err != nil {
		return nil, err
	}
	events, err := orm.Objects[models.Event](ctx).All()
	if err != nil {
		return nil, err
	}
	ids := make(map[int64]bool, len(events))
	for _, e := range events {
		if ownedBy(e.CreatedByID, user.ID) || (e.DivisionID != nil && divisionID != 0 && *e.DivisionID == divisionID) {
			ids[e.ID] = true
		}
	}
	return ids, nil
}

// CanReview: pemegang attendance.approve (atau system admin) boleh semua event;
// pemegang attendance.approve_own hanya event yang mereka kelola — aturan yang
// sama dengan edit/hapus event (CanManageEvent).
func (PermissionRequestService) CanReview(ctx context.Context, pr *models.PermissionRequest, user *auth.User, canApproveAll bool) (bool, error) {
	if canApproveAll || user.IsSystemAdmin {
		return true, nil
	}
	event, err := orm.GetByID[models.Event](ctx, pr.EventID)
	if err != nil {
		return false, err
	}
	return CanManageEvent(ctx, event, user)
}

// ListReviewable: daftar pengajuan yang boleh dilihat approver. Kadiv/Sekdiv
// (approve_own) hanya melihat pengajuan event mereka, bukan seluruh organisasi.
func (PermissionRequestService) ListReviewable(ctx context.Context, user *auth.User, canApproveAll bool) ([]map[string]any, error) {
	if canApproveAll || user.IsSystemAdmin {
		return (PermissionRequestService{}).ListAllDetailed(ctx)
	}
	allowed, err := manageableEventIDs(ctx, user)
	if err != nil {
		return nil, err
	}
	list, err := orm.Objects[models.PermissionRequest](ctx).OrderBy("-id").All()
	if err != nil {
		return nil, err
	}
	mine := make([]*models.PermissionRequest, 0, len(list))
	for _, pr := range list {
		if allowed[pr.EventID] {
			mine = append(mine, pr)
		}
	}
	return enrichPermissionRequests(ctx, mine, true)
}

func (PermissionRequestService) ListPending(ctx context.Context) ([]*models.PermissionRequest, error) {
	return orm.Objects[models.PermissionRequest](ctx).
		Filter("status", "pending").OrderBy("-id").All()
}

// ListAllDetailed mengembalikan semua pengajuan izin (semua status) dilengkapi
// ringkasan user pengaju dan event untuk tabel approval admin.
func (PermissionRequestService) ListAllDetailed(ctx context.Context) ([]map[string]any, error) {
	list, err := orm.Objects[models.PermissionRequest](ctx).OrderBy("-id").All()
	if err != nil {
		return nil, err
	}
	return enrichPermissionRequests(ctx, list, true)
}

// ListMineDetailed: pengajuan milik satu user dengan ringkasan event (tanpa
// data user — pemiliknya sudah tahu dirinya sendiri).
func (PermissionRequestService) ListMineDetailed(ctx context.Context, userID int64) ([]map[string]any, error) {
	list, err := orm.Objects[models.PermissionRequest](ctx).
		Filter("user_id", userID).OrderBy("-id").All()
	if err != nil {
		return nil, err
	}
	return enrichPermissionRequests(ctx, list, false)
}

func enrichPermissionRequests(ctx context.Context, list []*models.PermissionRequest, withUser bool) ([]map[string]any, error) {
	userMap := map[int64]*models.User{}
	eventMap := map[int64]*models.Event{}
	categoryMap := map[int64]*models.PermissionCategory{}
	out := make([]map[string]any, len(list))
	for i, pr := range list {
		raw, err := json.Marshal(pr)
		if err != nil {
			return nil, err
		}
		item := map[string]any{}
		if err := json.Unmarshal(raw, &item); err != nil {
			return nil, err
		}
		if withUser {
			if _, ok := userMap[pr.UserID]; !ok {
				if u, err := orm.GetByID[models.User](ctx, pr.UserID); err == nil {
					userMap[pr.UserID] = u
				}
			}
			if u := userMap[pr.UserID]; u != nil {
				item["user"] = map[string]any{
					"id":         u.ID,
					"username":   u.Username,
					"full_name":  u.FullName,
					"avatar_url": u.AvatarURL,
				}
			}
		}
		if _, ok := eventMap[pr.EventID]; !ok {
			if e, err := orm.GetByID[models.Event](ctx, pr.EventID); err == nil {
				eventMap[pr.EventID] = e
			}
		}
		if e := eventMap[pr.EventID]; e != nil {
			item["event"] = map[string]any{
				"id":         e.ID,
				"title":      e.Title,
				"start_time": e.StartTime,
			}
		}
		if _, ok := categoryMap[pr.CategoryID]; !ok {
			if c, err := orm.GetByID[models.PermissionCategory](ctx, pr.CategoryID); err == nil {
				categoryMap[pr.CategoryID] = c
			}
		}
		if c := categoryMap[pr.CategoryID]; c != nil {
			item["category"] = map[string]any{"id": c.ID, "name": c.Name}
		}
		out[i] = item
	}
	return out, nil
}

// Delete menghapus pengajuan izin. Attendance turunan hasil review
// (permitted/rejected) ikut dihapus supaya anggota bisa absen atau mengajukan
// izin ulang; attendance hasil check-in asli (present) tidak disentuh.
func (PermissionRequestService) Delete(ctx context.Context, id int64) error {
	return orm.WithTx(ctx, func(txCtx context.Context, _ *orm.Tx) error {
		pr, err := orm.GetByID[models.PermissionRequest](txCtx, id)
		if err != nil {
			return err
		}
		att, err := orm.Objects[models.Attendance](txCtx).
			Filter("event_id", pr.EventID).Filter("user_id", pr.UserID).First()
		if err != nil && err != sql.ErrNoRows {
			return err
		}
		if att != nil && (att.Status == "permitted" || att.Status == "rejected") {
			if _, err := orm.DeleteByID[models.Attendance](txCtx, att.ID); err != nil {
				return err
			}
		}
		_, err = orm.DeleteByID[models.PermissionRequest](txCtx, id)
		return err
	})
}

func (PermissionRequestService) Review(ctx context.Context, id int64, reviewer *auth.User, canApproveAll, approve bool, note string) (*models.PermissionRequest, error) {
	existing, err := orm.GetByID[models.PermissionRequest](ctx, id)
	if err != nil {
		return nil, err
	}
	allowed, err := (PermissionRequestService{}).CanReview(ctx, existing, reviewer, canApproveAll)
	if err != nil {
		return nil, err
	}
	if !allowed {
		return nil, ErrForbidden
	}
	var result *models.PermissionRequest
	err = orm.WithTx(ctx, func(txCtx context.Context, _ *orm.Tx) error {
		pr, err := orm.GetByID[models.PermissionRequest](txCtx, id)
		if err != nil {
			return err
		}
		if pr.Status != "pending" {
			return fmt.Errorf("pengajuan ini sudah direview")
		}
		now := time.Now()
		status := "rejected"
		attStatus := "rejected"
		if approve {
			status = "approved"
			attStatus = "permitted"
		}
		result, err = orm.UpdateByID[models.PermissionRequest](txCtx, id, map[string]any{
			"status": status, "reviewed_by_id": reviewer.ID, "review_note": note, "reviewed_at": now,
		})
		if err != nil {
			return err
		}
		att, err := orm.Objects[models.Attendance](txCtx).
			Filter("event_id", pr.EventID).Filter("user_id", pr.UserID).First()
		if err == sql.ErrNoRows {
			now2 := time.Now()
			_, err = orm.Create(txCtx, &models.Attendance{
				EventID: pr.EventID, UserID: pr.UserID, Status: attStatus, CheckedInAt: &now2,
			})
			return err
		}
		if err != nil {
			return err
		}
		_, err = orm.UpdateByID[models.Attendance](txCtx, att.ID, map[string]any{"status": attStatus})
		return err
	})
	return result, err
}

type ViolationService struct{}

func (ViolationService) List(ctx context.Context, userID int64) ([]*models.Violation, error) {
	qs := orm.Objects[models.Violation](ctx)
	if userID > 0 {
		qs = qs.Filter("user_id", userID)
	}
	return qs.OrderBy("-issued_date").All()
}

// ListDetailed melengkapi pelanggaran dengan ringkasan user terhukum dan
// penerbit untuk tabel admin (nama asli, bukan "User #n").
func (ViolationService) ListDetailed(ctx context.Context, userID int64) ([]map[string]any, error) {
	list, err := (ViolationService{}).List(ctx, userID)
	if err != nil {
		return nil, err
	}
	userMap := map[int64]*models.User{}
	summary := func(id int64) map[string]any {
		if _, ok := userMap[id]; !ok {
			if u, err := orm.GetByID[models.User](ctx, id); err == nil {
				userMap[id] = u
			}
		}
		u := userMap[id]
		if u == nil {
			return nil
		}
		return map[string]any{
			"id": u.ID, "username": u.Username,
			"full_name": u.FullName, "avatar_url": u.AvatarURL,
		}
	}
	out := make([]map[string]any, len(list))
	for i, v := range list {
		raw, err := json.Marshal(v)
		if err != nil {
			return nil, err
		}
		item := map[string]any{}
		if err := json.Unmarshal(raw, &item); err != nil {
			return nil, err
		}
		if v.UserID != nil {
			if u := summary(*v.UserID); u != nil {
				item["user"] = u
			}
		}
		if v.IssuedByID != nil {
			if ib := summary(*v.IssuedByID); ib != nil {
				item["issued_by"] = ib
			}
		}
		out[i] = item
	}
	return out, nil
}

func (ViolationService) Create(ctx context.Context, v *models.Violation) (*models.Violation, error) {
	return orm.Create(ctx, v)
}

func (ViolationService) Delete(ctx context.Context, id int64) error {
	_, err := orm.DeleteByID[models.Violation](ctx, id)
	return err
}

type RecruitmentService struct{}

func (RecruitmentService) List(ctx context.Context) ([]*models.Recruitment, error) {
	return orm.Objects[models.Recruitment](ctx).OrderBy("-id").All()
}

func (RecruitmentService) Create(ctx context.Context, r *models.Recruitment) (*models.Recruitment, error) {
	return orm.Create(ctx, r)
}

func (RecruitmentService) Update(ctx context.Context, id int64, values map[string]any) (*models.Recruitment, error) {
	return orm.UpdateByID[models.Recruitment](ctx, id, values)
}

func (RecruitmentService) GetBySlug(ctx context.Context, slug string) (*models.Recruitment, error) {
	return orm.Objects[models.Recruitment](ctx).Filter("slug", slug).Filter("status", "open").First()
}

func (RecruitmentService) ListSubmissions(ctx context.Context, recruitmentID int64) ([]*models.RecruitmentSubmission, error) {
	return orm.Objects[models.RecruitmentSubmission](ctx).
		Filter("recruitment_id", recruitmentID).OrderBy("-submitted_at").All()
}

func (RecruitmentService) SubmitPublic(ctx context.Context, slug string, sub *models.RecruitmentSubmission) (*models.RecruitmentSubmission, error) {
	rec, err := RecruitmentService{}.GetBySlug(ctx, slug)
	if err != nil {
		return nil, fmt.Errorf("pendaftaran belum dibuka atau sudah ditutup")
	}
	sub.RecruitmentID = rec.ID
	sub.SubmittedAt = time.Now()
	sub.Status = "submitted"
	return orm.Create(ctx, sub)
}

type LetterService struct{}

func (LetterService) ListCategories(ctx context.Context) ([]*models.LetterCategory, error) {
	return orm.Objects[models.LetterCategory](ctx).OrderBy("code").All()
}

func (LetterService) CreateCategory(ctx context.Context, c *models.LetterCategory) (*models.LetterCategory, error) {
	if c.StartNumber <= 0 {
		c.StartNumber = 1
	}
	if c.NumberFormatTemplate == "" {
		c.NumberFormatTemplate = "{number:3}/{code}/{month_roman}/{year}"
	}
	if c.CurrentNumber < 0 {
		c.CurrentNumber = 0
	}
	return orm.Create(ctx, c)
}

func (LetterService) List(ctx context.Context, letterType string, categoryID int64) ([]*models.Letter, error) {
	qs := orm.Objects[models.Letter](ctx)
	if letterType != "" {
		qs = qs.Filter("type", letterType)
	}
	if categoryID > 0 {
		qs = qs.Filter("category_id", categoryID)
	}
	return qs.OrderBy("-id").All()
}

func (LetterService) CreateOutgoing(ctx context.Context, letter *models.Letter, templateID int64, createdBy int64) (*models.Letter, error) {
	var created *models.Letter
	err := orm.WithTx(ctx, func(txCtx context.Context, _ *orm.Tx) error {
		catID := letter.CategoryID
		cat, err := orm.Objects[models.LetterCategory](txCtx).
			Filter("id", catID).ForUpdate().First()
		if err != nil {
			return err
		}
		nextNum := cat.CurrentNumber + 1
		if nextNum < cat.StartNumber {
			nextNum = cat.StartNumber
		}
		if len(letter.VariableValues) == 0 {
			letter.VariableValues = models.JSONField("{}")
		}
		var vals map[string]string
		_ = json.Unmarshal(letter.VariableValues.Raw(), &vals)
		if vals == nil {
			vals = map[string]string{}
		}
		segments := SegmentsFromVariableValues(vals)
		if letter.LetterCode == "" {
			code, err := FormatLetterNumber(cat.NumberFormatTemplate, nextNum, cat.Code, letter.LetterDate, segments, false)
			if err != nil {
				return err
			}
			letter.LetterCode = code
		}
		letter.Type = "outgoing"
		letter.CreatedByID = &createdBy
		if letter.Subject != "" {
			vals["PERIHAL"] = letter.Subject
			vals["SUBJECT"] = letter.Subject
		}
		if letter.Recipient == "" {
			for _, key := range []string{"TUJUAN_INSTANSI", "PENERIMA", "RECIPIENT", "KEPADA", "TUJUAN"} {
				if v := strings.TrimSpace(vals[key]); v != "" {
					letter.Recipient = v
					break
				}
			}
		}
		if b, err := json.Marshal(vals); err == nil {
			letter.VariableValues = models.JSONField(b)
		}

		// Merge template docx if available.
		if templateID > 0 {
			tmpl, _ := orm.GetByID[models.LetterTemplate](txCtx, templateID)
			if tmpl != nil && tmpl.TemplateURL != "" {
				docx, err := storageutil.ReadURL(txCtx, tmpl.TemplateURL)
				if err == nil {
					repl := map[string]string{
						"{NOMOR_SURAT}": letter.LetterCode,
						"{NOMOR}":       letter.LetterCode,
						"{LETTER_CODE}": letter.LetterCode,
					}
					if letter.Subject != "" {
						repl["{PERIHAL}"] = letter.Subject
						repl["{SUBJECT}"] = letter.Subject
					}
					for k, v := range vals {
						key := k
						if !strings.HasPrefix(key, "{") {
							key = "{" + strings.ToUpper(key) + "}"
						}
						repl[key] = v
					}
					merged, err := letterutil.MergeDocx(docx, repl)
					if err == nil {
						key := storageutil.Key("letters/generated", fmt.Sprintf("letter-%d.docx", time.Now().Unix()))
						url, upErr := storageutil.Upload(txCtx, key, merged, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
						if upErr == nil {
							letter.DocumentURL = url
						}
					}
				}
			}
		}

		created, err = orm.Create(txCtx, letter)
		if err != nil {
			return err
		}
		_, err = orm.UpdateByID[models.LetterCategory](txCtx, cat.ID, map[string]any{"current_number": nextNum})
		return err
	})
	return created, err
}

func (LetterService) CreateIncoming(ctx context.Context, letter *models.Letter, createdBy int64) (*models.Letter, error) {
	if letter.CategoryID == 0 {
		cat, err := orm.Objects[models.LetterCategory](ctx).Filter("code", "SM-IN").First()
		if err == nil {
			letter.CategoryID = cat.ID
		}
	}
	letter.Type = "incoming"
	letter.CreatedByID = &createdBy
	if len(letter.VariableValues) == 0 {
		letter.VariableValues = models.JSONField("{}")
	}
	if letter.AttachmentURL != "" && letter.LetterCode == "" {
		data, err := storageutil.ReadURL(ctx, letter.AttachmentURL)
		if err == nil {
			text, _, err := letterutil.ExtractText(ctx, data, letter.AttachmentURL)
			if err == nil {
				if code, ok := letterutil.DetectLetterCode(text); ok {
					letter.LetterCode = code
				}
			}
		}
	}
	return orm.Create(ctx, letter)
}

type AnnouncementService struct{}

func (AnnouncementService) ListForUser(ctx context.Context, userID int64) ([]*models.Announcement, error) {
	u, err := orm.GetByID[models.User](ctx, userID)
	if err != nil {
		return nil, err
	}
	all, err := orm.Objects[models.Announcement](ctx).OrderBy("-publish_date").All()
	if err != nil {
		return nil, err
	}
	var filtered []*models.Announcement
	for _, a := range all {
		if a.TargetType == "all" {
			filtered = append(filtered, a)
			continue
		}
		if a.TargetDivisionID != nil && *a.TargetDivisionID == u.DivisionID {
			filtered = append(filtered, a)
		}
	}
	return filtered, nil
}

func (AnnouncementService) Create(ctx context.Context, a *models.Announcement) (*models.Announcement, error) {
	return orm.Create(ctx, a)
}

func (AnnouncementService) Update(ctx context.Context, id int64, values map[string]any) (*models.Announcement, error) {
	return orm.UpdateByID[models.Announcement](ctx, id, values)
}

// Delete menghapus announcement beserta lampirannya dalam satu transaksi —
// tidak bergantung pada ON DELETE CASCADE di level database.
func (AnnouncementService) Delete(ctx context.Context, id int64) error {
	return orm.WithTx(ctx, func(txCtx context.Context, _ *orm.Tx) error {
		if _, err := orm.Objects[models.AnnouncementAttachment](txCtx).
			Filter("announcement_id", id).Delete(); err != nil {
			return err
		}
		_, err := orm.DeleteByID[models.Announcement](txCtx, id)
		return err
	})
}

func (AnnouncementService) GetAttachments(ctx context.Context, announcementID int64) ([]*models.AnnouncementAttachment, error) {
	return orm.Objects[models.AnnouncementAttachment](ctx).
		Filter("announcement_id", announcementID).All()
}

type FinanceService struct{}

func (FinanceService) ListCategories(ctx context.Context) ([]*models.FinanceCategory, error) {
	return orm.Objects[models.FinanceCategory](ctx).OrderBy("name").All()
}

func (FinanceService) CreateCategory(ctx context.Context, c *models.FinanceCategory) (*models.FinanceCategory, error) {
	return orm.Create(ctx, c)
}

func (FinanceService) UpdateCategory(ctx context.Context, id int64, values map[string]any) (*models.FinanceCategory, error) {
	return orm.UpdateByID[models.FinanceCategory](ctx, id, values)
}

func (FinanceService) DeleteCategory(ctx context.Context, id int64) error {
	_, err := orm.DeleteByID[models.FinanceCategory](ctx, id)
	return err
}

func (FinanceService) ListTransactions(ctx context.Context) ([]*models.FinanceTransaction, error) {
	return orm.Objects[models.FinanceTransaction](ctx).OrderBy("-transaction_date").All()
}

func (FinanceService) ListTransactionsWithCategories(ctx context.Context) (map[string]any, error) {
	txs, err := orm.Objects[models.FinanceTransaction](ctx).OrderBy("-transaction_date").All()
	if err != nil {
		return nil, err
	}
	cats, err := orm.Objects[models.FinanceCategory](ctx).OrderBy("name").All()
	if err != nil {
		return nil, err
	}
	return map[string]any{"items": txs, "categories": cats}, nil
}

func (FinanceService) CreateTransaction(ctx context.Context, t *models.FinanceTransaction) (*models.FinanceTransaction, error) {
	return orm.Create(ctx, t)
}

func (FinanceService) UpdateTransaction(ctx context.Context, id int64, values map[string]any) (*models.FinanceTransaction, error) {
	return orm.UpdateByID[models.FinanceTransaction](ctx, id, values)
}

func (FinanceService) DeleteTransaction(ctx context.Context, id int64) error {
	_, err := orm.DeleteByID[models.FinanceTransaction](ctx, id)
	return err
}

// walletBalances menghitung saldo tiap wallet: initial_balance + pemasukan - pengeluaran.
func (FinanceService) walletBalances(ctx context.Context) ([]map[string]any, error) {
	wallets, err := orm.Objects[models.Wallet](ctx).OrderBy("name").All()
	if err != nil {
		return nil, err
	}
	txs, err := FinanceService{}.ListTransactions(ctx)
	if err != nil {
		return nil, err
	}
	cats, err := FinanceService{}.ListCategories(ctx)
	if err != nil {
		return nil, err
	}
	catType := map[int64]string{}
	for _, c := range cats {
		catType[c.ID] = c.Type
	}
	income := map[int64]float64{}
	expense := map[int64]float64{}
	count := map[int64]int{}
	for _, t := range txs {
		if t.WalletID == nil {
			continue
		}
		txType := t.Type
		if txType == "" {
			txType = catType[t.CategoryID]
		}
		if txType == "income" {
			income[*t.WalletID] += t.Amount
		} else {
			expense[*t.WalletID] += t.Amount
		}
		count[*t.WalletID]++
	}
	out := make([]map[string]any, len(wallets))
	for i, w := range wallets {
		out[i] = map[string]any{
			"id":                w.ID,
			"name":              w.Name,
			"description":       w.Description,
			"initial_balance":   w.InitialBalance,
			"is_active":         w.IsActive,
			"total_income":      income[w.ID],
			"total_expense":     expense[w.ID],
			"balance":           w.InitialBalance + income[w.ID] - expense[w.ID],
			"transaction_count": count[w.ID],
			"created_at":        w.CreatedAt,
			"updated_at":        w.UpdatedAt,
		}
	}
	return out, nil
}

func (FinanceService) ListWallets(ctx context.Context) ([]map[string]any, error) {
	return FinanceService{}.walletBalances(ctx)
}

func (FinanceService) CreateWallet(ctx context.Context, w *models.Wallet) (*models.Wallet, error) {
	return orm.Create(ctx, w)
}

func (FinanceService) UpdateWallet(ctx context.Context, id int64, values map[string]any) (*models.Wallet, error) {
	return orm.UpdateByID[models.Wallet](ctx, id, values)
}

func (FinanceService) DeleteWallet(ctx context.Context, id int64) error {
	count, err := orm.Objects[models.FinanceTransaction](ctx).Filter("wallet_id", id).Count()
	if err != nil {
		return err
	}
	if count > 0 {
		return fmt.Errorf("wallet masih memiliki %d transaksi; pindahkan atau hapus transaksinya dulu", count)
	}
	_, err = orm.DeleteByID[models.Wallet](ctx, id)
	return err
}

func (FinanceService) Summary(ctx context.Context) (map[string]float64, error) {
	txs, err := FinanceService{}.ListTransactions(ctx)
	if err != nil {
		return nil, err
	}
	cats, err := FinanceService{}.ListCategories(ctx)
	if err != nil {
		return nil, err
	}
	catType := map[int64]string{}
	for _, c := range cats {
		catType[c.ID] = c.Type
	}
	income, expense := 0.0, 0.0
	for _, t := range txs {
		if catType[t.CategoryID] == "income" {
			income += t.Amount
		} else {
			expense += t.Amount
		}
	}
	// Total saldo = akumulasi saldo awal seluruh wallet + pemasukan - pengeluaran.
	initial := 0.0
	wallets, err := orm.Objects[models.Wallet](ctx).All()
	if err != nil {
		return nil, err
	}
	for _, w := range wallets {
		initial += w.InitialBalance
	}
	return map[string]float64{
		"income":          income,
		"expense":         expense,
		"initial_balance": initial,
		"balance":         initial + income - expense,
	}, nil
}

func (FinanceService) Dashboard(ctx context.Context) (map[string]any, error) {
	summary, err := FinanceService{}.Summary(ctx)
	if err != nil {
		return nil, err
	}
	txs, _ := FinanceService{}.ListTransactions(ctx)
	if len(txs) > 10 {
		txs = txs[:10]
	}
	wallets, _ := FinanceService{}.walletBalances(ctx)
	return map[string]any{"summary": summary, "recent": txs, "wallets": wallets}, nil
}

type ProfileService struct{}

var emailPattern = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)

func (ProfileService) Get(ctx context.Context, userID int64) (map[string]any, error) {
	u, err := orm.GetByID[models.User](ctx, userID)
	if err != nil {
		return nil, err
	}
	return userPayload(ctx, u), nil
}

func (ProfileService) Update(ctx context.Context, userID int64, values map[string]any) (*models.User, error) {
	allowed := map[string]bool{"full_name": true, "birth_date": true, "hometown": true, "phone": true, "email": true}
	clean := map[string]any{}
	for k, v := range values {
		if allowed[k] {
			clean[k] = v
		}
	}
	if v, ok := clean["email"]; ok {
		s, _ := v.(string)
		s = strings.ToLower(strings.TrimSpace(s))
		if !emailPattern.MatchString(s) {
			return nil, fmt.Errorf("format email tidak valid")
		}
		existing, err := orm.Objects[models.User](ctx).Filter("email", s).First()
		if err != nil && err != sql.ErrNoRows {
			return nil, err
		}
		if existing != nil && existing.ID != userID {
			return nil, fmt.Errorf("email sudah digunakan akun lain")
		}
		clean["email"] = s
	}
	if v, ok := clean["birth_date"]; ok {
		s, _ := v.(string)
		if s == "" {
			clean["birth_date"] = nil
		} else {
			t, err := timeutil.ParseFlexible(s)
			if err != nil {
				return nil, fmt.Errorf("tanggal lahir tidak valid")
			}
			clean["birth_date"] = t
		}
	}
	if len(clean) == 0 {
		return orm.GetByID[models.User](ctx, userID)
	}
	return orm.UpdateByID[models.User](ctx, userID, clean)
}

func (ProfileService) ChangePassword(ctx context.Context, userID int64, oldPwd, newPwd string) error {
	u, err := orm.GetByID[models.User](ctx, userID)
	if err != nil {
		return err
	}
	if !auth.CheckPassword(u.PasswordHash, oldPwd) {
		return fmt.Errorf("password lama salah")
	}
	return UserService{}.ChangePassword(ctx, userID, newPwd)
}

type ViolationTypeService struct{}

func (ViolationTypeService) List(ctx context.Context) ([]*models.ViolationType, error) {
	return orm.Objects[models.ViolationType](ctx).OrderBy("name").All()
}

func (ViolationTypeService) Create(ctx context.Context, v *models.ViolationType) (*models.ViolationType, error) {
	return orm.Create(ctx, v)
}

func (ViolationTypeService) Update(ctx context.Context, id int64, values map[string]any) (*models.ViolationType, error) {
	return orm.UpdateByID[models.ViolationType](ctx, id, values)
}

func (ViolationTypeService) Delete(ctx context.Context, id int64) error {
	_, err := orm.DeleteByID[models.ViolationType](ctx, id)
	return err
}

func (LetterService) ListTemplates(ctx context.Context) ([]*models.LetterTemplate, error) {
	return orm.Objects[models.LetterTemplate](ctx).OrderBy("name").All()
}

func (LetterService) CreateTemplate(ctx context.Context, t *models.LetterTemplate) (*models.LetterTemplate, error) {
	return orm.Create(ctx, t)
}

func (LetterService) UpdateTemplate(ctx context.Context, id int64, values map[string]any) (*models.LetterTemplate, error) {
	return orm.UpdateByID[models.LetterTemplate](ctx, id, values)
}

func (LetterService) DeleteTemplate(ctx context.Context, id int64) error {
	_, err := orm.DeleteByID[models.LetterTemplate](ctx, id)
	return err
}

func (LetterService) UpdateCategory(ctx context.Context, id int64, values map[string]any) (*models.LetterCategory, error) {
	return orm.UpdateByID[models.LetterCategory](ctx, id, values)
}

func (LetterService) DeleteCategory(ctx context.Context, id int64) error {
	count, _ := orm.Objects[models.Letter](ctx).Filter("category_id", id).Count()
	if count > 0 {
		return fmt.Errorf("kategori masih digunakan oleh %d surat", count)
	}
	_, err := orm.DeleteByID[models.LetterCategory](ctx, id)
	return err
}

func (LetterService) Delete(ctx context.Context, id int64) error {
	_, err := orm.DeleteByID[models.Letter](ctx, id)
	return err
}

func (LetterService) Update(ctx context.Context, id int64, values map[string]any) (*models.Letter, error) {
	return orm.UpdateByID[models.Letter](ctx, id, values)
}

func (LetterService) Get(ctx context.Context, id int64) (*models.Letter, error) {
	return orm.GetByID[models.Letter](ctx, id)
}

func (LetterService) GetTemplate(ctx context.Context, id int64) (*models.LetterTemplate, error) {
	return orm.GetByID[models.LetterTemplate](ctx, id)
}

func (LetterService) GetCategory(ctx context.Context, id int64) (*models.LetterCategory, error) {
	return orm.GetByID[models.LetterCategory](ctx, id)
}

func (LetterService) PreviewNextNumber(ctx context.Context, categoryID int64) (string, error) {
	return LetterService{}.PreviewNumber(ctx, categoryID, time.Now(), nil)
}

func (LetterService) PreviewNumber(ctx context.Context, categoryID int64, date time.Time, segments map[string]string) (string, error) {
	cat, err := orm.GetByID[models.LetterCategory](ctx, categoryID)
	if err != nil {
		return "", err
	}
	nextNum := cat.CurrentNumber + 1
	if nextNum < cat.StartNumber {
		nextNum = cat.StartNumber
	}
	return FormatLetterNumber(cat.NumberFormatTemplate, nextNum, cat.Code, date, segments, true)
}

func (LetterService) BulkDelete(ctx context.Context, ids []int64) int {
	svc := LetterService{}
	deleted := 0
	for _, id := range ids {
		if err := svc.Delete(ctx, id); err == nil {
			deleted++
		}
	}
	return deleted
}

type StorageService struct{}

func (StorageService) ListFolders(ctx context.Context) ([]*models.StorageFolder, error) {
	return orm.Objects[models.StorageFolder](ctx).OrderBy("name").All()
}

func (StorageService) CreateFolder(ctx context.Context, f *models.StorageFolder) (*models.StorageFolder, error) {
	return orm.Create(ctx, f)
}

// DeleteFolder menghapus folder beserta seluruh isinya (subfolder dan file)
// secara rekursif.
func (StorageService) DeleteFolder(ctx context.Context, id int64) error {
	children, err := orm.Objects[models.StorageFolder](ctx).Filter("parent_id", id).All()
	if err != nil {
		return err
	}
	for _, child := range children {
		if err := (StorageService{}).DeleteFolder(ctx, child.ID); err != nil {
			return err
		}
	}
	files, err := orm.Objects[models.StorageFile](ctx).Filter("folder_id", id).All()
	if err != nil {
		return err
	}
	for _, f := range files {
		if err := (StorageService{}).DeleteFile(ctx, f.ID); err != nil {
			return err
		}
	}
	_, err = orm.DeleteByID[models.StorageFolder](ctx, id)
	return err
}

func (StorageService) ListFiles(ctx context.Context, folderID *int64) ([]*models.StorageFile, error) {
	qs := orm.Objects[models.StorageFile](ctx)
	if folderID != nil {
		qs = qs.Filter("folder_id", *folderID)
	}
	return qs.OrderBy("name").All()
}

func (StorageService) CreateFile(ctx context.Context, f *models.StorageFile) (*models.StorageFile, error) {
	return orm.Create(ctx, f)
}

func (StorageService) DeleteFile(ctx context.Context, id int64) error {
	f, err := orm.GetByID[models.StorageFile](ctx, id)
	if err != nil {
		return err
	}
	// Best-effort: hapus juga objek fisiknya dari storage provider.
	if key := StorageKeyFromURL(f.FileURL); key != "" {
		if p := storageutil.Provider(); p != nil {
			_ = p.Delete(ctx, key)
		}
	}
	_, err = orm.DeleteByID[models.StorageFile](ctx, id)
	return err
}

// MoveFile memindahkan file ke folder lain (nil = root).
func (StorageService) MoveFile(ctx context.Context, id int64, folderID *int64) (*models.StorageFile, error) {
	if folderID != nil {
		if _, err := orm.GetByID[models.StorageFolder](ctx, *folderID); err != nil {
			return nil, fmt.Errorf("folder tujuan tidak ditemukan")
		}
	}
	values := map[string]any{"folder_id": nil}
	if folderID != nil {
		values["folder_id"] = *folderID
	}
	return orm.UpdateByID[models.StorageFile](ctx, id, values)
}

type ActivityLogService struct{}

func (ActivityLogService) List(ctx context.Context, userID int64, resourceType string) ([]map[string]any, error) {
	qs := orm.Objects[models.ActivityLog](ctx)
	if userID > 0 {
		qs = qs.Filter("user_id", userID)
	}
	if resourceType != "" {
		qs = qs.Filter("resource_type", resourceType)
	}
	logs, err := qs.OrderBy("-created_at").Limit(200).All()
	if err != nil {
		return nil, err
	}
	userCache := map[int64]string{}
	out := make([]map[string]any, 0, len(logs))
	for _, l := range logs {
		uname := ""
		if l.UserID != nil {
			if cached, ok := userCache[*l.UserID]; ok {
				uname = cached
			} else if u, err := orm.GetByID[models.User](ctx, *l.UserID); err == nil {
				uname = u.FullName
				if uname == "" {
					uname = u.Username
				}
				userCache[*l.UserID] = uname
			}
		}
		out = append(out, map[string]any{
			"id":            l.ID,
			"user_id":       l.UserID,
			"user_name":     uname,
			"action":        l.Action,
			"resource_type": l.ResourceType,
			"resource_id":   l.ResourceID,
			"description":   l.Description,
			"ip_address":    l.IPAddress,
			"created_at":    l.CreatedAt,
		})
	}
	return out, nil
}

func LogActivity(ctx context.Context, userID int64, action, resourceType string, resourceID int64, description string, ip string) {
	orm.Create(ctx, &models.ActivityLog{
		UserID:       &userID,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		Description:  description,
		IPAddress:    ip,
	})
}

package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

	"backend/internal/auth"
	"backend/models"

	"github.com/lrndwy/gokil/orm"
)

// ErrForbidden menandai aksi yang ditolak aturan cakupan, bukan karena error
// teknis. Route menerjemahkannya jadi 403 (bukan 500).
var ErrForbidden = errors.New("akses ditolak")

// ErrNotFound dipakai service saat baris yang diminta tidak ada, supaya route
// bisa mengembalikan 404 alih-alih membocorkan "sql: no rows in result set".
var ErrNotFound = errors.New("not found")

// audience = himpunan peserta sebuah event.
//
// Aturan cakupan (DESIGN §6.11): audience 'all' = seluruh anggota aktif;
// 'custom' = gabungan (OR) user dari divisi target dan user dari role target.
// Satu fungsi ini dipakai bersama oleh filter daftar, guard absen/izin, dan
// rekap supaya ketiganya tidak pernah berbeda pendapat.
type audience struct {
	all bool
	ids map[int64]struct{}
}

func (a audience) has(userID int64) bool {
	if a.all {
		return true
	}
	_, ok := a.ids[userID]
	return ok
}

// targetSets menyimpan baris target semua event sekaligus, supaya daftar event
// tidak menembak satu query per event.
type targetSets struct {
	divisions map[int64][]int64
	roles     map[int64][]int64
}

func loadTargetSets(ctx context.Context) (targetSets, error) {
	ts := targetSets{divisions: map[int64][]int64{}, roles: map[int64][]int64{}}

	divs, err := orm.Objects[models.EventTargetDivision](ctx).All()
	if err != nil {
		return ts, err
	}
	for _, d := range divs {
		ts.divisions[d.EventID] = append(ts.divisions[d.EventID], d.DivisionID)
	}

	roles, err := orm.Objects[models.EventTargetRole](ctx).All()
	if err != nil {
		return ts, err
	}
	for _, r := range roles {
		ts.roles[r.EventID] = append(ts.roles[r.EventID], r.RoleID)
	}
	return ts, nil
}

// resolveAudience menentukan peserta satu event. Audience 'all' tidak butuh
// query user sama sekali — pemanggil tinggal memakai a.has() yang selalu true.
func resolveAudience(ctx context.Context, e *models.Event) (audience, error) {
	if e.Audience == "all" {
		return audience{all: true}, nil
	}
	divisionIDs, err := targetDivisionIDs(ctx, e.ID)
	if err != nil {
		return audience{}, err
	}
	roleIDs, err := targetRoleIDs(ctx, e.ID)
	if err != nil {
		return audience{}, err
	}
	users, err := activeUsers(ctx)
	if err != nil {
		return audience{}, err
	}
	return audienceFromTargets(users, divisionIDs, roleIDs), nil
}

// audienceFromTargets menggabungkan hasil kedua sumbu di memori (OR). Dedupe
// lewat map — user yang divisinya ketarget dan role-nya juga ketarget tetap
// terhitung sekali. Filter status tidak lewat query karena gokil salah
// menomori placeholder saat Filter("__in") digabung filter lain.
func audienceFromTargets(users []*models.User, divisionIDs, roleIDs []int64) audience {
	wantedDivisions := map[int64]struct{}{}
	for _, id := range divisionIDs {
		wantedDivisions[id] = struct{}{}
	}
	wantedRoles := map[int64]struct{}{}
	for _, id := range roleIDs {
		wantedRoles[id] = struct{}{}
	}
	ids := map[int64]struct{}{}
	for _, u := range users {
		if _, ok := wantedDivisions[u.DivisionID]; ok {
			ids[u.ID] = struct{}{}
			continue
		}
		if _, ok := wantedRoles[u.RoleID]; ok {
			ids[u.ID] = struct{}{}
		}
	}
	return audience{ids: ids}
}

// activeUsers memuat roster dasar sekali; resolusi cakupan bekerja di memori.
// ponytail: satu query semua user per resolusi cakupan, pecah ke query per-sumbu
// kalau anggota organisasi sudah ribuan dan daftar event terasa lambat.
func activeUsers(ctx context.Context) ([]*models.User, error) {
	return orm.Objects[models.User](ctx).Filter("status", "active").All()
}

func targetDivisionIDs(ctx context.Context, eventID int64) ([]int64, error) {
	rows, err := orm.Objects[models.EventTargetDivision](ctx).
		Filter("event_id", eventID).All()
	if err != nil {
		return nil, err
	}
	out := make([]int64, 0, len(rows))
	for _, r := range rows {
		out = append(out, r.DivisionID)
	}
	return out, nil
}

func targetRoleIDs(ctx context.Context, eventID int64) ([]int64, error) {
	rows, err := orm.Objects[models.EventTargetRole](ctx).
		Filter("event_id", eventID).All()
	if err != nil {
		return nil, err
	}
	out := make([]int64, 0, len(rows))
	for _, r := range rows {
		out = append(out, r.RoleID)
	}
	return out, nil
}

// EventAudience menerjemahkan cakupan event ke daftar peserta lengkap (untuk
// rekap dan preview jumlah peserta di form). Satu query per sumbu, bukan per
// user.
func (EventService) EventAudience(ctx context.Context, eventID int64) ([]*models.User, error) {
	e, err := orm.GetByID[models.Event](ctx, eventID)
	if err != nil {
		return nil, err
	}
	users, err := activeUsers(ctx)
	if err != nil {
		return nil, err
	}
	if e.Audience == "all" {
		return users, nil
	}
	divisionIDs, err := targetDivisionIDs(ctx, eventID)
	if err != nil {
		return nil, err
	}
	roleIDs, err := targetRoleIDs(ctx, eventID)
	if err != nil {
		return nil, err
	}
	a := audienceFromTargets(users, divisionIDs, roleIDs)
	out := make([]*models.User, 0, len(a.ids))
	for _, u := range users {
		if a.has(u.ID) {
			out = append(out, u)
		}
	}
	return out, nil
}

// EventTargets mengembalikan ID divisi & role target satu event (untuk form edit).
func (EventService) EventTargets(ctx context.Context, eventID int64) ([]int64, []int64, error) {
	divisionIDs, err := targetDivisionIDs(ctx, eventID)
	if err != nil {
		return nil, nil, err
	}
	roleIDs, err := targetRoleIDs(ctx, eventID)
	if err != nil {
		return nil, nil, err
	}
	return divisionIDs, roleIDs, nil
}

// SetEventTargets mengganti seluruh cakupan event (replace-all) dalam satu
// transaksi, pola yang sama dengan ReplacePermissions.
func SetEventTargets(ctx context.Context, eventID int64, divisionIDs, roleIDs []int64) error {
	return orm.WithTx(ctx, func(txCtx context.Context, _ *orm.Tx) error {
		if _, err := orm.Objects[models.EventTargetDivision](txCtx).
			Filter("event_id", eventID).Delete(); err != nil {
			return err
		}
		if _, err := orm.Objects[models.EventTargetRole](txCtx).
			Filter("event_id", eventID).Delete(); err != nil {
			return err
		}
		for _, divisionID := range dedupe(divisionIDs) {
			if _, err := orm.Create(txCtx, &models.EventTargetDivision{
				EventID: eventID, DivisionID: divisionID,
			}); err != nil {
				return err
			}
		}
		for _, roleID := range dedupe(roleIDs) {
			if _, err := orm.Create(txCtx, &models.EventTargetRole{
				EventID: eventID, RoleID: roleID,
			}); err != nil {
				return err
			}
		}
		return nil
	})
}

// eventsWithAudience melengkapi setiap event dengan label cakupan supaya
// daftar bisa menampilkan "untuk siapa" tanpa query per event.
func (EventService) EventsWithAudience(ctx context.Context, events []*models.Event) ([]map[string]any, error) {
	if len(events) == 0 {
		return []map[string]any{}, nil
	}
	targets, err := loadTargetSets(ctx)
	if err != nil {
		return nil, err
	}
	divisionNames := map[int64]string{}
	if divs, err := orm.Objects[models.Division](ctx).All(); err == nil {
		for _, d := range divs {
			divisionNames[d.ID] = d.Name
		}
	}
	roleNames := map[int64]string{}
	if roles, err := orm.Objects[models.Role](ctx).All(); err == nil {
		for _, r := range roles {
			roleNames[r.ID] = r.Name
		}
	}
	// Warna chip kalender mengikuti divisi PEMBUAT event, jadi sekali load user
	// kita bisa menandai pemiliknya tanpa query per event.
	creatorDivisions := map[int64]int64{}
	if users, err := orm.Objects[models.User](ctx).All(); err == nil {
		for _, u := range users {
			creatorDivisions[u.ID] = u.DivisionID
		}
	}
	out := make([]map[string]any, 0, len(events))
	for _, e := range events {
		raw, err := json.Marshal(e)
		if err != nil {
			return nil, err
		}
		item := map[string]any{}
		if err := json.Unmarshal(raw, &item); err != nil {
			return nil, err
		}
		divisionIDs := targets.divisions[e.ID]
		roleIDs := targets.roles[e.ID]
		item["target_division_ids"] = divisionIDs
		item["target_role_ids"] = roleIDs
		item["target_division_names"] = namesOf(divisionNames, divisionIDs)
		item["target_role_names"] = namesOf(roleNames, roleIDs)
		if e.DivisionID != nil {
			if name, ok := divisionNames[*e.DivisionID]; ok {
				item["division"] = map[string]any{"id": *e.DivisionID, "name": name}
			}
		}
		if e.CreatedByID != nil {
			if divisionID := creatorDivisions[*e.CreatedByID]; divisionID > 0 {
				item["created_by_division_id"] = divisionID
				if name, ok := divisionNames[divisionID]; ok {
					item["created_by_division_name"] = name
				}
			}
		}
		out = append(out, item)
	}
	return out, nil
}

func namesOf(names map[int64]string, ids []int64) []string {
	out := make([]string, 0, len(ids))
	for _, id := range ids {
		if name, ok := names[id]; ok {
			out = append(out, name)
		}
	}
	return out
}

// validateAudience menegakkan aturan form: audience 'custom' wajib punya
// minimal satu divisi atau role target, supaya tidak ada event tanpa peserta.
func validateAudience(audienceName string, divisionIDs, roleIDs []int64) error {
	if audienceName == "all" {
		return nil
	}
	if len(divisionIDs) == 0 && len(roleIDs) == 0 {
		return fmt.Errorf("pilih minimal satu divisi atau role, atau tandai event untuk semua divisi")
	}
	return nil
}

func dedupe(ids []int64) []int64 {
	seen := map[int64]struct{}{}
	out := make([]int64, 0, len(ids))
	for _, id := range ids {
		if id <= 0 {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		out = append(out, id)
	}
	return out
}

// userDivisionID mengambil divisi user yang sedang login (auth.User hanya
// membawa ID dan RoleID).
func userDivisionID(ctx context.Context, userID int64) (int64, error) {
	u, err := orm.GetByID[models.User](ctx, userID)
	if err != nil {
		return 0, err
	}
	return u.DivisionID, nil
}

// ownedBy mencocokkan kolom pembuat dengan user. Kolomnya bisa NULL kalau
// pembuatnya sudah dihapus (FK ON DELETE SET NULL), dan itu bukan pemilik.
func ownedBy(creator *int64, userID int64) bool {
	return creator != nil && *creator == userID
}

// CanManageEvent menegakkan batas edit/hapus: pembuat sendiri, system admin,
// atau pemegang role di divisi penyelenggara event.
func CanManageEvent(ctx context.Context, e *models.Event, user *auth.User) (bool, error) {
	if user.IsSystemAdmin || ownedBy(e.CreatedByID, user.ID) {
		return true, nil
	}
	if e.DivisionID == nil {
		return false, nil
	}
	divisionID, err := userDivisionID(ctx, user.ID)
	if err != nil {
		return false, err
	}
	if divisionID == 0 {
		return false, nil
	}
	return *e.DivisionID == divisionID, nil
}

// IsEventParticipant dipakai guard absen & izin: hanya peserta event yang boleh
// tercatat, meskipun tahu event_id-nya.
func IsEventParticipant(ctx context.Context, eventID, userID int64) (bool, error) {
	e, err := orm.GetByID[models.Event](ctx, eventID)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	a, err := resolveAudience(ctx, e)
	if err != nil {
		return false, err
	}
	return a.has(userID), nil
}

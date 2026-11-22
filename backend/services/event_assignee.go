package services

import (
	"context"
	"errors"

	"backend/models"

	"github.com/lrndwy/gokil/orm"
)

// ErrAssigneeExists menandai user yang sudah ada di daftar peserta event.
var ErrAssigneeExists = errors.New("user sudah ada di daftar peserta")

// EventService.Assign menambahkan user ke daftar peserta event.
//
// assignedBy nil = self-assign (anggota mendaftarkan dirinya sendiri).
// Duplikat ditolak dengan ErrAssigneeExists supaya route bisa membalas 409.
func (EventService) Assign(ctx context.Context, eventID, userID int64, assignedBy *int64) (*models.EventAssignee, error) {
	if _, err := orm.GetByID[models.Event](ctx, eventID); err != nil {
		return nil, ErrNotFound
	}
	if _, err := orm.GetByID[models.User](ctx, userID); err != nil {
		return nil, errors.New("user tidak ditemukan")
	}
	existing, err := orm.Objects[models.EventAssignee](ctx).
		Filter("event_id", eventID).Filter("user_id", userID).All()
	if err != nil {
		return nil, err
	}
	if len(existing) > 0 {
		return nil, ErrAssigneeExists
	}
	return orm.Create(ctx, &models.EventAssignee{
		EventID:      eventID,
		UserID:       userID,
		AssignedByID: assignedBy,
	})
}

// Unassign menghapus satu user dari daftar peserta event.
func (EventService) Unassign(ctx context.Context, eventID, userID int64) error {
	rows, err := orm.Objects[models.EventAssignee](ctx).
		Filter("event_id", eventID).Filter("user_id", userID).All()
	if err != nil {
		return err
	}
	if len(rows) == 0 {
		return ErrNotFound
	}
	for _, row := range rows {
		if _, err := orm.DeleteByID[models.EventAssignee](ctx, row.ID); err != nil {
			return err
		}
	}
	return nil
}

// Assignees mengembalikan daftar peserta sebuah event, selalu array (bukan
// nil) supaya UI tidak perlu mengecek null. Setiap baris memuat nama,
// asal himpunan, dan jabatan user agar bisa langsung ditampilkan.
func (EventService) Assignees(ctx context.Context, eventID int64) ([]map[string]any, error) {
	rows, err := orm.Objects[models.EventAssignee](ctx).
		Filter("event_id", eventID).OrderBy("id").All()
	if err != nil {
		return nil, err
	}
	out := make([]map[string]any, 0, len(rows))
	userCache := map[int64]*models.User{}
	for _, a := range rows {
		u, ok := userCache[a.UserID]
		if !ok {
			if found, err := orm.GetByID[models.User](ctx, a.UserID); err == nil {
				u = found
				userCache[a.UserID] = found
			}
		}
		entry := map[string]any{
			"id":             a.ID,
			"user_id":        a.UserID,
			"assigned_by_id": a.AssignedByID,
			"self_assigned":  a.AssignedByID == nil,
			"created_at":     a.CreatedAt,
		}
		if u != nil {
			entry["full_name"] = u.FullName
			entry["username"] = u.Username
			entry["asal_himpunan"] = u.AsalHimpunan
			entry["jabatan"] = u.Jabatan
			entry["avatar_url"] = u.AvatarURL
		}
		out = append(out, entry)
	}
	return out, nil
}

// withAssignees menempelkan daftar peserta ke representasi map sebuah event.
func withAssignees(ctx context.Context, eventID int64, out map[string]any) error {
	list, err := (EventService{}).Assignees(ctx, eventID)
	if err != nil {
		return err
	}
	out["assignees"] = list
	out["assignee_count"] = len(list)
	return nil
}

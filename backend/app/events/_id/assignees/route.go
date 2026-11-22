package assignees

import (
	"errors"
	"strconv"

	"backend/internal/auth"
	"backend/internal/permission"
	"backend/models"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// GET /events/:id/assignees — daftar peserta (siapa yang berangkat).
func GET(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		ok, _ := permission.UserHas(c, user, "events.view")
		if !ok {
			return c.Error(403, "akses ditolak")
		}
		eventID, err := models.ParseID(c.Param("id"))
		if err != nil {
			return c.Error(400, "id event tidak valid")
		}
		list, err := services.EventService{}.Assignees(c.Request.Context(), eventID)
		if err != nil {
			return c.Error(500, err.Error())
		}
		return c.Success(200, "event assignees", list)
	})(ctx)
}

// POST /events/:id/assignees — tugaskan peserta.
//
// Dua tingkat izin, sama seperti pola approval izin:
//   - Anggota (cukup events.view): hanya boleh menugaskan DIRINYA SENDIRI.
//   - Pengelola event (pembuat / divisi penyelenggara / events.view_all):
//     boleh menugaskan siapa pun lewat `user_id`.
//
// `assigned_by_id` diisi hanya untuk penugasan oleh orang lain; self-assign
// dibiarkan NULL supaya UI bisa membedakan "saya daftar sendiri" dari
// "saya ditugaskan pengurus".
func POST(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		ok, _ := permission.UserHas(c, user, "events.view")
		if !ok {
			return c.Error(403, "akses ditolak")
		}
		eventID, err := models.ParseID(c.Param("id"))
		if err != nil {
			return c.Error(400, "id event tidak valid")
		}

		var body struct {
			UserID *int64 `json:"user_id"`
		}
		_ = c.Bind(&body)

		canManage, err := canManageEvent(c, user, eventID)
		if err != nil {
			return c.Error(404, "event tidak ditemukan")
		}

		targetID := user.ID
		if body.UserID != nil && *body.UserID > 0 {
			if *body.UserID != user.ID && !canManage {
				return c.Error(403, "hanya pengelola event yang bisa menugaskan orang lain")
			}
			targetID = *body.UserID
		}

		var assignedBy *int64
		if targetID != user.ID {
			assignedBy = &user.ID
		}

		row, err := services.EventService{}.Assign(c.Request.Context(), eventID, targetID, assignedBy)
		if err != nil {
			switch {
			case errors.Is(err, services.ErrNotFound):
				return c.Error(404, "event tidak ditemukan")
			case errors.Is(err, services.ErrAssigneeExists):
				return c.Error(409, "user tersebut sudah ada di daftar peserta")
			default:
				return c.Error(400, err.Error())
			}
		}

		services.LogActivity(c.Request.Context(), user.ID, "assign", "event", eventID,
			"Menugaskan user #"+strconv.FormatInt(targetID, 10)+" sebagai peserta event", c.Request.RemoteAddr)
		return c.Success(201, "peserta ditugaskan", row)
	})(ctx)
}

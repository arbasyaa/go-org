package userid

import (
	"errors"

	"backend/internal/auth"
	"backend/internal/permission"
	"backend/models"
	"backend/services"

	"github.com/lrndwy/gokil/orm"
	"github.com/lrndwy/gokil/views"
)

// DELETE /events/:id/assignees/:userId — cabut penugasan peserta.
//
// Anggota boleh mencabut penugasannya sendiri; mencabut orang lain butuh
// kewenangan pengelola event.
func DELETE(ctx *views.Context) error {
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
		targetID, err := models.ParseID(c.Param("userId"))
		if err != nil {
			return c.Error(400, "id user tidak valid")
		}

		if targetID != user.ID {
			e, err := orm.GetByID[models.Event](c.Request.Context(), eventID)
			if err != nil {
				return c.Error(404, "event tidak ditemukan")
			}
			allowed, err := services.CanManageEvent(c.Request.Context(), e, user)
			if err != nil {
				return c.Error(500, err.Error())
			}
			if !allowed {
				allowed, _ = permission.UserHas(c, user, "events.view_all")
			}
			if !allowed {
				return c.Error(403, "hanya pengelola event yang bisa mencabut peserta lain")
			}
		}

		if err := (services.EventService{}).Unassign(c.Request.Context(), eventID, targetID); err != nil {
			if errors.Is(err, services.ErrNotFound) {
				return c.Error(404, "penugasan tidak ditemukan")
			}
			return c.Error(500, err.Error())
		}
		return c.Success(200, "peserta dicabut", nil)
	})(ctx)
}

package id

import (
	"errors"

	"backend/internal/auth"
	"backend/models"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// GET /invitations/:id — detail satu undangan (termasuk daftar penugasan).
func GET(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		id, err := models.ParseID(c.Param("id"))
		if err != nil {
			return c.Error(400, "id tidak valid")
		}
		item, err := services.InvitationService{}.Get(c.Request.Context(), id)
		if err != nil {
			if errors.Is(err, services.ErrNotFound) {
				return c.Error(404, "undangan tidak ditemukan")
			}
			return c.Error(500, err.Error())
		}
		return c.Success(200, "invitation", item)
	})(ctx)
}

// DELETE /invitations/:id — hanya pemegang invitations.manage.
func DELETE(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		if !canManage(c) {
			return c.Error(403, "akses ditolak")
		}
		id, err := models.ParseID(c.Param("id"))
		if err != nil {
			return c.Error(400, "id tidak valid")
		}
		inv, err := services.InvitationService{}.Delete(c.Request.Context(), id)
		if err != nil {
			if errors.Is(err, services.ErrNotFound) {
				return c.Error(404, "undangan tidak ditemukan")
			}
			return c.Error(500, err.Error())
		}
		services.LogActivity(c.Request.Context(), user.ID, "delete", "invitation", id,
			"Menghapus undangan "+inv.EventName, c.Request.RemoteAddr)
		return c.Success(200, "undangan dihapus", nil)
	})(ctx)
}

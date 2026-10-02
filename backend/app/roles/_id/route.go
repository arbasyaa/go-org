package id

import (
	"backend/internal/auth"
	"backend/internal/permission"
	"backend/models"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// writeError: 404 untuk baris yang tidak ada, 400 untuk penolakan aturan
// (nama kosong / sudah dipakai). Sebelumnya semua error jadi 500.
func writeError(c *views.Context, err error, label string) error {
	if err == services.ErrNotFound {
		return c.Error(404, label+" tidak ditemukan")
	}
	return c.Error(400, err.Error())
}

func PUT(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		ok, _ := permission.UserHas(c, user, "roles.edit")
		if !ok {
			return c.Error(403, "akses ditolak")
		}
		id, err := models.ParseID(c.Param("id"))
		if err != nil {
			return c.Error(400, "id tidak valid")
		}
		// Struct bertipe, bukan map bebas: body mentah sempat bisa menulis kolom
		// apa pun (mis. is_system) lewat mass assignment.
		var body struct {
			Name        string `json:"name"`
			Description string `json:"description"`
		}
		if err := c.Bind(&body); err != nil {
			return c.Error(400, err.Error())
		}
		r, err := services.RoleService{}.Update(c.Request.Context(), id, body.Name, body.Description)
		if err != nil {
			return writeError(c, err, "role")
		}
		services.LogActivity(c.Request.Context(), user.ID, "update", "role", id,
			"Memperbarui role", c.Request.RemoteAddr)
		return c.Success(200, "role updated", r)
	})(ctx)
}

func DELETE(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		ok, _ := permission.UserHas(c, user, "roles.delete")
		if !ok {
			return c.Error(403, "akses ditolak")
		}
		id, err := models.ParseID(c.Param("id"))
		if err != nil {
			return c.Error(400, "id tidak valid")
		}
		if err := (services.RoleService{}).Delete(c.Request.Context(), id); err != nil {
			return writeError(c, err, "role")
		}
		services.LogActivity(c.Request.Context(), user.ID, "delete", "role", id,
			"Menghapus role", c.Request.RemoteAddr)
		return c.Success(200, "role deleted", nil)
	})(ctx)
}

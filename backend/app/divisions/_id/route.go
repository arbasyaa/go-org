package id

import (
	"backend/internal/auth"
	"backend/internal/permission"
	"backend/models"
	"backend/services"

	"github.com/lrndwy/gokil/views"
)

// writeError menerjemahkan hasil service (delete/update) ke status yang tepat:
// 404 kalau barisnya tidak ada, 400 tanpa pesan SQL mentah kalau ditolak aturan
// (mis. masih dipakai anggota atau warna tidak dikenal).
func writeError(c *views.Context, err error, label string) error {
	if err == services.ErrNotFound {
		return c.Error(404, label+" tidak ditemukan")
	}
	return c.Error(400, err.Error())
}

func PUT(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		ok, _ := permission.UserHas(c, user, "divisions.edit")
		if !ok {
			return c.Error(403, "akses ditolak")
		}
		id, err := models.ParseID(c.Param("id"))
		if err != nil {
			return c.Error(400, "id tidak valid")
		}
		var body map[string]any
		if err := c.Bind(&body); err != nil {
			return c.Error(400, err.Error())
		}
		d, err := services.DivisionService{}.Update(c.Request.Context(), id, body)
		if err != nil {
			return writeError(c, err, "divisi")
		}
		services.LogActivity(c.Request.Context(), user.ID, "update", "division", id,
			"Memperbarui divisi", c.Request.RemoteAddr)
		return c.Success(200, "division updated", d)
	})(ctx)
}

func DELETE(ctx *views.Context) error {
	return auth.RequireAuth(func(c *views.Context) error {
		user, _ := auth.CurrentUser(c.Request.Context())
		ok, _ := permission.UserHas(c, user, "divisions.delete")
		if !ok {
			return c.Error(403, "akses ditolak")
		}
		id, err := models.ParseID(c.Param("id"))
		if err != nil {
			return c.Error(400, "id tidak valid")
		}
		if err := (services.DivisionService{}).Delete(c.Request.Context(), id); err != nil {
			return writeError(c, err, "divisi")
		}
		services.LogActivity(c.Request.Context(), user.ID, "delete", "division", id,
			"Menghapus divisi", c.Request.RemoteAddr)
		return c.Success(200, "division deleted", nil)
	})(ctx)
}
